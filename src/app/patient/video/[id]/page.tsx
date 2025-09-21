
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import {
  createCall,
  pc,
  hangup,
  registerEventHandlers,
} from '@/lib/video';
import { useAuthState } from '@/hooks/use-auth-state';

export default function VideoCallPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('Initializing...');
  const { user, loading } = useAuthState();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth');
      return;
    }

    registerEventHandlers(
      localVideoRef,
      remoteVideoRef,
      () => setCallStatus('Waiting for doctor to join...'),
      () => setCallStatus('Connected'),
      () => {
        toast({ title: 'Call Ended' });
        router.push('/patient/appointments');
      }
    );

    const startCall = async () => {
      try {
        await createCall(params.id);
        // setCallStatus is handled by onCallCreated callback
      } catch (error) {
        console.error('Error starting call:', error);
        toast({
          variant: 'destructive',
          title: 'Call Failed',
          description:
            'Could not start the video call. Please check permissions and try again.',
        });
        setCallStatus('Call failed');
      }
    };

    startCall();

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
            Doctor
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
            You
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
