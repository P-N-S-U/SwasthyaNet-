
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
  answerCall,
  hangup,
  registerEventHandlers,
  toggleMute,
  toggleCamera,
  getCall,
} from '@/lib/video';
import { useAuthState } from '@/hooks/use-auth-state';

export default function DoctorVideoCallPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);

  const [callStatus, setCallStatus] = useState('Joining call...');
  const { user, loading } = useAuthState();
  const { id } = use(params);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
      return;
    }

    registerEventHandlers(
      localVideoRef,
      remoteVideoRef,
      () => {}, // Doctors don't create calls
      () => setCallStatus('Connected'),
      () => {
        toast({ title: 'Call Ended' });
        router.push('/doctor/dashboard');
      }
    );

    const joinCall = async () => {
      try {
        await answerCall(id);
      } catch (error) {
        console.error('Error joining call:', error);
        toast({
          variant: 'destructive',
          title: 'Join Failed',
          description: 'Could not join the video call. It may have ended or there was an error.',
        });
        setCallStatus('Failed to join');
      }
    };

    joinCall();

    const unsubscribe = getCall(id, (callData) => {
        if(callData) {
            setRemoteMuted(callData.patientMuted);
            setRemoteCameraOff(callData.patientCameraOff);
        }
    });

    return () => {
      unsubscribe();
      hangup(id);
    };
  }, [id, router, toast, user, loading]);

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    toggleMute(newMutedState);
  };

  const handleToggleCamera = () => {
    const newCameraState = !isCameraOff;
    setIsCameraOff(newCameraState);
    toggleCamera(newCameraState);
  };

  const endCall = () => {
    hangup(id);
  };

  if (loading || !user) {
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
            Patient
          </div>
           {callStatus !== 'Connected' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
               <Loader2 className="h-8 w-8 animate-spin" />
               <p className="mt-2 text-center text-sm">{callStatus}</p>
             </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-20 right-4 h-32 w-24 md:relative md:bottom-auto md:right-auto md:h-auto md:w-full rounded-md bg-secondary aspect-video">
          <video
            ref={localVideoRef}
            className="h-full w-full rounded-md object-cover"
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
            You (Doctor)
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
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12 md:h-16 md:w-16"
              onClick={endCall}
            >
              <PhoneOff />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
