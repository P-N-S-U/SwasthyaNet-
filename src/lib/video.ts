
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
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

let localVideoRef: React.RefObject<HTMLVideoElement> | null = null;
let remoteVideoRef: React.RefObject<HTMLVideoElement> | null = null;
let onCallConnected: (() => void) | null = null;
let onCallCreated: (() => void) | null = null;
let onCallEnded: (() => void) | null = null;
let wasConnected = false;

export const registerEventHandlers = (
  localRef: React.RefObject<HTMLVideoElement>,
  remoteRef: React.RefObject<HTMLVideoElement>,
  onCreated: () => void,
  onConnected: () => void,
  onEnded: () => void
) => {
  localVideoRef = localRef;
  remoteVideoRef = remoteRef;
  onCallCreated = onCreated;
  onCallConnected = onConnected;
  onCallEnded = onEnded;
  wasConnected = false; // Reset on new registration
};

export const setupStreams = async () => {
  const pc = new RTCPeerConnection(servers);

  try {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    if (localVideoRef?.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // This is the crucial part for receiving the remote stream
    pc.ontrack = event => {
      if (remoteVideoRef?.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      if (!wasConnected) {
        wasConnected = true;
        if (onCallConnected) {
          onCallConnected();
        }
      }
    };

    return { pc, localStream };

  } catch (error) {
    console.error("Error accessing media devices.", error);
    throw new Error("Camera and microphone permissions are required. Please enable them and refresh the page.");
  }
};

export const createCall = async (id: string, pc: RTCPeerConnection) => {
  const callDoc = doc(db, 'calls', id);
  const offerCandidates = collection(callDoc, 'offerCandidates');
  const answerCandidates = collection(callDoc, 'answerCandidates');

  pc.onicecandidate = event => {
    event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  const callData = {
    offer,
    id: id,
    patientMuted: false,
    patientCameraOff: false,
  };

  await setDoc(callDoc, callData, { merge: true });

  if (onCallCreated) onCallCreated();

  onSnapshot(callDoc, snapshot => {
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
};

export const answerCall = async (id: string, pc: RTCPeerConnection) => {
  const callDoc = doc(db, 'calls', id);
  const offerCandidates = collection(callDoc, 'offerCandidates');
  const answerCandidates = collection(callDoc, 'answerCandidates');

  pc.onicecandidate = event => {
    event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
  };

  const callSnap = await getDoc(callDoc);
  if (!callSnap.exists()) {
    throw new Error("Call document not found. The patient may not have started the call yet.");
  }

  const callData = callSnap.data();

  if (callData?.offer) {
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, {
      answer,
      doctorMuted: false,
      doctorCameraOff: false,
    });
    
    onSnapshot(offerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  }
};


export const hangup = async (pc: RTCPeerConnection | null) => {
  if (pc && pc.signalingState !== 'closed') {
    pc.getSenders().forEach(sender => {
      if (sender.track) {
        sender.track.stop();
      }
    });
    pc.close();
  }
  
  if (onCallEnded && wasConnected) {
      onCallEnded();
      wasConnected = false; // Prevent multiple triggers
  }
};


export const toggleMute = async (
  isMuted: boolean,
  pc: RTCPeerConnection | null,
  role: 'patient' | 'doctor',
  callId: string
) => {
  if (pc) {
    pc.getSenders().forEach(sender => {
      if (sender.track?.kind === 'audio') {
        sender.track.enabled = !isMuted;
      }
    });
    if (callId && role) {
      const callDoc = doc(db, 'calls', callId);
      const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
      updateDoc(callDoc, { [field]: isMuted });
    }
  }
};

export const toggleCamera = async (
  isCameraOff: boolean,
  pc: RTCPeerConnection | null,
  role: 'patient' | 'doctor',
  callId: string
) => {
  if (pc) {
    pc.getSenders().forEach(sender => {
      if (sender.track?.kind === 'video') {
        sender.track.enabled = !isCameraOff;
      }
    });
    if (callId && role) {
      const callDoc = doc(db, 'calls', callId);
      const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
      updateDoc(callDoc, { [field]: isCameraOff });
    }
  }
};

export const getCall = (
  id: string,
  callback: (data: any) => void
): Unsubscribe => {
  const callDoc = doc(db, 'calls', id);
  return onSnapshot(callDoc, snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
      if (wasConnected && onCallEnded) {
        onCallEnded();
      }
    }
  });
};
