
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
  deleteField,
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

let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

// Utility to get a clean RTCPeerConnection
const getPeerConnection = () => {
    // Close any existing connection
    if (pc) {
        pc.close();
    }
    // Create a new one
    pc = new RTCPeerConnection(servers);
    return pc;
}

// Utility to clean up old candidate subcollections
const deleteSubcollection = async (collectionRef) => {
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}

/**
 * DOCTOR-ONLY: Starts the consultation, creating the call document if it doesn't exist
 * and generating the initial offer.
 * @param callId The ID of the consultation.
 * @param localVideoRef Ref to the local video element.
 * @param remoteVideoRef Ref to the remote video element.
 */
export const startCall = async (
    callId: string,
    localVideoRef: React.RefObject<HTMLVideoElement>,
    remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
    pc = getPeerConnection();
    const callDocRef = doc(db, 'calls', callId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    // 1. Get media devices
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();
    localVideoRef.current!.srcObject = localStream;
    remoteVideoRef.current!.srcObject = remoteStream;

    // 2. Push tracks to connection
    localStream.getTracks().forEach(track => pc!.addTrack(track, localStream!));

    // 3. Listen for remote tracks
    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => remoteStream!.addTrack(track));
    };

    // 4. Clean up any previous session data
    await deleteSubcollection(offerCandidates);
    await deleteSubcollection(answerCandidates);

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

    await setDoc(callDocRef, {
        offer,
        active: true,
        startedBy: 'doctor',
        participants: { doctor: true, patient: false },
        answer: deleteField(), // Ensure any old answer is gone
    }, { merge: true });

    // 6. Listen for the patient's answer
    onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (!pc?.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc?.setRemoteDescription(answerDescription);
        }
    });

    // 7. Listen for answer candidates
    onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc?.addIceCandidate(candidate);
            }
        });
    });

    return pc;
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
    pc = getPeerConnection();
    const callDocRef = doc(db, 'calls', callId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    // 1. Get media devices and set up streams
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();
    localVideoRef.current!.srcObject = localStream;
    remoteVideoRef.current!.srcObject = remoteStream;

    localStream.getTracks().forEach(track => pc!.addTrack(track, localStream!));

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => remoteStream!.addTrack(track));
    };

    // 2. Get the offer from Firestore
    const callDoc = await getDoc(callDocRef);
    if (!callDoc.exists() || !callDoc.data().offer) {
        throw new Error("Doctor has not started the call.");
    }
    const offerDescription = callDoc.data().offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    // 3. Create and set answer
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };
    await updateDoc(callDocRef, { answer, 'participants.patient': true });
    
    // 4. Send ICE candidates
    pc.onicecandidate = async (event) => {
        if (event.candidate) {
            await addDoc(answerCandidates, event.candidate.toJSON());
        }
    };
    
    // 5. Listen for offer candidates
    onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc?.addIceCandidate(candidate);
            }
        });
    });

    return pc;
}

/**
 * Gracefully hangs up the call for the current user without ending the session for others.
 * @param callId The ID of the consultation.
 * @param role 'doctor' or 'patient'.
 */
export const hangup = async (callId: string, role: 'doctor' | 'patient') => {
    if (pc) {
        pc.close();
        pc = null;
    }

    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    localStream = null;
    remoteStream = null;
    
    const callDocRef = doc(db, 'calls', callId);
    if ((await getDoc(callDocRef)).exists()) {
        const participantField = `participants.${role}`;
        await updateDoc(callDocRef, { [participantField]: false });
    }
};

/**
 * DOCTOR-ONLY: Ends the consultation for all participants.
 * @param callId The ID of the consultation.
 */
export const endCall = async (callId: string) => {
    // First, hang up the local connection
    await hangup(callId, 'doctor');

    const callDocRef = doc(db, 'calls', callId);
    if ((await getDoc(callDocRef)).exists()) {
       // Mark the call as inactive and clear signaling data
       await updateDoc(callDocRef, {
           active: false,
           offer: deleteField(),
           answer: deleteField(),
       });
       // Clean up candidates
       await deleteSubcollection(collection(callDocRef, 'offerCandidates'));
       await deleteSubcollection(collection(callDocRef, 'answerCandidates'));
    }
};

/**
 * Toggles the mute state for the local audio track and updates Firestore.
 * @returns The new mute state (true if muted, false if not).
 */
export const toggleMute = async (callId: string, role: 'doctor' | 'patient'): Promise<boolean> => {
  let isMuted = false;
  localStream?.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
    isMuted = !track.enabled;
  });

  const callDoc = doc(db, 'calls', callId);
  const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
  if ((await getDoc(callDoc)).exists()) {
    await updateDoc(callDoc, { [field]: isMuted });
  }

  return isMuted;
};

/**
 * Toggles the camera state for the local video track and updates Firestore.
 * @returns The new camera state (true if off, false if on).
 */
export const toggleCamera = async (callId: string, role: 'doctor' | 'patient'): Promise<boolean> => {
  let isCameraOff = false;
  localStream?.getVideoTracks().forEach(track => {
    track.enabled = !track.enabled;
    isCameraOff = !track.enabled;
  });

  const callDoc = doc(db, 'calls', callId);
  const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
  if ((await getDoc(callDoc)).exists()) {
    await updateDoc(callDoc, { [field]: isCameraOff });
  }
  
  return isCameraOff;
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
