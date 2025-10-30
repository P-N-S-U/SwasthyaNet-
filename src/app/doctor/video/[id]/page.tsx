
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  toggleMute,
  toggleCamera,
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

type CallStatus = 'Idle' | 'Starting' | 'Waiting' | 'Connected' | 'Reconnecting' | 'Ended';

export default function DoctorVideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, loading } = useAuthState();
  
  const callId = params.id as string;
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('Idle');
  const [hasCallEnded, setHasCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [patientJoined, setPatientJoined] = useState(false);

  // When callId changes, forcefully reset the component state for the new call.
  useEffect(() => {
    setCallStatus('Idle');
    setHasCallEnded(false);
    if (pc) {
      pc.close();
    }
    setPc(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setPatientJoined(false);
    setRemoteMuted(false);
    setRemoteCameraOff(false);
  }, [callId]);
  
  // When call ends, redirect back to the dashboard.
  useEffect(() => {
    if (hasCallEnded) {
      toast({
        title: 'Consultation Ended',
        description: 'The video session has been terminated.',
      });
      router.push('/doctor/dashboard');
    }
  }, [hasCallEnded, router, toast]);

  // Main effect to auto-start the call for the doctor when the component mounts.
  useEffect(() => {
    if (!user || !callId || pc || !localVideoRef.current || hasCallEnded || callStatus !== 'Idle') return;

    const initCall = async () => {
      setCallStatus('Starting');
      try {
        const newPc = await startCall(callId, localVideoRef, remoteVideoRef);
        setPc(newPc);

        newPc.onconnectionstatechange = () => {
          console.log('Doctor Connection state changed:', newPc.connectionState);
          switch (newPc.connectionState) {
            case 'connected':
              setCallStatus('Connected');
              break;
            case 'disconnected':
            case 'failed':
              setCallStatus('Reconnecting');
              break;
            case 'closed':
              setHasCallEnded(true); // Treat closed connection as the end.
              break;
          }
        };
      } catch (error) {
        console.error('Error starting call:', error);
        setCallStatus('Idle');
        toast({ title: 'Error Starting Call', description: (error as Error).message, variant: 'destructive' });
      }
    };

    initCall();
    
  }, [user, callId, pc, toast, hasCallEnded, callStatus]);

  // Subscribe to call document updates to monitor patient presence and state.
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    if (callId && !hasCallEnded) {
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

          if (data.active === false) {
             setHasCallEnded(true);
          }
        } else {
            // A call can't have ended if the patient never joined.
            // This prevents a race condition on new calls.
            if (patientJoined) {
                setHasCallEnded(true);
            }
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [callId, patientJoined, toast, hasCallEnded]);

  const handleToggleMute = async () => {
    if (!pc) return;
    const newMutedState = await toggleMute(pc, callId, 'doctor');
    setIsMuted(newMutedState);
  };

  const handleToggleCamera = async () => {
    if (!pc) return;
    const newCameraState = await toggleCamera(pc, callId, 'doctor');
    setIsCameraOff(newCameraState);
  };

  const handleEndCall = async () => {
    if(callId && pc) await endCall(callId, pc);
    setHasCallEnded(true);
  };


  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4">Authenticating...</p>
      </div>
    );
  }
  
  const getStatusText = () => {
    switch (callStatus) {
      case 'Starting': return 'Starting call...';
      case 'Connected': return 'Connected';
      case 'Reconnecting': return 'Connection lost. Attempting to reconnect...';
      case 'Idle':
      default: return 'Initializing...';
    }
  }

  const isCallInProgress = callStatus === 'Connected' || callStatus === 'Starting' || callStatus === 'Reconnecting';

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
          {(callStatus === 'Starting' || callStatus === 'Reconnecting') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-2 text-center text-sm">{getStatusText()}</p>
            </div>
          )}
          {isCallInProgress && !patientJoined && (
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
            {isCallInProgress ? (
                <>
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
                </>
            ) : (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p>{getStatusText()}</p>
                </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

    