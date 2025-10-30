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
  writeBatch,
  getDocs,
  query,
  limit,
  orderBy,
} from 'firebase/firestore';

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

// Helper to delete all documents in a subcollection
async function deleteSubcollection(collectionRef) {
  const snapshot = await getDocs(collectionRef);
  if (snapshot.empty) {
    return;
  }
  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

export const createOrJoinCall = async (
  callId: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
): Promise<RTCPeerConnection> => {
  const pc = new RTCPeerConnection(servers);
  const localSessionId = Math.random().toString(36).substring(2);

  // 1. Setup media
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream!);
  });

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream?.addTrack(track);
    });
  };

  // 2. Signaling logic
  const callDocRef = doc(db, 'calls', callId);
  const sessionsCollection = collection(callDocRef, 'sessions');
  const mySessionDoc = doc(sessionsCollection, localSessionId);
  const candidatesCollection = collection(mySessionDoc, 'candidates');

  pc.onicecandidate = event => {
    event.candidate && addDoc(candidatesCollection, event.candidate.toJSON());
  };

  // Check for an existing session to join
  const q = query(sessionsCollection, orderBy('createdAt', 'desc'), limit(1));
  const existingSessions = await getDocs(q);
  let remoteSessionDoc: any = null;

  if (existingSessions.empty) {
    // === I am the CALLER ===
    console.log('No existing session. Creating offer...');
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
    const offer = { type: offerDescription.type, sdp: offerDescription.sdp };
    await setDoc(mySessionDoc, { offer, createdAt: new Date() });

    // Listen for an answer from a new session
    const unsub = onSnapshot(sessionsCollection, (snapshot) => {
        snapshot.docChanges().forEach(async change => {
            if (change.type === 'added' && change.doc.id !== localSessionId) {
                const data = change.doc.data();
                if (data.answer) {
                    if (pc.currentRemoteDescription) return;
                    console.log('Caller received answer.');
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    
                    // Respond to the answerer that we are connected
                    const remoteSessionRef = doc(sessionsCollection, change.doc.id);
                    await updateDoc(remoteSessionRef, { connected: true });
                }
            }
        });
    });
    (pc as any)._unsubscribes = [unsub];

  } else {
    // === I am the CALLEE ===
    console.log('Existing session found. Creating answer...');
    remoteSessionDoc = existingSessions.docs[0];
    const offer = remoteSessionDoc.data().offer;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
    const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
    await setDoc(mySessionDoc, { answer, createdAt: new Date() });
    
    // Listen for remote to acknowledge connection
    const unsub = onSnapshot(mySessionDoc, (snapshot) => {
      if(snapshot.data()?.connected) {
         console.log("Callee confirmed connection by remote.");
      }
    });
    (pc as any)._unsubscribes = [unsub];
  }

  // Generic candidate listener for both roles
  const unsubCandidates = onSnapshot(collection(db, `calls/${callId}/sessions`), (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added" && change.doc.id !== localSessionId) {
        const remoteCandidates = collection(change.doc.ref, 'candidates');
        onSnapshot(remoteCandidates, (candidateSnapshot) => {
          candidateSnapshot.docChanges().forEach(candChange => {
            if (candChange.type === "added") {
              pc.addIceCandidate(new RTCIceCandidate(candChange.doc.data()));
            }
          });
        });
      }
    });
  });
  
  if (!(pc as any)._unsubscribes) (pc as any)._unsubscribes = [];
  (pc as any)._unsubscribes.push(unsubCandidates);


  // Attach session ID for cleanup
  (pc as any)._sessionId = localSessionId;

  return pc;
};


export const hangup = async (currentPc: RTCPeerConnection | null, callId?: string) => {
  if (!currentPc) return;
  
  console.log('Hanging up call.');

  // Clean up Firestore listeners
  if ((currentPc as any)._unsubscribes) {
    (currentPc as any)._unsubscribes.forEach((unsub: Unsubscribe) => unsub());
  }

  // Stop media tracks
  localStream?.getTracks().forEach(track => track.stop());
  remoteStream?.getTracks().forEach(track => track.stop());
  localStream = null;
  remoteStream = null;

  // Close peer connection
  currentPc.close();

  // Delete this user's session from Firestore
  const sessionId = (currentPc as any)._sessionId;
  if (callId && sessionId) {
    const sessionDocRef = doc(db, `calls/${callId}/sessions`, sessionId);
    await deleteSubcollection(collection(sessionDocRef, 'candidates'));
    await deleteDoc(sessionDocRef);
  }
};


export const toggleMute = async (isMuted: boolean, callId: string, role: 'patient' | 'doctor') => {
  localStream?.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
    await setDoc(callDoc, { [field]: isMuted }, { merge: true });
  }
};

export const toggleCamera = async (isCameraOff: boolean, callId: string, role: 'patient' | 'doctor') => {
  localStream?.getVideoTracks().forEach(track => {
    track.enabled = !isCameraOff;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
    await setDoc(callDoc, { [field]: isCameraOff }, { merge: true });
  }
};

export const getCall = (id: string, callback: (data: any | null) => void): Unsubscribe => {
  const callDoc = doc(db, 'calls', id);
  return onSnapshot(callDoc, snapshot => {
    callback(snapshot.data() ?? null);
  });
};
