
'use client';

import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  getDoc,
  writeBatch,
  getDocs,
  deleteDoc,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase/firebase';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * DOCTOR-ONLY: Starts the consultation by creating the call document and offer.
 * @param callId The ID of the consultation.
 * @param localVideoRef Ref to the local video element.
 * @param remoteVideoRef Ref to the remote video element.
 */
export const startCall = async (
    callId: string,
    localVideoRef: React.RefObject<HTMLVideoElement>,
    remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
    const pc = new RTCPeerConnection(servers);
    const callDocRef = doc(db, 'calls', callId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    // 1. Get media devices and set up streams
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const remoteStream = new MediaStream();

    localVideoRef.current!.srcObject = localStream;
    remoteVideoRef.current!.srcObject = remoteStream;

    // 2. Push tracks to connection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    // 3. Listen for remote tracks
    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    };

    // 4. Clean up any previous session data aggressively
    const answerCandidatesSnapshot = await getDocs(answerCandidates);
    const offerCandidatesSnapshot = await getDocs(offerCandidates);
    const cleanupBatch = writeBatch(db);
    answerCandidatesSnapshot.forEach(doc => cleanupBatch.delete(doc.ref));
    offerCandidatesSnapshot.forEach(doc => cleanupBatch.delete(doc.ref));
    await cleanupBatch.commit();
    

    // 5. Generate and set offer
    pc.onicecandidate = async (event) => {
        if (event.candidate) {
            await addDoc(offerCandidates, event.candidate.toJSON());
        }
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
    };

    // Create/update the call document with the offer
    await setDoc(callDocRef, {
        offer,
        active: true,
        startedBy: 'doctor',
        participants: { doctor: true, patient: false },
    }, { merge: true });

    // 6. Listen for the patient's answer
    onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (pc && !pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
        }
    });

    // 7. Listen for answer candidates from the patient
    onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });

    return { pc, localStream };
}

/**
 * PATIENT-ONLY: Joins an existing call started by the doctor.
 * @param callId The ID of the consultation.
 * @param localVideoRef Ref to the local video element.
 * @param remoteVideoRef Ref to the remote video element.
 */
export const joinCall = async (
    callId: string,
    localVideoRef: React.RefObject<HTMLVideoElement>,
    remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
    const pc = new RTCPeerConnection(servers);
    const callDocRef = doc(db, 'calls', callId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    // 1. Get media devices and set up streams
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const remoteStream = new MediaStream();
    localVideoRef.current!.srcObject = localStream;
    remoteVideoRef.current!.srcObject = remoteStream;

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    };

    // 2. Get the doctor's offer from Firestore
    const callDoc = await getDoc(callDocRef);
    if (!callDoc.exists() || !callDoc.data().offer) {
        throw new Error("Doctor has not started the call.");
    }
    const offerDescription = callDoc.data().offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    // 3. Create and set the answer
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };
    await updateDoc(callDocRef, { answer, 'participants.patient': true });
    
    // 4. Send ICE candidates to the doctor
    pc.onicecandidate = async (event) => {
        if (event.candidate) {
            await addDoc(answerCandidates, event.candidate.toJSON());
        }
    };
    
    // 5. Listen for ICE candidates from the doctor
    onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });

    return { pc, localStream };
}

/**
 * Gracefully hangs up the call for the current user, updating their presence.
 * @param pc The RTCPeerConnection instance.
 * @param callId The ID of the consultation.
 * @param role 'doctor' or 'patient'.
 */
export const hangup = async (pc: RTCPeerConnection, callId: string, role: 'doctor' | 'patient') => {
    pc.getSenders().forEach(sender => {
        if (sender.track) {
            sender.track.stop();
        }
    });
    pc.close();
    
    const callDocRef = doc(db, 'calls', callId);
    if ((await getDoc(callDocRef)).exists()) {
        const participantField = `participants.${role}`;
        await updateDoc(callDocRef, { [participantField]: false });
    }
};

/**
 * DOCTOR-ONLY: Ends the consultation for all participants by deleting the call document.
 * This is a definitive end to the session.
 * @param callId The ID of the consultation.
 */
export const endCall = async (callId: string) => {
    const callDocRef = doc(db, 'calls', callId);
    
    // Clean up subcollections first
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    
    const offerSnapshot = await getDocs(offerCandidates);
    const answerSnapshot = await getDocs(answerCandidates);

    const deleteBatch = writeBatch(db);
    offerSnapshot.forEach(doc => deleteBatch.delete(doc.ref));
    answerSnapshot.forEach(doc => deleteBatch.delete(doc.ref));
    
    // Finally, delete the main call document
    deleteBatch.delete(callDocRef);
    
    await deleteBatch.commit();
};

/**
 * Subscribes to real-time updates on the call document.
 * @param callId The ID of the consultation.
 * @param callback The function to call with the updated data.
 * @returns An unsubscribe function.
 */
export const onCallUpdate = (callId: string, callback: (data: any | null) => void): Unsubscribe => {
  const callDoc = doc(db, 'calls', callId);
  return onSnapshot(callDoc, snapshot => {
    callback(snapshot.data() ?? null);
  });
};
