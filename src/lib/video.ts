
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
  serverTimestamp,
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
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  userType: 'doctor' | 'patient'
) => {
    const pc = new RTCPeerConnection(servers);
    
    // 1. Setup local media
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
    }
    
    // 2. Setup remote media - Create fresh MediaStream
    remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }

    // 3. Push tracks from local stream to peer connection
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream!);
    });

    // 4. Pull tracks from remote stream, add to video stream
    pc.ontrack = event => {
        console.log('Received remote track:', event.track.kind);
        event.streams[0].getTracks().forEach(track => {
            remoteStream?.addTrack(track);
        });
    };

    const callDocRef = doc(db, 'calls', callId);
    const offerCandidatesCollection = collection(callDocRef, 'offerCandidates');
    const answerCandidatesCollection = collection(callDocRef, 'answerCandidates');

    const callDocSnap = await getDoc(callDocRef);
    const callDocExists = callDocSnap.exists();
    const callData = callDocSnap.data();
    const existingOffer = callDocExists && callData?.offer;

    if (!existingOffer) {
        // === This user is the CALLER (first to join) ===
        console.log('Creating new offer as caller');
        
        // Clear old candidates
        await deleteSubcollection(offerCandidatesCollection);
        await deleteSubcollection(answerCandidatesCollection);
        
        pc.onicecandidate = event => {
            if (event.candidate) {
                console.log('Adding offer candidate');
                addDoc(offerCandidatesCollection, event.candidate.toJSON());
            }
        };
        
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDocRef, { 
            offer,
            offerTimestamp: serverTimestamp(),
        }, { merge: true });

        // Listen for answer - INCLUDING UPDATES (for reconnections)
        const answerUnsubscribe = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (data?.answer) {
                const currentAnswerSdp = pc.currentRemoteDescription?.sdp;
                const newAnswerSdp = data.answer.sdp;
                
                // Check if this is a NEW answer (reconnection scenario)
                if (newAnswerSdp && newAnswerSdp !== currentAnswerSdp) {
                    console.log('Received new/updated answer, setting remote description');
                    const answerDescription = new RTCSessionDescription(data.answer);
                    await pc.setRemoteDescription(answerDescription);
                }
            }
        });
        
        // Listen for answer candidates
        const answerCandidatesUnsubscribe = onSnapshot(answerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    console.log('Adding answer ICE candidate');
                    try {
                        await pc.addIceCandidate(candidate);
                    } catch (e) {
                        console.error('Error adding answer candidate:', e);
                    }
                }
            });
        });

        // Store unsubscribe functions on pc for cleanup
        (pc as any)._unsubscribes = [answerUnsubscribe, answerCandidatesUnsubscribe];

    } else {
        // === This user is the CALLEE (second to join / rejoining) ===
        console.log('Joining existing call as callee');
        
        // CRITICAL: Clear old answer and answer candidates for clean reconnect
        await deleteSubcollection(answerCandidatesCollection);
        
        pc.onicecandidate = event => {
            if (event.candidate) {
                console.log('Adding answer candidate');
                addDoc(answerCandidatesCollection, event.candidate.toJSON());
            }
        };

        const offerDescription = new RTCSessionDescription(existingOffer);
        await pc.setRemoteDescription(offerDescription);
        
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        // Update answer with timestamp to trigger caller's listener
        await updateDoc(callDocRef, { 
            answer,
            answerTimestamp: serverTimestamp(),
        });
        
        // Listen for offer candidates
        const offerCandidatesUnsubscribe = onSnapshot(offerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    console.log('Adding offer ICE candidate');
                    try {
                        await pc.addIceCandidate(candidate);
                    } catch (e) {
                        console.error('Error adding offer candidate:', e);
                    }
                }
            });
        });

        // Store unsubscribe function on pc for cleanup
        (pc as any)._unsubscribes = [offerCandidatesUnsubscribe];
    }

    // Log connection state changes
    pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
    };
    
    pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
    };

    return pc;
};

export const hangup = async (currentPc: RTCPeerConnection | null, callId?: string) => {
    console.log('Hanging up');
    
    // Clean up listeners
    if (currentPc && (currentPc as any)._unsubscribes) {
        (currentPc as any)._unsubscribes.forEach((unsub: Unsubscribe) => unsub());
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }

    if (currentPc) {
        currentPc.close();
    }
  
    // Reset the call document for reconnection, but don't delete it
    if (callId) {
        const callDocRef = doc(db, 'calls', callId);
        const callDocSnap = await getDoc(callDocRef);
        if(callDocSnap.exists()) {
             await updateDoc(callDocRef, {
                answer: deleteField(),
                answerTimestamp: deleteField(),
             });
            // Clear answer candidates for clean reconnect
            await deleteSubcollection(collection(callDocRef, 'answerCandidates'));
        }
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
