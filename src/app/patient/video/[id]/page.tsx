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
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  joinCall,
  hangup,
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

type CallStatus = 'Waiting' | 'Joining' | 'Connected' | 'Reconnecting' | 'Ended';

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, loading } = useAuthState();
  
  const callId = params.id as string;
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('Waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [doctorJoined, setDoctorJoined] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // Force reset the state when navigating to a new call
  useEffect(() => {
    setCallStatus('Waiting');
    setIsCallActive(false);
    setPc(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setDoctorJoined(false);
  }, [callId]);

  // Subscribe to call document to know when the doctor starts it
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    if (callId) {
      unsubscribe = onCallUpdate(callId, (data) => {
        if (data) {
            setIsCallActive(data.active ?? false);
            setRemoteMuted(data.doctorMuted ?? false);
            setRemoteCameraOff(data.doctorCameraOff ?? false);
            
            const doctorIsPresent = data.participants?.doctor === true;
            if (doctorIsPresent && !doctorJoined) {
                toast({ title: 'Doctor Joined', description: 'The doctor has entered the call.' });
            }
             if (!doctorIsPresent && doctorJoined) {
                toast({ title: 'Doctor Left', description: 'The doctor has left the call.', variant: 'destructive' });
            }
            setDoctorJoined(doctorIsPresent);

            if (data.active === false && callStatus !== 'Ended') {
              setCallStatus('Ended');
            }
        } else {
            // If the call document is null/deleted, the call hasn't started or has been cleaned up.
            // If the doctor explicitly ends the call (active: false), we show the ended screen.
            if (isCallActive && callStatus !== 'Ended') {
              setCallStatus('Ended');
            } else {
              setIsCallActive(false);
            }
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [callId, doctorJoined, toast, isCallActive, callStatus]);
  
  const handleJoinCall = useCallback(async () => {
    if (!user || callStatus === 'Joining' || callStatus === 'Connected') return;
    setCallStatus('Joining');
    try {
      const newPc = await joinCall(callId, localVideoRef, remoteVideoRef);
      setPc(newPc);

      newPc.onconnectionstatechange = () => {
        console.log('Patient Connection state changed:', newPc.connectionState);
        switch (newPc.connectionState) {
          case 'connected':
            setCallStatus('Connected');
            break;
          case 'disconnected':
          case 'failed':
            setCallStatus('Reconnecting');
            break;
          case 'closed':
            setCallStatus('Waiting');
            break;
        }
      };
    } catch (error) {
      console.error('Error joining call:', error);
      setCallStatus('Waiting');
      toast({ title: 'Error Joining Call', description: (error as Error).message, variant: 'destructive' });
    }
  }, [user, callId, callStatus, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pc) {
        hangup(callId, 'patient');
      }
    };
  }, [pc, callId]);

  const handleToggleMute = async () => {
    if (!pc) return;
    const newMutedState = await toggleMute(callId, 'patient');
    setIsMuted(newMutedState);
  };

  const handleToggleCamera = async () => {
    if (!pc) return;
    const newCameraState = await toggleCamera(callId, 'patient');
    setIsCameraOff(newCameraState);
  };

  const handleHangup = async () => {
    await hangup(callId, 'patient');
    setCallStatus('Waiting'); // Go back to a state where user can rejoin
    if (pc) {
        pc.close();
        setPc(null);
    }
    toast({ title: 'You left the call', description: 'You can rejoin anytime as long as the consultation is active.' });
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4">Loading user information...</p>
      </div>
    );
  }

  if (callStatus === 'Ended') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-2xl font-bold">Consultation Ended</h1>
        <p className="text-muted-foreground">The doctor has ended the session.</p>
        <Button onClick={() => router.push('/patient/appointments')} className="mt-6">Back to Appointments</Button>
      </div>
    );
  }

  const getStatusText = () => {
    switch (callStatus) {
      case 'Joining': return 'Joining call...';
      case 'Connected': return 'Connected';
      case 'Reconnecting': return 'Connection lost. Please try rejoining.';
      case 'Waiting':
      default: return 'Ready to join call';
    }
  }

  const isCallInProgress = callStatus === 'Connected' || callStatus === 'Joining' || callStatus === 'Reconnecting';

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
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">Doctor</div>
          {callStatus !== 'Connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-2 text-center text-sm">{getStatusText()}</p>
            </div>
          )}
           {!doctorJoined && callStatus === 'Connected' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
                 <p className="mt-2 text-center text-sm">Waiting for doctor to join...</p>
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
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-xs">You</div>
        </div>
      </div>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <Card className="bg-secondary/30 p-2 md:p-4">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {!isCallInProgress ? (
                <Button onClick={handleJoinCall} size="lg" className="rounded-full h-16 w-32" disabled={!isCallActive || callStatus === 'Joining'}>
                    {callStatus === 'Joining' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Video className="mr-2 h-5 w-5" />}
                    Join Call
                </Button>
            ) : (
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
                          <AlertDialogTitle>Leave Call?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to leave? You can rejoin as long as the doctor has not ended the consultation.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Stay</AlertDialogCancel>
                          <AlertDialogAction onClick={handleHangup}>Leave Call</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
          </div>
        </Card>
        {!isCallActive && callStatus === 'Waiting' && (
             <div className="mt-4 text-center text-sm text-amber-400 flex items-center justify-center gap-2">
                 <AlertTriangle className="h-4 w-4" /> Waiting for the doctor to start the consultation.
             </div>
        )}
      </div>
    </div>
  );
}
