
'use client';

import { useState } from 'react';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';


export function UpdateProfileForm({ user }: { user: User }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const displayName = formData.get('displayName') as string;
    const photoURL = formData.get('photoURL') as string;
    
    if (!auth.currentUser) {
        toast({ title: 'Error', description: 'You are not logged in.', variant: 'destructive'});
        setIsSubmitting(false);
        return;
    }

    try {
        // 1. Update Firebase Auth record
        await updateAuthProfile(auth.currentUser, { displayName, photoURL });

        // 2. Update Firestore document
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { displayName, photoURL });
        
        toast({
            title: 'Success!',
            description: 'Your profile has been updated.',
        });
        
        // Refresh the page to show new details
        router.refresh();

        // Close the dialog by finding a close button and clicking it
        const closeButton = document.querySelector('[data-radix-dialog-close]') as HTMLElement | null;
        if(closeButton) {
          closeButton.click();
        }

    } catch (error: any) {
         toast({
            title: 'Update Failed',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Full Name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={user?.displayName || ''}
            placeholder="Your full name"
            className="bg-secondary/50"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="photoURL">Photo URL</Label>
          <Input
            id="photoURL"
            name="photoURL"
            defaultValue={user?.photoURL || ''}
            placeholder="https://example.com/your-photo.jpg"
            className="bg-secondary/50"
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="pt-6">
        <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
        </Button>
      </div>
    </form>
  );
}
