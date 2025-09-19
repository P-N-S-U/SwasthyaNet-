
'use client';

import { useFormState, useFormStatus } from 'react-dom';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

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

export function DoctorProfileForm() {
  const [state, formAction] = useFormState(updateDoctorProfile, initialState);
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
    }
  }, [state, toast]);

  return (
    <Card className="border-border/30 bg-background">
      <CardHeader>
        <CardTitle className="font-headline">
          Professional Information
        </CardTitle>
        <CardDescription>
          Complete your professional profile to help patients find you.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              name="specialization"
              placeholder="e.g., Cardiology"
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic">Clinic / Hospital Name</Label>
            <Input
              id="clinic"
              name="clinic"
              placeholder="e.g., General Hospital"
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell patients a little about yourself and your practice."
              className="bg-secondary/50"
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter>
            <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
