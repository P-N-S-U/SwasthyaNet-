
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { updatePartnerProfile } from '@/app/profile/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
      Save Business Details
    </Button>
  );
}

export function PartnerProfileForm({ profile, onUpdate }: { profile: any, onUpdate: () => void }) {
  const [state, formAction] = useActionState(updatePartnerProfile, initialState);
  const { toast } = useToast();
  const router = useRouter();

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
      onUpdate();
      router.refresh();
      // Find and click the dialog's close button to ensure it closes
      const closeButton = document.querySelector('[data-radix-dialog-close]') as HTMLElement | null;
      if(closeButton) {
        closeButton.click();
      }
    }
  }, [state, toast, router, onUpdate]);
  
  const partnerProfile = profile?.profile || {};

  return (
    <form action={formAction}>
      <div className="space-y-6 py-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">Business/License Number*</Label>
            <Input
              id="licenseNumber"
              name="licenseNumber"
              defaultValue={partnerProfile.licenseNumber || ''}
              placeholder="e.g., DL123456"
              className="bg-secondary/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number*</Label>
            <Input
              id="contact"
              name="contact"
              defaultValue={partnerProfile.contact || ''}
              placeholder="e.g., +91 1234567890"
              className="bg-secondary/50"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Full Address*</Label>
          <Textarea
            id="address"
            name="address"
            defaultValue={partnerProfile.address || ''}
            placeholder="Your full business address. This will be used to show your location on the map."
            className="bg-secondary/50"
            rows={3}
            required
          />
           <p className="text-xs text-muted-foreground">
             Tip: For demonstration, try an address like "123 Main St"
           </p>
        </div>
        <p className="text-xs text-muted-foreground">* Required fields</p>
      </div>
      <div className="pt-6">
        <SubmitButton />
      </div>
    </form>
  );
}
