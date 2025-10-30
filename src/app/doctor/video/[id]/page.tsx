
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Loader2,
  CheckCircle,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  startCall,
  hangup,
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
import { completeAppointment } from '@/app/actions/appointments';
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
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [patientJoined, setPatientJoined] = useState(false);

  // Memoize the start call function to avoid re-creation
  const handleStartCall = useCallback(async () => {
    if (!user || callStatus !== 'Idle') return;
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
            // Reconnection is handled by the doctor re-clicking 'start'
            break;
          case 'closed':
            setCallStatus('Idle');
            break;
        }
      };
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('Idle');
      toast({ title: 'Error Starting Call', description: (error as Error).message, variant: 'destructive' });
    }
  }, [user, callId, callStatus, toast]);

  // Subscribe to call document updates
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

          if (data.active === false) {
            setCallStatus('Ended');
          }
        } else {
           // If doc is deleted or doesn't exist, treat as ended.
           setCallStatus('Ended');
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [callId, patientJoined, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pc) {
        hangup(callId, 'doctor');
      }
    };
  }, [pc, callId]);

  const handleToggleMute = async () => {
    const newMutedState = await toggleMute(callId, 'doctor');
    setIsMuted(newMutedState);
  };

  const handleToggleCamera = async () => {
    const newCameraState = await toggleCamera(callId, 'doctor');
    setIsCameraOff(newCameraState);
  };

  const handleEndCall = async () => {
    await endCall(callId);
    toast({ title: 'Call Ended', description: 'The consultation has been terminated.' });
    setCallStatus('Ended');
  };

  const handleCompleteAppointment = async () => {
    await endCall(callId); // End the live call first
    const result = await completeAppointment(callId); // Then mark appointment as complete
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      router.push('/doctor/dashboard');
    } else {
      toast({ title: 'Appointment Completed', description: 'The session has been successfully marked as complete.' });
      router.push('/doctor/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4">Authenticating...</p>
      </div>
    );
  }

  if (callStatus === 'Ended') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-2xl font-bold">Consultation Ended</h1>
        <p className="text-muted-foreground">You can now safely close this window.</p>
        <Button onClick={() => router.push('/doctor/dashboard')} className="mt-6">Back to Dashboard</Button>
      </div>
    );
  }
  
  const getStatusText = () => {
    switch (callStatus) {
      case 'Starting': return 'Starting call...';
      case 'Connected': return 'Connected';
      case 'Reconnecting': return 'Connection lost. Attempting to reconnect...';
      case 'Waiting':
      case 'Idle':
      default: return 'Waiting for patient to join...';
    }
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
          {callStatus !== 'Connected' && callStatus !== 'Idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-2 text-center text-sm">{getStatusText()}</p>
            </div>
          )}
          {!patientJoined && callStatus === 'Connected' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
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
             {callStatus === 'Idle' && (
                 <Button onClick={handleStartCall} size="lg" className="rounded-full h-16 w-32">
                     <PlayCircle className="mr-2 h-5 w-5" /> Start Call
                 </Button>
             )}
            {callStatus !== 'Idle' && (
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
                          <AlertDialogTitle>End Consultation?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently end the consultation for both you and the patient. You cannot rejoin after this.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCompleteAppointment}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            End and Complete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
