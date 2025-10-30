
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  startCall,
  endCall,
  onCallUpdate,
} from '@/lib/video';
import { useAuthState } from '@/hooks/use-auth-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Unsubscribe } from 'firebase/firestore';

export default function DoctorVideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, loading } = useAuthState();
  
  const callId = params.id as string;
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [patientJoined, setPatientJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // Main effect to auto-start the call for the doctor when the component mounts.
  useEffect(() => {
    // This check ensures we only run this once when the refs are ready.
    if (!user || !callId || !localVideoRef.current || pc) {
      return;
    }

    let peerConnection: RTCPeerConnection;
    let localStream: MediaStream;

    const initCall = async () => {
      try {
        // We must have the local video ref available to proceed
        if (!localVideoRef.current || !remoteVideoRef.current) return;

        // Start the call and get the peer connection instance
        const { pc: newPc, localStream: newLocalStream } = await startCall(callId, localVideoRef, remoteVideoRef);
        peerConnection = newPc;
        localStream = newLocalStream;
        setPc(peerConnection);

        // UI state management based on connection status
        peerConnection.onconnectionstatechange = () => {
          console.log('Doctor Connection state changed:', peerConnection.connectionState);
          switch (peerConnection.connectionState) {
            case 'connecting':
              setIsConnecting(true);
              break;
            case 'connected':
              setIsConnecting(false);
              break;
            case 'disconnected':
            case 'failed':
              toast({ title: "Connection lost", description: "The connection was lost.", variant: "destructive" });
              setIsConnecting(true); // Show waiting/reconnecting UI
              break;
            case 'closed':
              toast({ title: "Call Ended", description: "The session has been terminated." });
              router.push('/doctor/dashboard');
              break;
          }
        };

        // Initial media state
        const audioEnabled = localStream.getAudioTracks().some(track => track.enabled);
        const videoEnabled = localStream.getVideoTracks().some(track => track.enabled);
        setIsMuted(!audioEnabled);
        setIsCameraOff(!videoEnabled);

      } catch (error) {
        console.error('Error starting call:', error);
        toast({ title: 'Error Starting Call', description: (error as Error).message, variant: 'destructive' });
        router.push('/doctor/dashboard');
      }
    };

    initCall();

    // Cleanup function to hang up when component unmounts
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
      localStream?.getTracks().forEach(track => track.stop());
    };
    // The dependency array ensures this runs only when the necessary elements are ready.
  }, [user, callId, pc, toast, router]);

  // Subscribe to call document updates to monitor patient presence and state.
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    if (callId) {
      unsubscribe = onCallUpdate(callId, (data) => {
        if (data) {
          setRemoteMuted(data.patientMuted ?? false);
          setRemoteCameraOff(data.patientCameraOff ?? false);
          
          const patientIsPresent = data.participants?.patient === true;
          if (patientIsPresent && !patientJoined) {
            toast({ title: 'Patient Joined', description: 'The patient has entered the call.' });
          }
          if (!patientIsPresent && patientJoined) {
            toast({ title: 'Patient Left', description: 'The patient has left the call.', variant: 'destructive' });
          }
          setPatientJoined(patientIsPresent);

        } else {
           // Document deleted, call has been ended definitively
           if (pc && pc.connectionState !== 'closed') {
             pc.close(); // This will trigger the 'closed' connection state and redirect
           } else if (!pc) {
             router.push('/doctor/dashboard');
           }
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [callId, patientJoined, toast, pc, router]);

  const handleToggleMute = async () => {
    if (!pc) return;
    pc.getSenders().forEach(sender => {
      if (sender.track?.kind === 'audio') {
        const newMutedState = !sender.track.enabled;
        sender.track.enabled = !newMutedState;
        setIsMuted(newMutedState);
      }
    });
  };

  const handleToggleCamera = async () => {
    if (!pc) return;
    pc.getSenders().forEach(sender => {
      if (sender.track?.kind === 'video') {
         const newCameraState = !sender.track.enabled;
         sender.track.enabled = !newCameraState;
         setIsCameraOff(newCameraState);
      }
    });
  };

  const handleEndCall = async () => {
    if(callId) await endCall(callId);
    // endCall deletes the doc, which will trigger the onCallUpdate listener to redirect.
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="relative grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {/* Remote Video */}
        <div className="relative aspect-video w-full rounded-md bg-secondary">
          <video ref={remoteVideoRef} className="h-full w-full rounded-md object-cover" autoPlay playsInline />
          {(remoteMuted || remoteCameraOff) && (
            <div className="absolute inset-0 flex items-center justify-center gap-4 rounded-md bg-black/50">
              {remoteMuted && <MicOff className="h-6 w-6 text-white" />}
              {remoteCameraOff && <VideoOff className="h-6 w-6 text-white" />}
            </div>
          )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">Patient</div>
          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-2 text-center text-sm">Waiting for patient to join...</p>
            </div>
          )}
          {!isConnecting && !patientJoined && (
             <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
                 <Loader2 className="h-8 w-8 animate-spin" />
                 <p className="mt-2 text-center text-sm">Waiting for patient to join...</p>
             </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-20 right-4 h-32 w-24 md:relative md:bottom-auto md:right-auto md:h-auto md:w-full rounded-md bg-secondary aspect-video">
          <video ref={localVideoRef} className="h-full w-full rounded-md object-cover [-webkit-transform:scaleX(-1)] [transform:scaleX(-1)]" autoPlay playsInline muted />
          {(isMuted || isCameraOff) && (
            <div className="absolute inset-0 flex items-center justify-center gap-4 rounded-md bg-black/50">
              {isMuted && <MicOff className="h-6 w-6 text-white" />}
              {isCameraOff && <VideoOff className="h-6 w-6 text-white" />}
            </div>
          )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-xs">You (Doctor)</div>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <Card className="bg-secondary/30 p-2 md:p-4">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <Button variant={isMuted ? 'destructive' : 'outline'} size="icon" className="rounded-full h-12 w-12 md:h-16 md:w-16" onClick={handleToggleMute}>
                {isMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button variant={isCameraOff ? 'destructive' : 'outline'} size="icon" className="rounded-full h-12 w-12 md:h-16 md:w-16" onClick={handleToggleCamera}>
                {isCameraOff ? <VideoOff /> : <Video />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="rounded-full h-12 w-12 md:h-16 md:w-16">
                    <PhoneOff />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Video Call?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will end the video session for both you and the patient. This will not mark the appointment as complete.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndCall}>
                    End Call
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
