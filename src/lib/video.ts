
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
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export let pc: RTCPeerConnection;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

let localVideoRef: React.RefObject<HTMLVideoElement> | null = null;
let remoteVideoRef: React.RefObject<HTMLVideoElement> | null = null;
let onCallConnected: (() => void) | null = null;
let onCallCreated: (() => void) | null = null;
let onCallEnded: (() => void) | null = null;

export const registerEventHandlers = (
  localRef: React.RefObject<HTMLVideoElement>,
  remoteRef: React.RefObject<HTMLVideoElement>,
  onCreated: () => void,
  onConnected: () => void,
  onEnded: () => void,
) => {
  localVideoRef = localRef;
  remoteVideoRef = remoteRef;
  onCallCreated = onCreated;
  onCallConnected = onConnected;
  onCallEnded = onEnded;
};

const setupStreams = async () => {
    pc = new RTCPeerConnection(servers);
    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
    });
    remoteStream = new MediaStream();

    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream!);
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream!.addTrack(track);
        });
    };

    if (localVideoRef?.current) {
        localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef?.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }
};

export const createCall = async (callId: string) => {
  await setupStreams();

  const callDoc = doc(db, 'calls', callId);
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

  await setDoc(callDoc, { offer, id: callId });

  onSnapshot(callDoc, snapshot => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
      onCallConnected && onCallConnected();
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

  onCallCreated && onCallCreated();
};

export const answerCall = async (callId: string) => {
  await setupStreams();

  const callDoc = doc(db, 'calls', callId);
  const offerCandidates = collection(callDoc, 'offerCandidates');
  const answerCandidates = collection(callDoc, 'answerCandidates');

  pc.onicecandidate = event => {
    event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
  };

  const callSnap = await getDoc(callDoc);
  const callData = callSnap.data();

  if(callData?.offer) {
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
  }


  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await updateDoc(callDoc, { answer });
  onCallConnected && onCallConnected();

  onSnapshot(offerCandidates, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
};

export const hangup = async (callId: string) => {
  if (pc) {
    pc.close();
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  try {
    const callDoc = doc(db, 'calls', callId);
    if ((await getDoc(callDoc)).exists()){
        const offerCandidates = collection(callDoc, 'offerCandidates');
        const answerCandidates = collection(callDoc, 'answerCandidates');
    
        const batch = writeBatch(db);
    
        const offerCandidatesSnapshot = await getDocs(offerCandidates);
        offerCandidatesSnapshot.forEach(doc => batch.delete(doc.ref));
    
        const answerCandidatesSnapshot = await getDocs(answerCandidates);
        answerCandidatesSnapshot.forEach(doc => batch.delete(doc.ref));
    
        batch.delete(callDoc);
    
        await batch.commit();
    }
  } catch (error) {
      console.error("Error hanging up call:", error);
  }


  localStream = null;
  remoteStream = null;
  onCallEnded && onCallEnded();
};
