
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
  hangup,
  toggleMute,
  toggleCamera,
  getCall,
  createOrJoinCall,
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

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  
  const [callStatus, setCallStatus] = useState<CallStatus>('Initializing');
  const { user, loading } = useAuthState();
  const callId = params.id as string;
  
  useEffect(() => {
    if (loading || !callId) return;
    if (!user) {
      router.push('/auth');
      return;
    }

    let isMounted = true;
    let callUnsubscribe: (() => void) | null = null;
    let hasConnected = false;

    const startCall = async () => {
      if(isMounted) setCallStatus('Initializing');
      try {
        await createOrJoinCall(callId, localVideoRef, remoteVideoRef, 'patient');
        if(isMounted) setCallStatus('Waiting');

      } catch (error: any) {
        console.error('Error starting call:', error);
        if(isMounted) setCallStatus('Failed');
      }
    };

    startCall();
    
    callUnsubscribe = getCall(callId, (callData) => {
        if(!isMounted) return;

        if (callData) {
            setRemoteMuted(callData.doctorMuted);
            setRemoteCameraOff(callData.doctorCameraOff);
            // The doctor's answer indicates connection.
            if(callData.answer && !hasConnected) {
              hasConnected = true;
              setCallStatus('Connected');
            }
        }
    });

    const currentPc = pcRef.current;

    return () => {
      isMounted = false;
      if (callUnsubscribe) {
        callUnsubscribe();
      }
      hangup(currentPc, callId);
    };
  }, [callId, router, user, loading]);

  const handleToggleMute = () => {
    if (!user) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    toggleMute(newMutedState, 'patient');
  };

  const handleToggleCamera = () => {
    if (!user) return;
    const newCameraState = !isCameraOff;
    setIsCameraOff(newCameraState);
    toggleCamera(newCameraState, 'patient');
  };

  const endCall = async () => {
    await hangup(pcRef.current, callId);
    router.push('/patient/appointments');
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
                  <AlertDialogTitle>Leave Call?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave the video call? You can rejoin this call as long as it's active.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={endCall}>Leave Call</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
