
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { isSignInLink, completeSignInWithLink } from '@/lib/firebase/auth';
import { Loader2 } from 'lucide-react';

export default function FinishSignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const link = window.location.href;
    if (isSignInLink(link)) {
      completeSignInWithLink(link)
        .then(result => {
          if (result.error) {
            setError(result.error.message);
            toast({
              title: 'Sign In Failed',
              description: result.error.message,
              variant: 'destructive',
            });
            router.push('/auth');
          } else {
            toast({
              title: 'Signed In Successfully',
              description: 'Welcome!',
            });
            router.push('/dashboard');
          }
        })
        .catch(err => {
          setError(err.message);
          toast({
            title: 'Sign In Failed',
            description: err.message,
            variant: 'destructive',
          });
          router.push('/auth');
        });
    } else {
      setError('This is not a valid sign-in link.');
      router.push('/auth');
    }
  }, [router, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg">Signing you in...</p>
      </div>
      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-4 text-center text-destructive">
          <p className="font-bold">An Error Occurred</p>
          <p className="text-sm">{error}</p>
          <p className="mt-2 text-xs">Redirecting you to the sign-in page.</p>
        </div>
      )}
    </div>
  );
}
