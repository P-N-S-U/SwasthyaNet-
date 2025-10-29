
'use client';

import { useEffect, useRef, useState, use } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  createCall,
  hangup,
  registerEventHandlers,
  toggleMute,
  toggleCamera,
  getCall,
  setupStreams,
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

type CallStatus = 'Initializing' | 'Waiting' | 'Connected' | 'Ended' | 'Failed';

export default function VideoCallPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  
  const [callStatus, setCallStatus] = useState<CallStatus>('Initializing');
  const { user, loading } = useAuthState();
  const { id: callId } = use(params);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localHangup = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
      return;
    }

    let callUnsubscribe: (() => void) | null = null;
    let hasCreated = false;

    const handleCallEnded = () => {
        if (!localHangup.current) {
            toast({ title: 'Call Ended', description: 'The doctor has left the call.' });
            setCallStatus('Ended');
            router.push('/patient/appointments');
        }
    };

    registerEventHandlers(
      localVideoRef,
      remoteVideoRef,
      () => setCallStatus('Waiting'),
      () => setCallStatus('Connected'),
      handleCallEnded
    );

    const startCall = async () => {
      setCallStatus('Initializing');
      try {
        const { pc, localStream } = await setupStreams();
        pcRef.current = pc;
        localStreamRef.current = localStream;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }

        await createCall(callId, pc);
        hasCreated = true;
      } catch (error: any) {
        console.error('Error starting call:', error);
        toast({
          variant: 'destructive',
          title: 'Call Failed',
          description: error.message || 'Could not start the video call. Please check permissions and try again.',
        });
        setCallStatus('Failed');
      }
    };

    startCall();
    
    callUnsubscribe = getCall(callId, (callData) => {
        if (pcRef.current?.signalingState === 'closed') return;
        if(callData) {
            setRemoteMuted(callData.doctorMuted);
            setRemoteCameraOff(callData.doctorCameraOff);
        } else if (hasCreated) {
            // If we created the call and the doc disappears, the other user hung up (or it failed)
            handleCallEnded();
        }
    });

    // Cleanup function
    return () => {
      localHangup.current = true;
      if(callUnsubscribe) {
          callUnsubscribe();
      }
      hangup(pcRef.current, null);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [callId, router, toast, user, loading]);

  const handleToggleMute = () => {
    if (!user || !pcRef.current) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    toggleMute(newMutedState, pcRef.current, 'patient', callId);
  };

  const handleToggleCamera = () => {
    if (!user || !pcRef.current) return;
    const newCameraState = !isCameraOff;
    setIsCameraOff(newCameraState);
    toggleCamera(newCameraState, pcRef.current, 'patient', callId);
  };

  const endCall = () => {
    hangup(pcRef.current, callId).then(() => {
        router.push('/patient/appointments');
    });
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="mt-4">Loading user information...</p>
      </div>
    );
  }
  
  const getStatusText = () => {
    switch (callStatus) {
        case 'Initializing': return 'Initializing call...';
        case 'Waiting': return 'Waiting for doctor to join...';
        case 'Connected': return 'Connected';
        case 'Ended': return 'Call has ended.';
        case 'Failed': return 'Failed to connect.';
        default: return 'Connecting...';
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="relative grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {/* Remote Video */}
        <div className="relative aspect-video w-full rounded-md bg-secondary">
          <video
            ref={remoteVideoRef}
            className="h-full w-full rounded-md object-cover"
            autoPlay
            playsInline
          />
           {(remoteMuted || remoteCameraOff) && (
              <div className="absolute inset-0 flex items-center justify-center gap-4 rounded-md bg-black/50">
                  {remoteMuted && <MicOff className="h-6 w-6 text-white" />}
                  {remoteCameraOff && <VideoOff className="h-6 w-6 text-white" />}
              </div>
            )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">
            Doctor
          </div>
          {callStatus !== 'Connected' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
               <Loader2 className="h-8 w-8 animate-spin" />
               <p className="mt-2 text-center text-sm">{getStatusText()}</p>
             </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-20 right-4 h-32 w-24 md:relative md:bottom-auto md:right-auto md:h-auto md:w-full rounded-md bg-secondary aspect-video">
          <video
            ref={localVideoRef}
            className="h-full w-full rounded-md object-cover [-webkit-transform:scaleX(-1)] [transform:scaleX(-1)]"
            autoPlay
            playsInline
            muted
          />
           {(isMuted || isCameraOff) && (
              <div className="absolute inset-0 flex items-center justify-center gap-4 rounded-md bg-black/50">
                  {isMuted && <MicOff className="h-6 w-6 text-white" />}
                  {isCameraOff && <VideoOff className="h-6 w-6 text-white" />}
              </div>
            )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-xs">
            You
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <Card className="bg-secondary/30 p-2 md:p-4">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <Button
              variant={isMuted ? 'destructive' : 'outline'}
              size="icon"
              className="rounded-full h-12 w-12 md:h-16 md:w-16"
              onClick={handleToggleMute}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button
              variant={isCameraOff ? 'destructive' : 'outline'}
              size="icon"
              className="rounded-full h-12 w-12 md:h-16 md:w-16"
              onClick={handleToggleCamera}
            >
              {isCameraOff ? <VideoOff /> : <Video />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full h-12 w-12 md:h-16 md:w-16"
                >
                    <PhoneOff />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Call?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to end this consultation? This action will mark the appointment as completed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={endCall}>End Call</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
