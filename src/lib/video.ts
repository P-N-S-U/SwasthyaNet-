
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

let callUnsubscribe: Unsubscribe | null = null;

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
  callId: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  userType: 'doctor' | 'patient'
) => {
    // Ensure any previous connection is fully closed
    if (pc) {
      pc.close();
      pc = null;
    }

    const callDocRef = doc(db, 'calls', callId);
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');

    // 1. Setup local media
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
    }
    
    // 2. Setup remote media
    remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }

    pc = new RTCPeerConnection(servers);

    // 3. Push tracks from local stream to peer connection
    localStream.getTracks().forEach(track => {
        pc!.addTrack(track, localStream!);
    });

    // 4. Pull tracks from remote stream, add to video stream
    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream?.addTrack(track);
        });
    };

    const callDocSnap = await getDoc(callDocRef);
    const callDocExists = callDocSnap.exists();
    const existingOffer = callDocExists && callDocSnap.data().offer;

    if (!existingOffer) {
        // === This user is the CALLER (first to join or rejoining an empty room) ===
        
        // Clean up any old candidates before creating a new offer.
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
        await setDoc(callDocRef, { offer }, { merge: true });

        // Listen for the answer from the other peer
        callUnsubscribe = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc?.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc?.setRemoteDescription(answerDescription);
            }
        });
        
        // Listen for ICE candidates from the callee
        onSnapshot(answerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc?.addIceCandidate(candidate);
                }
            });
        });

    } else {
        // === This user is the CALLEE (second to join) ===
        
        // If we are rejoining as the callee, ensure old answer candidates are gone
        await deleteSubcollection(answerCandidatesCollection);
        
        pc.onicecandidate = event => {
            event.candidate && addDoc(answerCandidatesCollection, event.candidate.toJSON());
        };

        const offerDescription = new RTCSessionDescription(existingOffer);
        await pc.setRemoteDescription(offerDescription);
        
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
        
        // Listen for ICE candidates from the caller
        onSnapshot(offerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc?.addIceCandidate(candidate);
                }
            });
        });
    }

    return pc;
};


export const hangup = async (currentPc: typeof pc) => {
    // This is a local operation only. It does not modify the Firestore document.
    // This allows the other user to stay in the call and wait for reconnection.
    if (callUnsubscribe) {
        callUnsubscribe();
        callUnsubscribe = null;
    }
  
    if (currentPc) {
        currentPc.getSenders().forEach(sender => {
            if (sender.track) {
                sender.track.stop();
            }
        });
        currentPc.close();
        pc = null;
    }
  
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    if(remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
};


export const toggleMute = async (isMuted: boolean, callId: string, role: 'patient' | 'doctor') => {
  localStream?.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
    await setDoc(callDoc, { [field]: isMuted }, { merge: true });
  }
};

export const toggleCamera = async (isCameraOff: boolean, callId: string, role: 'patient' | 'doctor') => {
  localStream?.getVideoTracks().forEach(track => {
    track.enabled = !isCameraOff;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
    await setDoc(callDoc, { [field]: isCameraOff }, { merge: true });
  }
};

export const getCall = (id: string, callback: (data: any | null) => void): Unsubscribe => {
  const callDoc = doc(db, 'calls', id);
  return onSnapshot(callDoc, snapshot => {
      callback(snapshot.data() ?? null);
  });
};
