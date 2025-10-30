
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
  setDoc,
  Unsubscribe,
  deleteDoc,
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

// Store the local stream in a variable accessible by different functions
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

export async function setupLocalStream(
  localVideoRef: React.RefObject<HTMLVideoElement>
): Promise<MediaStream | null> {
    try {
        // if a stream already exists, stop its tracks before getting a new one
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
        return localStream;
    } catch(error) {
        console.error("Error accessing media devices.", error);
        return null;
    }
}


export const createOrJoinCall = async (
  callId: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  role: 'doctor' | 'patient'
): Promise<RTCPeerConnection> => {
  
  if (!localStream) {
    await setupLocalStream(localVideoRef);
    if (!localStream) {
        throw new Error("Could not start local video stream.");
    }
  }

  remoteStream = new MediaStream();
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = remoteStream;
  }

  const pc = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream!);
  });

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream?.addTrack(track);
    });
  };

  const callDocRef = doc(db, 'calls', callId);

  if (role === 'doctor') {
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    
    // Clean up previous candidates
    const [offerSnapshot, answerSnapshot] = await Promise.all([getDocs(offerCandidates), getDocs(answerCandidates)]);
    const batch = writeBatch(db);
    offerSnapshot.forEach(doc => batch.delete(doc.ref));
    answerSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    pc.onicecandidate = event => {
      event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    // Set the doctor as active, and patient hasn't joined yet.
    await setDoc(callDocRef, { offer, active: true, patientJoined: false }, { merge: true });

    onSnapshot(callDocRef, snapshot => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    onSnapshot(answerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });

  } else if (role === 'patient') {
    const callDoc = await getDoc(callDocRef);
    if (!callDoc.exists() || !callDoc.data().offer) {
        throw new Error("Doctor has not started the call yet.");
    }

    // Mark that patient has joined
    await updateDoc(callDocRef, { patientJoined: true });

    pc.onicecandidate = event => {
        event.candidate && addDoc(collection(callDocRef, 'answerCandidates'), event.candidate.toJSON());
    };

    await pc.setRemoteDescription(new RTCSessionDescription(callDoc.data().offer));
    
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDocRef, { answer });
    
    onSnapshot(collection(callDocRef, 'offerCandidates'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
        });
    });
  }

  return pc;
};


export const endCall = async (pc: RTCPeerConnection | null, callId?: string) => {
  // Stop all local media tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  // Close the peer connection
  if (pc) {
    pc.close();
  }
  
  // If callId is provided, delete the call document from Firestore
  if (callId) {
    const callDocRef = doc(db, 'calls', callId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    // Delete subcollections first
    const [offerSnapshot, answerSnapshot] = await Promise.all([getDocs(offerCandidates), getDocs(answerCandidates)]);
    const batch = writeBatch(db);
    offerSnapshot.forEach(doc => batch.delete(doc.ref));
    answerSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Finally, delete the main call document
    await deleteDoc(callDocRef);
  }
};

export const getCall = (callId: string, callback: (data: any) => void): Unsubscribe => {
    const callDocRef = doc(db, 'calls', callId);
    return onSnapshot(callDocRef, (snapshot) => {
        callback(snapshot.data());
    });
};

export const toggleMute = (isMuted: boolean, callId: string, role: 'doctor' | 'patient') => {
    localStream?.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
    });
    const callDocRef = doc(db, 'calls', callId);
    const field = role === 'doctor' ? 'doctorMuted' : 'patientMuted';
    if(getDoc(callDocRef)) {
      updateDoc(callDocRef, { [field]: isMuted }).catch(()=>{});
    }
};

export const toggleCamera = (isCameraOff: boolean, callId: string, role: 'doctor' | 'patient') => {
    localStream?.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOff;
    });
    const callDocRef = doc(db, 'calls', callId);
    const field = role === 'doctor' ? 'doctorCameraOff' : 'patientCameraOff';
    if(getDoc(callDocRef)) {
      updateDoc(callDocRef, { [field]: isCameraOff }).catch(()=>{});
    }
};
