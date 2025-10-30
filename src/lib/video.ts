
'use client';

import { db } from './firebase/firebase';
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  setDoc,
  getDoc,
  Unsubscribe,
  writeBatch,
  getDocs,
  deleteField,
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let callId: string | null = null;

let unsubscribes: Unsubscribe[] = [];

// Helper to cleanup all listeners
const cleanupListeners = () => {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
};

async function deleteSubcollection(collectionRef) {
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty) {
        return;
    }
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


export const createOrJoinCall = async (
  id: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  userType: 'doctor' | 'patient'
) => {
    // This function will be called every time the component mounts.
    // It's crucial to clean up any previous state.
    if (pc) {
        hangup(pc, callId);
    }
  
    callId = id;
    const callDocRef = doc(db, 'calls', callId);
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');
  
    // Setup local media
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
    }
    
    // Setup remote media
    remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }

    pc = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => {
        pc!.addTrack(track, localStream!);
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
        remoteStream?.addTrack(track);
        });
    };

    const callDocSnap = await getDoc(callDocRef);
    const callDocExists = callDocSnap.exists();
    const existingOffer = callDocExists && callDocSnap.data().offer;

    if (!existingOffer) {
        // === This user is the CALLER (first to join or rejoining after hangup) ===
        
        // Clean up old candidates before creating a new offer
        await Promise.all([
            deleteSubcollection(offerCandidatesCollection),
            deleteSubcollection(answerCandidatesCollection)
        ]);
        
        pc.onicecandidate = event => {
            event.candidate && addDoc(offerCandidatesCollection, event.candidate.toJSON());
        };
        
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        
        // This will create the doc if it doesn't exist, or overwrite the old offer.
        await setDoc(callDocRef, { offer }, { merge: true });

        // Listen for answer from the other peer
        const unsubCall = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc?.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc?.setRemoteDescription(answerDescription);
            }
        });
        unsubscribes.push(unsubCall);
        
        // Listen for ICE candidates from the other peer
        const unsubAnswerCandidates = onSnapshot(answerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc?.addIceCandidate(candidate);
                }
            });
        });
        unsubscribes.push(unsubAnswerCandidates);

    } else {
        // === This user is the CALLEE (second to join) ===
        pc.onicecandidate = event => {
            event.candidate && addDoc(answerCandidatesCollection, event.candidate.toJSON());
        };

        const offerDescription = new RTCSessionDescription(existingOffer);
        await pc.setRemoteDescription(offerDescription);
        
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
        
        const unsubOfferCandidates = onSnapshot(offerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc?.addIceCandidate(candidate);
                }
            });
        });
        unsubscribes.push(unsubOfferCandidates);
    }
};


export const hangup = async (currentPc: typeof pc, currentCallId: string | null) => {
    cleanupListeners();
    
    if (currentPc) {
        currentPc.getSenders().forEach(sender => {
            if (sender.track) {
                sender.track.stop();
            }
        });
        currentPc.close();
    }
  
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
  
    if (currentCallId) {
        const callDocRef = doc(db, 'calls', currentCallId);
        const callDocSnap = await getDoc(callDocRef);
        if (callDocSnap.exists()) {
             // Reset the call document for reconnection by deleting offer and answer
            await updateDoc(callDocRef, {
                offer: deleteField(),
                answer: deleteField(),
            });
        }
    }
  
    remoteStream = null;
    pc = null;
    callId = null;
};


export const toggleMute = async (isMuted: boolean, role: 'patient' | 'doctor') => {
  localStream?.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
    await setDoc(callDoc, { [field]: isMuted }, { merge: true });
  }
};

export const toggleCamera = async (isCameraOff: boolean, role: 'patient' | 'doctor') => {
  localStream?.getVideoTracks().forEach(track => {
    track.enabled = !isCameraOff;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
    await setDoc(callDoc, { [field]: isCameraOff }, { merge: true });
  }
};

// This can be used to listen for remote media state changes and call termination
export const getCall = (id: string, callback: (data: any | null) => void) => {
  const callDoc = doc(db, 'calls', id);
  const unsub = onSnapshot(callDoc, snapshot => {
      callback(snapshot.data() ?? null);
  });
  unsubscribes.push(unsub);
  return unsub;
};
