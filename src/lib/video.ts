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

// Generate a unique session ID for this connection attempt
function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const createOrJoinCall = async (
  callId: string,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  userType: 'doctor' | 'patient',
  onNeedReconnect?: () => void
) => {
    const pc = new RTCPeerConnection(servers);
    const mySessionId = generateSessionId();
    console.log('My session ID:', mySessionId, 'Role:', userType);
    
    // 1. Setup local media
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
    }
    
    // 2. Setup remote media
    remoteStream = new MediaStream();
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
    }

    // 3. Push tracks from local stream to peer connection
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream!);
    });

    // 4. Pull tracks from remote stream
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
    const existingSessionId = callData?.sessionId;

    // Determine if we should be caller or callee
    const shouldBeCallee = existingOffer && existingSessionId;

    if (!shouldBeCallee) {
        // === CALLER: Create fresh offer ===
        console.log('Acting as CALLER - creating new offer');
        
        // Clear everything for fresh start
        await deleteSubcollection(offerCandidatesCollection);
        await deleteSubcollection(answerCandidatesCollection);
        
        pc.onicecandidate = event => {
            if (event.candidate) {
                addDoc(offerCandidatesCollection, event.candidate.toJSON());
            }
        };
        
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDocRef, { 
            offer,
            sessionId: mySessionId,
            answer: deleteField(), // Clear any old answer
        }, { merge: true });

        // Monitor for session changes (someone reconnecting triggers new session)
        const sessionUnsubscribe = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            // If session ID changes, it means the other peer reconnected
            // We need to reconnect too
            if (data.sessionId && data.sessionId !== mySessionId && data.sessionId !== existingSessionId) {
                console.log('Session changed - other peer reconnected, triggering our reconnect');
                if (onNeedReconnect) {
                    onNeedReconnect();
                }
                return;
            }

            // Normal answer handling
            if (data?.answer && !pc.currentRemoteDescription) {
                console.log('Received answer, setting remote description');
                const answerDescription = new RTCSessionDescription(data.answer);
                await pc.setRemoteDescription(answerDescription);
            }
        });
        
        // Listen for answer candidates
        const answerCandidatesUnsubscribe = onSnapshot(answerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    try {
                        await pc.addIceCandidate(candidate);
                    } catch (e) {
                        console.error('Error adding answer candidate:', e);
                    }
                }
            });
        });

        (pc as any)._unsubscribes = [sessionUnsubscribe, answerCandidatesUnsubscribe];

    } else {
        // === CALLEE: Join existing call ===
        console.log('Acting as CALLEE - joining existing call');
        
        // Check if the offer is from an old session - if so, we need to wait/trigger refresh
        // For now, clear answer candidates and proceed
        await deleteSubcollection(answerCandidatesCollection);
        
        pc.onicecandidate = event => {
            if (event.candidate) {
                addDoc(answerCandidatesCollection, event.candidate.toJSON());
            }
        };

        const offerDescription = new RTCSessionDescription(existingOffer);
        await pc.setRemoteDescription(offerDescription);
        
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        
        const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
        await updateDoc(callDocRef, { answer });
        
        // Listen for offer candidates
        const offerCandidatesUnsubscribe = onSnapshot(offerCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    try {
                        await pc.addIceCandidate(candidate);
                    } catch (e) {
                        console.error('Error adding offer candidate:', e);
                    }
                }
            });
        });

        // Monitor session changes
        const sessionUnsubscribe = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            // If session changed, caller reconnected, we should too
            if (data.sessionId && data.sessionId !== existingSessionId) {
                console.log('Session changed - caller reconnected, triggering our reconnect');
                if (onNeedReconnect) {
                    onNeedReconnect();
                }
            }
        });

        (pc as any)._unsubscribes = [offerCandidatesUnsubscribe, sessionUnsubscribe];
    }

    // Connection monitoring
    pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
            console.error('ICE connection failed');
        }
    };
    
    pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
    };

    // Store session ID on the peer connection
    (pc as any)._sessionId = mySessionId;

    return pc;
};

export const hangup = async (currentPc: RTCPeerConnection | null, callId?: string, preserveOffer: boolean = true) => {
    console.log('Hanging up, preserve offer:', preserveOffer);
    
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
  
    // Clear answer to allow reconnection
    if (callId && preserveOffer) {
        const callDocRef = doc(db, 'calls', callId);
        const callDocSnap = await getDoc(callDocRef);
        if(callDocSnap.exists()) {
             await updateDoc(callDocRef, {
                answer: deleteField(),
             });
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
