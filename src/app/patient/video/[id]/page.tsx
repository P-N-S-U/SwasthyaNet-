
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

export default function VideoCallPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera and Mic Access Denied',
          description:
            'Please enable camera and microphone permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
      // Cleanup: stop media tracks when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const toggleMute = () => {
     if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsCameraOff(!track.enabled);
      });
    }
  };

  const endCall = () => {
    router.push('/patient/appointments');
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
      <div className="relative aspect-video w-full max-w-4xl">
        <video
          ref={videoRef}
          className="h-full w-full rounded-md"
          autoPlay
          muted // Mute local video to prevent feedback
        />
        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/80">
            <Alert variant="destructive" className="max-w-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use this feature. Check your
                browser settings.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      <div className="mt-6">
        <Card className="bg-secondary/30 p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMuted ? 'destructive' : 'outline'}
              size="lg"
              className="rounded-full"
              onClick={toggleMute}
              disabled={hasCameraPermission === false}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button
              variant={isCameraOff ? 'destructive' : 'outline'}
              size="lg"
              className="rounded-full"
              onClick={toggleCamera}
              disabled={hasCameraPermission === false}
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
