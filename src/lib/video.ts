
import { db } from './firebase/firebase';
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  writeBatch,
  getDocs,
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
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  const remoteStream = new MediaStream();

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  };

  if (localVideoRef?.current) {
    localVideoRef.current.srcObject = localStream;
  }
  if (remoteVideoRef?.current) {
    remoteVideoRef.current.srcObject = remoteStream;
  }

  return { pc, localStream, remoteStream };
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

  await setDoc(callDoc, {
    offer,
    id: id,
    patientMuted: false,
    patientCameraOff: false,
  });

  if (onCallCreated) onCallCreated();

  onSnapshot(callDoc, snapshot => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
      wasConnected = true;
      if (onCallConnected) onCallConnected();
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
  const callData = callSnap.data();

  if (callData?.offer) {
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

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
    wasConnected = true;
    if (onCallConnected) onCallConnected();

    onSnapshot(offerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }
};

export const hangup = async (pc: RTCPeerConnection | null) => {
  if (pc) {
    pc.getSenders().forEach(sender => {
      if (sender.track) {
        sender.track.stop();
      }
    });
    pc.close();
  }
  // The call document is intentionally not deleted to allow for re-connection
  // and to prevent the other user from being kicked out.
  if (onCallEnded) onCallEnded();
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
      wasConnected = true;
      callback(snapshot.data());
    } else {
      callback(null);
      // Only trigger onCallEnded if we were previously connected.
      // This prevents the "call ended" toast on initial join.
      if (wasConnected && onCallEnded) {
        onCallEnded();
      }
    }
  });
};
