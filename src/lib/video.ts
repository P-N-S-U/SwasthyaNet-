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

let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

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
    const pc = new RTCPeerConnection(servers);
    
    // 1. Setup local media
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
    }
    
    // 2. Setup remote media - IMPORTANT: Create fresh MediaStream for this connection
    remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }

    // 3. Push tracks from local stream to peer connection
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream!);
    });

    // 4. Pull tracks from remote stream, add to video stream
    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream?.addTrack(track);
        });
    };

    const callDocRef = doc(db, 'calls', callId);
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');

    const callDocSnap = await getDoc(callDocRef);
    const callDocExists = callDocSnap.exists();
    const existingOffer = callDocExists && callDocSnap.data().offer;

    if (!existingOffer) {
        // === This user is the CALLER (first to join) ===
        
        // Clear old candidates
        await deleteSubcollection(offerCandidatesCollection);
        await deleteSubcollection(answerCandidatesCollection);
        
        pc.onicecandidate = event => {
            event.candidate && addDoc(offerCandidatesCollection, event.candidate.toJSON());
        };
        
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDocRef, { offer }, { merge: true });

        // Listen for answer
        const answerUnsubscribe = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });
        
        // Listen for answer candidates - KEEP THIS ACTIVE for reconnections
        const answerCandidatesUnsubscribe = onSnapshot(answerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });

        // Store unsubscribe functions on pc for cleanup
        (pc as any)._unsubscribes = [answerUnsubscribe, answerCandidatesUnsubscribe];

    } else {
        // === This user is the CALLEE (second to join / rejoining) ===
        
        // CRITICAL FIX: Clear old answer candidates when rejoining
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
        
        // Listen for offer candidates
        const offerCandidatesUnsubscribe = onSnapshot(offerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });

        // Store unsubscribe function on pc for cleanup
        (pc as any)._unsubscribes = [offerCandidatesUnsubscribe];
    }

    return pc;
};

export const hangup = async (currentPc: RTCPeerConnection | null, callId?: string) => {
    // Clean up listeners
    if (currentPc && (currentPc as any)._unsubscribes) {
        (currentPc as any)._unsubscribes.forEach((unsub: Unsubscribe) => unsub());
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }

    if (currentPc) {
        currentPc.close();
    }
  
    // Reset the call document for reconnection, but don't delete it
    if (callId) {
        const callDocRef = doc(db, 'calls', callId);
        const callDocSnap = await getDoc(callDocRef);
        if(callDocSnap.exists()) {
             await updateDoc(callDocRef, {
                answer: deleteField(),
                // Keep the offer so the next person can join
             });
            // Clear answer candidates for clean reconnect
            await deleteSubcollection(collection(callDocRef, 'answerCandidates'));
        }
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
