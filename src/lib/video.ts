
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

export let pc: RTCPeerConnection;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let callId: string | null = null;
let role: 'patient' | 'doctor' | null = null;


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

export const createCall = async (id: string) => {
  callId = id;
  role = 'patient';
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

  await setDoc(callDoc, { offer, id: callId, patientMuted: false, patientCameraOff: false });

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

export const answerCall = async (id: string) => {
  callId = id;
  role = 'doctor';
  await setupStreams();

  const callDoc = doc(db, 'calls', callId);
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

    await updateDoc(callDoc, { answer, doctorMuted: false, doctorCameraOff: false });
    onCallConnected && onCallConnected();

    onSnapshot(offerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  } else {
    console.warn("Offer not found when trying to answer call. Waiting for offer via snapshot.");
    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.offer && !pc.remoteDescription) {
            console.log("Offer received via snapshot, proceeding to answer.");
            unsubscribe(); // Stop listening once we've acted.
            answerCall(id).catch(err => console.error("Error retrying answerCall:", err));
        }
    })
  }
};


export const hangup = async (id: string) => {
  if (pc) {
    pc.close();
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  try {
    if (id) {
        const callDoc = doc(db, 'calls', id);
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
    }
  } catch (error) {
      console.error("Error hanging up call:", error);
  }


  localStream = null;
  remoteStream = null;
  callId = null;
  role = null;
  // onCallEnded will be triggered by the onSnapshot listener in getCall now
};


export const toggleMute = async (isMuted: boolean) => {
  if (pc) {
    pc.getSenders().forEach(sender => {
      if (sender.track?.kind === 'audio') {
        sender.track.enabled = !isMuted;
      }
    });
    if (callId && role) {
      const callDoc = doc(db, 'calls', callId);
      const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
      await updateDoc(callDoc, { [field]: isMuted });
    }
  }
};

export const toggleCamera = async (isCameraOff: boolean) => {
  if (pc) {
    pc.getSenders().forEach(sender => {
      if (sender.track?.kind === 'video') {
        sender.track.enabled = !isCameraOff;
      }
    });
    if (callId && role) {
      const callDoc = doc(db, 'calls', callId);
      const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
      await updateDoc(callDoc, { [field]: isCameraOff });
    }
  }
};

export const getCall = (id: string, callback: (data: any) => void): Unsubscribe => {
    const callDoc = doc(db, 'calls', id);
    return onSnapshot(callDoc, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data());
        } else {
            // Document was deleted, meaning the other person hung up.
            callback(null);
            if (onCallEnded) {
              onCallEnded();
            }
        }
    });
};
