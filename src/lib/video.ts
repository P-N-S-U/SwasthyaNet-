
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
let role: 'caller' | 'callee' | null = null;

let onCallEndedCallback: (() => void) | null = null;

let unsubscribes: Unsubscribe[] = [];

export const setupLocalStream = async (localVideoRef: React.RefObject<HTMLVideoElement>) => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
        
        remoteStream = new MediaStream();
        
    } catch (error) {
        console.error("Error accessing media devices.", error);
        throw new Error("Camera and microphone permissions are required. Please enable them and refresh the page.");
    }
};

export const createOrJoinCall = async (
  id: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  userType: 'doctor' | 'patient'
) => {
  callId = id;
  await setupLocalStream(localVideoRef);

  pc = new RTCPeerConnection(servers);
  const queuedCandidates: RTCIceCandidate[] = [];

  pc.onicecandidate = event => {
    if (event.candidate) {
        const candidatesCollection = role === 'caller' ? collection(db, 'calls', callId!, 'offerCandidates') : collection(db, 'calls', callId!, 'answerCandidates');
        addDoc(candidatesCollection, event.candidate.toJSON());
    }
  };

  localStream?.getTracks().forEach(track => {
    pc!.addTrack(track, localStream!);
  });

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream?.addTrack(track);
    });
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  };

  const callDocRef = doc(db, 'calls', callId);
  const callDocSnap = await getDoc(callDocRef);

  const offerCandidatesCol = collection(callDocRef, 'offerCandidates');
  const answerCandidatesCol = collection(callDocRef, 'answerCandidates');

  if (!callDocSnap.exists()) {
    // This user is the first to join, they become the "caller"
    role = 'caller';

    // Create the call document and the offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
    const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
    await setDoc(callDocRef, { offer, id, patientMuted: false, patientCameraOff: false, doctorMuted: false, doctorCameraOff: false });

    // Listen for the answer
    const unsubCall = onSnapshot(callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (!pc?.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc?.setRemoteDescription(answerDescription).then(() => {
          queuedCandidates.forEach(candidate => pc?.addIceCandidate(candidate));
        });
      }
    });

    // Listen for ICE candidates from the callee
    const unsubAnswerCandidates = onSnapshot(answerCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            if (pc?.currentRemoteDescription) {
                pc.addIceCandidate(candidate);
            } else {
                queuedCandidates.push(candidate);
            }
        }
      });
    });

    unsubscribes.push(unsubCall, unsubAnswerCandidates);
    
  } else {
    // The other user is already here, we are the "callee"
    role = 'callee';

    const callData = callDocSnap.data();
    if (callData.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
    }

    // Listen for ICE candidates from the caller
    const unsubOfferCandidates = onSnapshot(offerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc?.addIceCandidate(candidate);
            }
        });
    });
    unsubscribes.push(unsubOfferCandidates);
  }
};


export const hangup = async () => {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];

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
  callId = null;
  role = null;
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
