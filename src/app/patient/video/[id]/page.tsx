
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Loader2,
  AlertTriangle,
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
import { useToast } from '@/hooks/use-toast';
import { Unsubscribe } from 'firebase/firestore';

type CallStatus = 'Waiting' | 'Joining' | 'Connected' | 'Reconnecting' | 'Ended' | 'Failed';

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, loading } = useAuthState();
  
  const callId = params.id as string;
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>('Waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const [isCallActiveByDoctor, setIsCallActiveByDoctor] = useState(false);

  useEffect(() => {
    if (callStatus === 'Ended') {
      toast({
        title: 'Consultation Ended',
        description: 'The doctor has ended the video session.',
      });
      router.push('/patient/appointments');
    }
  }, [callStatus, router, toast]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: Unsubscribe | null = null;
    
    if (callId && user) {
      unsubscribe = getCall(callId, (data) => {
        if (!isMounted) return;

        if (data && data.active) {
            setIsCallActiveByDoctor(true);
            setRemoteMuted(data.doctorMuted ?? false);
            setRemoteCameraOff(data.doctorCameraOff ?? false);
        } else {
            // Doctor hasn't joined or has ended the call
            setIsCallActiveByDoctor(false);
            if (pcRef.current) { // If we were in a call, it means it has ended.
              hangup(pcRef.current, callId);
              pcRef.current = null;
              setCallStatus('Ended');
            }
        }
      });
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [callId, user]);
  
  const handleJoinCall = useCallback(async () => {
    if (!user || !isCallActiveByDoctor || callStatus === 'Joining' || callStatus === 'Connected') return;
    
    setCallStatus('Joining');
    
    try {
      const pc = await createOrJoinCall(callId, localVideoRef, remoteVideoRef, 'patient');
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pcRef.current) {
            switch (pcRef.current.connectionState) {
            case 'connected':
                setCallStatus('Connected');
                break;
            case 'disconnected':
            case 'failed':
                setCallStatus('Reconnecting');
                break;
            case 'closed':
                setCallStatus('Ended');
                break;
            }
        }
      };

    } catch (error) {
      console.error('Error joining call:', error);
      setCallStatus('Failed');
      toast({ title: 'Error Joining Call', description: (error as Error).message, variant: 'destructive' });
    }
  }, [user, callId, isCallActiveByDoctor, callStatus, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pcRef.current) {
        hangup(pcRef.current, callId);
        pcRef.current = null;
      }
    };
  }, [callId]);

  const handleToggleMute = () => {
    if (!pcRef.current) return;
    const newMutedState = !isMuted;
    toggleMute(newMutedState, callId, 'patient');
    setIsMuted(newMutedState);
  };

  const handleToggleCamera = () => {
    if (!pcRef.current) return;
    const newCameraState = !isCameraOff;
    toggleCamera(newCameraState, callId, 'patient');
    setIsCameraOff(newCameraState);
  };

  const handleHangup = async () => {
    if (pcRef.current) {
      await hangup(pcRef.current, callId);
      pcRef.current = null;
    }
    // We don't set status to 'Ended' because the doctor might still be there.
    // We just disconnect the patient.
    setCallStatus('Waiting'); 
    toast({ title: 'You left the call', description: 'You can rejoin as long as the consultation is active.' });
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
    if (callStatus === 'Failed') return 'Failed to connect.';
    if (callStatus === 'Reconnecting') return 'Connection lost. Reconnecting...';
    if (!isCallActiveByDoctor) return 'Waiting for doctor to join...';
    if (callStatus === 'Waiting') return 'Ready to join.';
    if (callStatus === 'Joining') return 'Joining call...';
    if (callStatus === 'Connected') return 'Connected';
    return '...';
  }

  const isCallInProgress = callStatus === 'Connected' || callStatus === 'Joining';

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="relative grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {/* Remote Video */}
        <div className="relative aspect-video w-full rounded-md bg-secondary">
          <video ref={remoteVideoRef} className="h-full w-full rounded-md object-cover" autoPlay playsInline />
          {(remoteMuted || remoteCameraOff) && isCallInProgress && (
            <div className="absolute inset-0 flex items-center justify-center gap-4 rounded-md bg-black/50">
              {remoteMuted && <MicOff className="h-6 w-6 text-white" />}
              {remoteCameraOff && <VideoOff className="h-6 w-6 text-white" />}
            </div>
          )}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">Doctor</div>
          {!isCallInProgress && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
               { callStatus === 'Joining' ? <Loader2 className="h-8 w-8 animate-spin" /> : null}
              <p className="mt-2 text-center text-sm">{getStatusText()}</p>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-20 right-4 h-32 w-24 md:relative md:bottom-auto md:right-auto md:h-auto md:w-full rounded-md bg-secondary aspect-video">
          <video ref={localVideoRef} className="h-full w-full rounded-md object-cover [-webkit-transform:scaleX(-1)] [transform:scaleX(-1)]" autoPlay playsInline muted />
          {(isMuted || isCameraOff) && isCallInProgress && (
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
                <Button onClick={handleJoinCall} size="lg" className="rounded-full h-16 w-32" disabled={!isCallActiveByDoctor || callStatus === 'Joining'}>
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
        {!isCallActiveByDoctor && callStatus === 'Waiting' && (
             <div className="mt-4 text-center text-sm text-amber-400 flex items-center justify-center gap-2">
                 <AlertTriangle className="h-4 w-4" /> Waiting for the doctor to start the consultation.
             </div>
        )}
      </div>
    </div>
  );
}
