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
  deleteDoc,
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

// Helper to delete all documents in a subcollection
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
    
    // 1. Get local media stream
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
    }
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream!);
    });

    // 2. Setup remote media stream
    const remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }
    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        });
    };

    const callDocRef = doc(db, 'calls', callId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    // --- Role-based signaling logic ---

    if (userType === 'doctor') {
        // DOCTOR IS ALWAYS THE CALLER
        console.log('Doctor is creating offer...');

        // Clean up previous call state for a fresh start
        await deleteSubcollection(offerCandidates);
        await deleteSubcollection(answerCandidates);
        await setDoc(callDocRef, { offer: deleteField(), answer: deleteField() }, { merge: true });

        pc.onicecandidate = event => {
            event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
        };

        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDocRef, { offer });

        // Listen for the patient's answer
        const unsubAnswer = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                console.log('Doctor received answer.');
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });

        // Listen for ICE candidates from the patient
        const unsubAnswerCandidates = onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    console.log('Doctor adding answer candidate.');
                    pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });
        
        (pc as any)._unsubscribes = [unsubAnswer, unsubAnswerCandidates];

    } else if (userType === 'patient') {
        // PATIENT IS ALWAYS THE CALLEE
        console.log('Patient is creating answer...');

        const callDocSnap = await getDoc(callDocRef);
        if (!callDocSnap.exists() || !callDocSnap.data().offer) {
            throw new Error("Doctor has not started the call yet.");
        }

        pc.onicecandidate = event => {
            event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
        };

        const offerDescription = callDocSnap.data().offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });

        // Listen for ICE candidates from the doctor
        const unsubOfferCandidates = onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    console.log('Patient adding offer candidate.');
                    pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });

        (pc as any)._unsubscribes = [unsubOfferCandidates];
    }
    
    return pc;
};

export const hangup = async (currentPc: RTCPeerConnection | null) => {
    console.log('Hanging up call.');
    
    // Clean up Firestore listeners
    if (currentPc && (currentPc as any)._unsubscribes) {
        (currentPc as any)._unsubscribes.forEach((unsub: Unsubscribe) => unsub());
    }

    // Stop local media tracks
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Close the peer connection
    if (currentPc) {
        currentPc.close();
    }
};

// This function is intended to be called by a server action when the appointment is completed.
export const terminateCall = async (callId: string) => {
    const callDocRef = doc(db, 'calls', callId);
    
    // Delete subcollections first
    await deleteSubcollection(collection(callDocRef, 'offerCandidates'));
    await deleteSubcollection(collection(callDocRef, 'answerCandidates'));

    // Delete the main call document
    await deleteDoc(callDocRef);
}


export const toggleMute = async (isMuted: boolean, callId: string, role: 'patient' | 'doctor') => {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !isMuted;
    });
  }
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
    await setDoc(callDoc, { [field]: isMuted }, { merge: true });
  }
};

export const toggleCamera = async (isCameraOff: boolean, callId: string, role: 'patient' | 'doctor') => {
  if (localStream) {
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !isCameraOff;
    });
  }
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
