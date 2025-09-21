
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { updateDoctorProfile } from '@/app/profile/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
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
      Save Professional Details
    </Button>
  );
}

const specializations = [
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology',
  'Oncology',
  'Psychiatry',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Nephrology',
  'Urology',
  'Ophthalmology',
  'Otolaryngology (ENT)',
  'General Physician',
];

const qualificationsList = [
  'MBBS',
  'MD',
  'MS',
  'DM',
  'MCh',
  'DNB',
  'PhD',
  'BDS',
  'MDS',
  'FNB',
  'MRCP',
  'FRCS',
];

export function DoctorProfileForm({ profile }: { profile: any }) {
  const [state, formAction] = useActionState(updateDoctorProfile, initialState);
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
      router.refresh();
      // Find and click the dialog's close button to ensure it closes
      const closeButton = document.querySelector('[data-radix-dialog-close]') as HTMLElement | null;
      if(closeButton) {
        closeButton.click();
      }
    }
  }, [state, toast, router]);

  return (
    <form action={formAction}>
      <div className="space-y-6 py-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization*</Label>
            <Input
              id="specialization"
              name="specialization"
              defaultValue={profile?.specialization || ''}
              placeholder="e.g., Cardiology"
              className="bg-secondary/50"
              required
              list="specializations-list"
            />
            <datalist id="specializations-list">
              {specializations.map(spec => (
                <option key={spec} value={spec} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qualifications">Qualifications*</Label>
            <Input
              id="qualifications"
              name="qualifications"
              defaultValue={profile?.qualifications || ''}
              placeholder="e.g., MD, PhD, MBBS"
              className="bg-secondary/50"
              required
              list="qualifications-list"
            />
            <datalist id="qualifications-list">
              {qualificationsList.map(qual => (
                <option key={qual} value={qual} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience*</Label>
            <Input
              id="experience"
              name="experience"
              type="number"
              defaultValue={profile?.experience || ''}
              placeholder="e.g., 10"
              className="bg-secondary/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultationFee">Minimal Consultation Fee (₹)*</Label>
            <Input
              id="consultationFee"
              name="consultationFee"
              type="number"
              step="1"
              defaultValue={profile?.consultationFee || ''}
              placeholder="e.g., 100"
              className="bg-secondary/50"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="clinic">Clinic / Hospital Name</Label>
          <Input
            id="clinic"
            name="clinic"
            defaultValue={profile?.clinic || ''}
            placeholder="e.g., General Hospital"
            className="bg-secondary/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Short Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={profile?.bio || ''}
            placeholder="Tell patients a little about yourself and your practice."
            className="bg-secondary/50"
            rows={4}
          />
        </div>
        <p className="text-xs text-muted-foreground">* Required fields</p>
      </div>
      <div className="pt-6">
        <SubmitButton />
      </div>
    </form>
  );
}
