
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
  deleteDoc,
  getDocs,
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

let onCallConnectedCallback: (() => void) | null = null;
let onCallEndedCallback: (() => void) | null = null;

let unsubscribes: Unsubscribe[] = [];

export const registerEventHandlers = (
  onConnected: () => void,
  onEnded: () => void
) => {
  onCallConnectedCallback = onConnected;
  onCallEndedCallback = onEnded;
};

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

const initializePeerConnection = (remoteVideoRef: React.RefObject<HTMLVideoElement>) => {
    pc = new RTCPeerConnection(servers);

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
        onCallConnectedCallback?.();
    };
    
    // Store ICE candidates in an array, to be processed only after remote description is set.
    const queuedIceCandidates: RTCIceCandidateInit[] = [];

    pc.onicecandidate = event => {
        if (event.candidate) {
            const candidatesCollection = collection(db, 'calls', callId!, pc!.localDescription?.type === 'offer' ? 'offerCandidates' : 'answerCandidates');
            addDoc(candidatesCollection, event.candidate.toJSON());
        }
    };
    
    // This function will be used to process candidates from the queue.
    const processQueuedCandidates = () => {
        while(queuedIceCandidates.length > 0) {
            const candidate = queuedIceCandidates.shift();
            if (candidate) {
                pc!.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding received ICE candidate", e));
            }
        }
    };

    // Return the function to add candidates to the queue.
    return (candidate: RTCIceCandidateInit) => {
        if (pc?.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
            queuedIceCandidates.push(candidate);
        }
    };
};


export const createCall = async (id: string, remoteVideoRef: React.RefObject<HTMLVideoElement>) => {
  callId = id;
  const addIceCandidate = initializePeerConnection(remoteVideoRef);

  const callDoc = doc(db, 'calls', id);
  const answerCandidates = collection(callDoc, 'answerCandidates');

  const offerDescription = await pc!.createOffer();
  await pc!.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(callDoc, { offer, id, patientMuted: false, patientCameraOff: false, doctorMuted: false, doctorCameraOff: false });

  // Listen for remote answer
  const unsubCall = onSnapshot(callDoc, snapshot => {
    const data = snapshot.data();
    if (!pc!.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc!.setRemoteDescription(answerDescription);
    }
  });
  unsubscribes.push(unsubCall);
  
  // Listen for ICE candidates from remote
  const unsubAnswerCandidates = onSnapshot(answerCandidates, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        addIceCandidate(change.doc.data());
      }
    });
  });
  unsubscribes.push(unsubAnswerCandidates);
};


export const answerCall = async (id: string, remoteVideoRef: React.RefObject<HTMLVideoElement>) => {
  callId = id;
  const addIceCandidate = initializePeerConnection(remoteVideoRef);
  
  const callDoc = doc(db, 'calls', id);
  const offerCandidates = collection(callDoc, 'offerCandidates');

  const callSnap = await getDoc(callDoc);
  if (!callSnap.exists()) {
    throw new Error("Call document not found.");
  }

  const callData = callSnap.data();
  if (callData.offer && pc) {
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
    await updateDoc(callDoc, { answer });
    
    // Listen for ICE candidates from remote
    const unsubOfferCandidates = onSnapshot(offerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
            addIceCandidate(change.doc.data());
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

    if(localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    remoteStream = null;

    if (callId) {
        const callDoc = doc(db, 'calls', callId);
        const offerCandidates = await getDocs(collection(callDoc, 'offerCandidates'));
        offerCandidates.forEach(async (candidate) => await deleteDoc(candidate.ref));

        const answerCandidates = await getDocs(collection(callDoc, 'answerCandidates'));
        answerCandidates.forEach(async (candidate) => await deleteDoc(candidate.ref));

        await deleteDoc(callDoc);
    }

    if (onCallEndedCallback) {
        onCallEndedCallback();
    }
    callId = null;
};

export const toggleMute = async (isMuted: boolean, role: 'patient' | 'doctor') => {
  localStream?.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
    updateDoc(callDoc, { [field]: isMuted });
  }
};

export const toggleCamera = async (isCameraOff: boolean, role: 'patient' | 'doctor') => {
  localStream?.getVideoTracks().forEach(track => {
    track.enabled = !isCameraOff;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
    updateDoc(callDoc, { [field]: isCameraOff });
  }
};

export const getCall = (id: string, callback: (data: any | null) => void) => {
  const callDoc = doc(db, 'calls', id);
  const unsub = onSnapshot(callDoc, snapshot => {
      callback(snapshot.data() ?? null);
  });
  unsubscribes.push(unsub);
  return unsub;
};
