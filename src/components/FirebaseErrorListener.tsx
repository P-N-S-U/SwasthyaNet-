'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      if (isDevelopment()) {
        // In development, we want to throw the error to show the Next.js overlay
        // This provides the richest debugging experience.
        console.error(
          'Firebase Permission Error Detected. See overlay for details.'
        );
        throw error;
      } else {
        // In production, we show a user-friendly toast.
        console.error('Firebase Permission Error:', error.message);
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            'You do not have permission to perform this action. Please contact support if you believe this is an error.',
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  // This component does not render anything itself.
  return null;
}
