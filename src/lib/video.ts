
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
  writeBatch,
  getDocs,
  deleteField,
} from 'firebase/firestore';
import { getUserProfile } from './firestore';

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
  userId: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(servers);
    (pc as any)._unsubscribes = [];

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

    const callDocRef = doc(db, 'calls', callId);
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');
    
    const appointmentDoc = await getDoc(doc(db, 'appointments', callId));
    const appointmentData = appointmentDoc.data();
    const isDoctor = appointmentData?.doctorId === userId;

    if (isDoctor) {
        // DOCTOR is always the caller
        console.log("User is a Doctor. Acting as CALLER.");
        
        // Clean up previous call state before creating a new offer
        await deleteSubcollection(answerCandidatesCollection);
        await deleteSubcollection(offerCandidatesCollection);
        await setDoc(callDocRef, { answer: deleteField() }, { merge: true });

        pc.onicecandidate = event => {
            event.candidate && addDoc(offerCandidatesCollection, event.candidate.toJSON());
        };
        
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDocRef, { offer, doctorMuted: false, doctorCameraOff: false, patientMuted: false, patientCameraOff: false }, { merge: true });

        const answerUnsubscribe = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                console.log("Doctor received answer.");
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });
        
        const answerCandidatesUnsubscribe = onSnapshot(answerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    console.log("Doctor adding answer candidate.");
                    pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });

        (pc as any)._unsubscribes.push(answerUnsubscribe, answerCandidatesUnsubscribe);

    } else {
        // PATIENT is always the callee
        console.log("User is a Patient. Acting as CALLEE.");
        
        const callDocSnap = await getDoc(callDocRef);
        const callData = callDocSnap.data();

        if (callData?.offer) {
             pc.onicecandidate = event => {
                event.candidate && addDoc(answerCandidatesCollection, event.candidate.toJSON());
            };

            await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
            
            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);
            
            const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
            await updateDoc(callDocRef, { answer });
            
            const offerCandidatesUnsubscribe = onSnapshot(offerCandidatesCollection, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        console.log("Patient adding offer candidate.");
                        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                    }
                });
            });
            
            (pc as any)._unsubscribes.push(offerCandidatesUnsubscribe);
        } else {
            console.log("No offer from doctor yet. Waiting...");
            // The doctor will create the offer, and the patient's client
            // will reconnect via the useEffect logic in the page component.
        }
    }
    
    return pc;
};


export const hangup = async (currentPc: RTCPeerConnection | null, callId?: string) => {
    if (!currentPc) return;
    console.log('Hanging up call.');

    if ((currentPc as any)._unsubscribes) {
        (currentPc as any)._unsubscribes.forEach((unsub: Unsubscribe) => unsub());
    }

    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    localStream = null;
    remoteStream = null;
    
    currentPc.close();
};

export const toggleMute = async (callId: string, role: 'patient' | 'doctor'): Promise<boolean> => {
  let isMuted = false;
  localStream?.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
    isMuted = !track.enabled;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientMuted' : 'doctorMuted';
    await setDoc(callDoc, { [field]: isMuted }, { merge: true });
  }
  return isMuted;
};

export const toggleCamera = async (callId: string, role: 'patient' | 'doctor'): Promise<boolean> => {
  let isCameraOff = false;
  localStream?.getVideoTracks().forEach(track => {
    track.enabled = !track.enabled;
    isCameraOff = !track.enabled;
  });
  if (callId && role) {
    const callDoc = doc(db, 'calls', callId);
    const field = role === 'patient' ? 'patientCameraOff' : 'doctorCameraOff';
    await setDoc(callDoc, { [field]: isCameraOff }, { merge: true });
  }
  return isCameraOff;
};

export const getCall = (id: string, callback: (data: any | null) => void): Unsubscribe => {
  const callDoc = doc(db, 'calls', id);
  return onSnapshot(callDoc, snapshot => {
    callback(snapshot.data() ?? null);
  });
};
