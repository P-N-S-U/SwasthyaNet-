
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
  deleteDoc,
  Unsubscribe,
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

export const createOrJoinCall = async (
  id: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  userType: 'doctor' | 'patient'
) => {
  callId = id;
  const callDocRef = doc(db, 'calls', callId);

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
  
  const initializePeerConnection = () => {
    if (pc) {
      pc.close();
    }
    pc = new RTCPeerConnection(servers);

    localStream?.getTracks().forEach(track => {
      pc!.addTrack(track, localStream!);
    });

    pc.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream?.addTrack(track);
      });
    };
  };

  const callDocSnap = await getDoc(callDocRef);

  if (!callDocSnap.exists()) {
    // === This is the first user to join (caller) ===
    initializePeerConnection();
    
    // Create offer
    const offerDescription = await pc!.createOffer();
    await pc!.setLocalDescription(offerDescription);
    const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
    
    // Create call document in Firestore
    await setDoc(callDocRef, { offer, id, patientMuted: false, patientCameraOff: false, doctorMuted: false, doctorCameraOff: false });

    // Listen for answer from the other peer
    const unsubCall = onSnapshot(callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (!pc?.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc?.setRemoteDescription(answerDescription);
      }
      
      // Renegotiation logic for when the other user reconnects
      if (data?.reconnecting) {
        console.log("Other user is reconnecting, creating a new offer...");
        initializePeerConnection();
        pc?.createOffer().then(offerDesc => {
          pc?.setLocalDescription(offerDesc);
          updateDoc(callDocRef, { offer: { sdp: offerDesc.sdp, type: offerDesc.type }, reconnecting: false, answer: null });
        });
      }
    });
    unsubscribes.push(unsubCall);
    
    // Listen for ICE candidates from the other peer
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');
    const unsubAnswerCandidates = onSnapshot(answerCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc?.addIceCandidate(candidate);
        }
      });
    });
    unsubscribes.push(unsubAnswerCandidates);

    // Send my ICE candidates
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    pc!.onicecandidate = event => {
      event.candidate && addDoc(offerCandidatesCollection, event.candidate.toJSON());
    };

  } else {
    // === This user is joining an existing call (callee/rejoiner) ===
    initializePeerConnection();
    
    // Signal that we are joining/reconnecting
    await updateDoc(callDocRef, { reconnecting: true });

    // Listen for the new offer created by the other peer
    const unsubCall = onSnapshot(callDocRef, async (snapshot) => {
      const data = snapshot.data();
      if (data?.offer && !pc?.currentRemoteDescription) {
        console.log("Got offer, creating answer...");
        const offerDescription = new RTCSessionDescription(data.offer);
        await pc!.setRemoteDescription(offerDescription);
        
        const answerDescription = await pc!.createAnswer();
        await pc!.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
      }
    });
    unsubscribes.push(unsubCall);

    // Listen for ICE candidates from the other peer
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const unsubOfferCandidates = onSnapshot(offerCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc?.addIceCandidate(candidate);
        }
      });
    });
    unsubscribes.push(unsubOfferCandidates);
    
    // Send my ICE candidates
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');
    pc!.onicecandidate = event => {
      event.candidate && addDoc(answerCandidatesCollection, event.candidate.toJSON());
    };
  }
};


export const hangup = async () => {
  cleanupListeners();

  if (pc) {
    pc.getSenders().forEach(sender => sender.track?.stop());
    pc.close();
    pc = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  remoteStream = null;
  // Do NOT delete the call document, to allow for reconnection.
  // callId = null; 
};


export const toggleMute = async (isMuted: boolean, role: 'patient' | 'doctor') => {
  localStream?.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
    await updateDoc(callDoc, { [field]: isMuted });
  }
};

export const toggleCamera = async (isCameraOff: boolean, role: 'patient' | 'doctor') => {
  localStream?.getVideoTracks().forEach(track => {
    track.enabled = !isCameraOff;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
    await updateDoc(callDoc, { [field]: isCameraOff });
  }
};

// This can be used to listen for remote media state changes
export const getCall = (id: string, callback: (data: any | null) => void) => {
  const callDoc = doc(db, 'calls', id);
  const unsub = onSnapshot(callDoc, snapshot => {
      callback(snapshot.data() ?? null);
  });
  unsubscribes.push(unsub);
  return unsub;
};
