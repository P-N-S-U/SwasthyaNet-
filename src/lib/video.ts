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
  remoteVideoRef: React.RefObject<HTMLVideoElement>
): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(servers);
    (pc as any)._unsubscribes = [];
    
    // 1. Setup media
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();

    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream!);
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream?.addTrack(track);
        });
    };

    // 2. Signaling logic
    const callDocRef = doc(db, 'calls', callId);
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');

    const callDocSnap = await getDoc(callDocRef);
    const callDocExists = callDocSnap.exists();
    const existingOffer = callDocExists && callDocSnap.data()?.offer;

    if (!existingOffer) {
        // === This user is the CALLER (first to join or call was reset) ===
        console.log("No offer exists. Acting as CALLER.");

        await deleteSubcollection(offerCandidatesCollection);
        await deleteSubcollection(answerCandidatesCollection);
        
        pc.onicecandidate = event => {
            event.candidate && addDoc(offerCandidatesCollection, event.candidate.toJSON());
        };
        
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDocRef, { offer, answer: deleteField() });

        // Listen for the answer
        const answerUnsubscribe = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                console.log("Caller received answer.");
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });
        
        // Listen for answer candidates
        const answerCandidatesUnsubscribe = onSnapshot(answerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    console.log("Caller adding answer candidate.");
                    pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });

        (pc as any)._unsubscribes.push(answerUnsubscribe, answerCandidatesUnsubscribe);

    } else {
        // === This user is the CALLEE (joining an existing call) ===
        console.log("Offer exists. Acting as CALLEE.");
        
        await deleteSubcollection(answerCandidatesCollection);

        pc.onicecandidate = event => {
            event.candidate && addDoc(answerCandidatesCollection, event.candidate.toJSON());
        };

        await pc.setRemoteDescription(new RTCSessionDescription(existingOffer));
        
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
        
        // Listen for offer candidates
        const offerCandidatesUnsubscribe = onSnapshot(offerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    console.log("Callee adding offer candidate.");
                    pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });

        (pc as any)._unsubscribes.push(offerCandidatesUnsubscribe);
    }

    return pc;
};


export const hangup = async (currentPc: RTCPeerConnection | null, callId?: string) => {
    if (!currentPc) return;
    console.log('Hanging up call.');

    if ((currentPc as any)._unsubscribes) {
        (currentPc as any)._unsubscribes.forEach((unsub: Unsubscribe) => unsub());
    }

    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    localStream = null;
    remoteStream = null;

    currentPc.close();

    // To allow for reconnection, we clear the answer, leaving the offer intact.
    // The next user to join will become a new "callee".
    if (callId) {
        const callDocRef = doc(db, 'calls', callId);
        const callDocSnap = await getDoc(callDocRef);
        if(callDocSnap.exists()) {
             await updateDoc(callDocRef, {
                answer: deleteField(),
             });
            // Also clear old answer candidates for a clean reconnect
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
