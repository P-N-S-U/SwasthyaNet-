
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { updatePartnerProfile } from '@/app/profile/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

// Helper to parse the full address string
const parseAddress = (fullAddress) => {
    if (!fullAddress) return { street: '', city: '', state: '', postalCode: '', country: '' };
    const parts = fullAddress.split(',').map(p => p.trim());
    
    // This is a simple parser and might need to be more robust for real-world addresses
    const country = parts.length > 1 ? parts[parts.length - 1] : '';
    const stateAndZip = (parts.length > 2 ? parts[parts.length - 2] : '').split(' ');
    const postalCode = stateAndZip.pop() || '';
    const state = stateAndZip.join(' ');
    const city = parts.length > 3 ? parts[parts.length - 3] : '';
    const street = parts.slice(0, parts.length - (country ? 3 : 2)).join(', ');

    return { street, city, state, postalCode, country };
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
  
  const partnerProfile = profile?.partnerProfile || {};
  const parsedAddress = parseAddress(partnerProfile.address);

  return (
    <form action={formAction}>
      <div className="space-y-6 py-4">
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

        <div className="space-y-2 rounded-lg border border-border bg-background/30 p-4">
            <h4 className="font-medium text-sm">Business Address</h4>
            <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" name="street" defaultValue={parsedAddress.street} placeholder="123 Main St" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" defaultValue={parsedAddress.city} placeholder="Mumbai" required />
                </div>
                <div>
                    <Label htmlFor="state">State / Province</Label>
                    <Input id="state" name="state" defaultValue={parsedAddress.state} placeholder="Maharashtra" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" name="postalCode" defaultValue={parsedAddress.postalCode} placeholder="400001" required />
                </div>
                <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" defaultValue={parsedAddress.country} placeholder="India" required />
                </div>
            </div>
             <p className="text-xs text-muted-foreground pt-2">
             Tip: For demonstration, try an address like "123 Main St, Los Angeles, CA 90012, USA" spread across the fields.
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

    