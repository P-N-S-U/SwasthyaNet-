
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfile } from '@/app/profile/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';

const initialState = {
  data: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      Save Changes
    </Button>
  );
}

export function UpdateProfileForm({ user }: { user: User }) {
  const [state, formAction] = useActionState(updateProfile, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        title: 'Update Failed',
        description: state.error,
        variant: 'destructive',
      });
    }
    if (state.data) {
      toast({
        title: 'Success!',
        description: state.data,
      });
      // Optionally, close the dialog on success
      document.querySelector('[data-radix-dialog-close]')?.dispatchEvent(new Event('click'));
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Full Name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={user?.displayName || ''}
            placeholder="Your full name"
            className="bg-secondary/50"
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
          />
        </div>
      </div>
      <div className="pt-6">
        <SubmitButton />
      </div>
    </form>
  );
}
