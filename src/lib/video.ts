
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

let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

async function setupStreams(
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  if (localVideoRef.current) {
    localVideoRef.current.srcObject = localStream;
  }
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = remoteStream;
  }
}

export const createOrJoinCall = async (
  callId: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  role: 'doctor' | 'patient'
): Promise<RTCPeerConnection> => {
  const pc = new RTCPeerConnection(servers);
  const callDocRef = doc(db, 'calls', callId);
  
  await setupStreams(localVideoRef, remoteVideoRef);

  localStream?.getTracks().forEach(track => {
    pc.addTrack(track, localStream!);
  });

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream?.addTrack(track);
    });
  };

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

    await setDoc(callDocRef, { offer, active: true, doctorMuted: false, doctorCameraOff: false }, { merge: true });

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


export const hangup = async (pc: RTCPeerConnection | null, callId?: string) => {
  if (!pc) return;
  
  pc.getSenders().forEach(sender => {
    sender.track?.stop();
  });
  pc.close();
  
  // Clean up local stream tracks
  localStream?.getTracks().forEach(track => track.stop());
  localStream = null;
  remoteStream = null;

  if (callId) {
    const callDocRef = doc(db, 'calls', callId);
    const callDoc = await getDoc(callDocRef);
    if (callDoc.exists()) {
       // Reset the call document for potential reconnections, but keep it active
       await updateDoc(callDocRef, {
           answer: null, // Clear the answer so a new one can be created
       });
       const answerCandidates = collection(callDocRef, 'answerCandidates');
       const answerSnapshot = await getDocs(answerCandidates);
       const batch = writeBatch(db);
       answerSnapshot.forEach(doc => batch.delete(doc.ref));
       await batch.commit();
    }
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
    updateDoc(callDocRef, { [field]: isMuted });
};

export const toggleCamera = (isCameraOff: boolean, callId: string, role: 'doctor' | 'patient') => {
    localStream?.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOff;
    });
    const callDocRef = doc(db, 'calls', callId);
    const field = role === 'doctor' ? 'doctorCameraOff' : 'patientCameraOff';
    updateDoc(callDocRef, { [field]: isCameraOff });
};
