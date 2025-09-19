'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { getDoctorRecommendations } from '@/app/find-a-doctor/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Search, User, Stethoscope } from 'lucide-react';

const initialState = {
  data: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-accent text-accent-foreground hover:bg-accent/90"
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Search className="mr-2 h-4 w-4" />
      )}
      Find Doctors
    </Button>
  );
}

export function DoctorRecommendationForm() {
  const [state, formAction] = useFormState(
    getDoctorRecommendations,
    initialState
  );

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <div className="flex gap-2">
          <Input
            name="specialization"
            placeholder="e.g., Cardiology, Dermatology, Pediatrics"
            className="flex-grow bg-secondary/50 focus:border-accent"
            required
            minLength={3}
          />
          <SubmitButton />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-foreground/60">Suggestions:</p>
          {['Cardiology', 'Dermatology', 'Neurology', 'Pediatrics'].map(
            spec => (
              <Button
                key={spec}
                type="submit"
                name="specialization"
                value={spec}
                variant="secondary"
                size="sm"
                className="text-xs font-normal"
              >
                {spec}
              </Button>
            )
          )}
        </div>
      </form>

      {state.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.data && state.data.doctors.length > 0 && (
        <Card className="mt-8 border-primary/20 bg-secondary/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Stethoscope className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">
                Recommended Doctors
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {state.data.doctors.map((doctor, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{doctor}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Book Appointment
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {state.data && state.data.doctors.length === 0 && (
        <Alert className="mt-6">
          <AlertTitle>No Results</AlertTitle>
          <AlertDescription>
            We couldn't find any doctors for that specialization. Please try a
            different one.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
