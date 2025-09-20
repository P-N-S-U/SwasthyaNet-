
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  answerCall,
  pc,
  hangup,
  registerEventHandlers,
} from '@/lib/video';
import { useAuthState } from '@/hooks/use-auth-state';

export default function DoctorVideoCallPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('Joining call...');
  const { user, loading } = useAuthState();

  useEffect(() => {
    if (loading || !user) return;

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
        await answerCall(params.id);
        // setCallStatus is handled by onCallConnected callback
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

    return () => {
      hangup(params.id);
    };
  }, [params.id, router, toast, user, loading]);

  const toggleMute = () => {
    if (pc) {
      pc.getSenders().forEach(sender => {
        if (sender.track?.kind === 'audio') {
          sender.track.enabled = !sender.track.enabled;
          setIsMuted(!sender.track.enabled);
        }
      });
    }
  };

  const toggleCamera = () => {
    if (pc) {
      pc.getSenders().forEach(sender => {
        if (sender.track?.kind === 'video') {
          sender.track.enabled = !sender.track.enabled;
          setIsCameraOff(!sender.track.enabled);
        }
      });
    }
  };

  const endCall = () => {
    hangup(params.id);
    router.push('/doctor/dashboard');
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
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
      <div className="relative grid w-full max-w-5xl grid-cols-1 gap-4 p-4 md:grid-cols-2">
        {/* Remote Video */}
        <div className="relative aspect-video rounded-md bg-secondary">
          <video
            ref={remoteVideoRef}
            className="h-full w-full rounded-md object-cover"
            autoPlay
            playsInline
          />
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">
            Patient
          </div>
           {callStatus !== 'Connected' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
               <Loader2 className="h-8 w-8 animate-spin" />
               <p className="mt-2">{callStatus}</p>
             </div>
          )}
        </div>

        {/* Local Video */}
        <div className="relative aspect-video rounded-md bg-secondary">
          <video
            ref={localVideoRef}
            className="h-full w-full rounded-md object-cover"
            autoPlay
            playsInline
            muted
          />
          <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm">
            You (Doctor)
          </div>
        </div>
      </div>
      <div className="mt-6">
        <Card className="bg-secondary/30 p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMuted ? 'destructive' : 'outline'}
              size="lg"
              className="rounded-full"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button
              variant={isCameraOff ? 'destructive' : 'outline'}
              size="lg"
              className="rounded-full"
              onClick={toggleCamera}
            >
              {isCameraOff ? <VideoOff /> : <Video />}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full"
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
