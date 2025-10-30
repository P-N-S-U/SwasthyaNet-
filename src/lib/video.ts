
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

    const callDocRef = doc(db, 'calls', callId);
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');
    
    // Aggressively clean up previous session data for a clean start
    await updateDoc(callDocRef, { answer: deleteField() });
    await deleteSubcollection(answerCandidatesCollection);
    await deleteSubcollection(offerCandidatesCollection);
    
    const callDocSnap = await getDoc(callDocRef);
    const callData = callDocSnap.data();

    // Symmetrical logic: if no offer, I'm the caller. If there is an offer, I'm the callee.
    if (!callData?.offer) {
        // I am the CALLER
        console.log("No offer found. Acting as CALLER.");
        
        pc.onicecandidate = event => {
            event.candidate && addDoc(offerCandidatesCollection, event.candidate.toJSON());
        };
        
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDocRef, { offer, patientMuted: false, patientCameraOff: false, doctorMuted: false, doctorCameraOff: false }, { merge: true });

        const answerUnsubscribe = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                console.log("Caller received answer.");
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });
        
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
        // I am the CALLEE
        console.log("Offer exists. Acting as CALLEE.");
        
        pc.onicecandidate = event => {
            event.candidate && addDoc(answerCandidatesCollection, event.candidate.toJSON());
        };

        const offer = callData.offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
        
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
    
    // Set initial mute state based on what's in Firestore, if anything
    const freshCallData = (await getDoc(callDocRef)).data();
    const isDoctor = freshCallData?.doctorId === 'some-way-to-identify-doctor'; // This logic needs to be passed in
    const initialMuteState = isDoctor ? freshCallData?.doctorMuted : freshCallData?.patientMuted;
    localStream?.getAudioTracks().forEach(track => track.enabled = !(initialMuteState ?? false));
    const initialCameraState = isDoctor ? freshCallData?.doctorCameraOff : freshCallData?.patientCameraOff;
    localStream?.getVideoTracks().forEach(track => track.enabled = !(initialCameraState ?? false));

    return pc;
};


export const hangup = async (currentPc: RTCPeerConnection | null, callId?: string) => {
    if (!currentPc) return;
    console.log('Hanging up call.');

    if ((currentPc as any)._unsubscribes) {
        (currentPc as any)._unsubscribes.forEach((unsub: Unsubscribe) => unsub());
    }

    // Stop all local media tracks
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    localStream = null;
    remoteStream = null;
    
    // Close the peer connection
    currentPc.close();

    // No longer cleaning up Firestore state here to allow reconnections.
    // Cleanup is handled at the start of the next createOrJoinCall.
};

export const toggleMute = async (callId: string, role: 'patient' | 'doctor'): Promise<boolean> => {
  let isMuted = false;
  localStream?.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
    isMuted = !track.enabled;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
    await setDoc(callDoc, { [field]: isMuted }, { merge: true });
  }
  return isMuted;
};

export const toggleCamera = async (callId: string, role: 'patient' | 'doctor'): Promise<boolean> => {
  let isCameraOff = false;
  localStream?.getVideoTracks().forEach(track => {
    track.enabled = !track.enabled;
    isCameraOff = !track.enabled;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
    await setDoc(callDoc, { [field]: isCameraOff }, { merge: true });
  }
  return isCameraOff;
};

export const getCall = (id: string, callback: (data: any | null) => void): Unsubscribe => {
  const callDoc = doc(db, 'calls', id);
  return onSnapshot(callDoc, snapshot => {
    callback(snapshot.data() ?? null);
  });
};
