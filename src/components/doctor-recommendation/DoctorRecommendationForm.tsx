
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { getDoctorRecommendations } from '@/app/find-a-doctor/actions';
import { bookAppointment } from '@/app/actions/appointments';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Search, User, Stethoscope, CalendarPlus } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';

const initialSearchState = {
  data: null,
  error: null,
};

const initialBookState = {
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

function BookAppointmentForm({ doctorId }: { doctorId: string }) {
  const [state, formAction] = useActionState(bookAppointment, initialBookState);
  const { pending } = useFormStatus();
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        title: 'Booking Failed',
        description: state.error,
        variant: 'destructive',
      });
    }
    if (state.data) {
      toast({
        title: 'Success!',
        description: 'Appointment booked successfully.',
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="doctorId" value={doctorId} />
      <Button variant="outline" size="sm" type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CalendarPlus className="mr-2 h-4 w-4" />
        )}
        Book Appointment
      </Button>
    </form>
  );
}

export function DoctorRecommendationForm() {
  const [state, formAction] = useActionState(
    getDoctorRecommendations,
    initialSearchState
  );

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <div className="flex gap-2">
          <Input
            name="query"
            placeholder="e.g., Dr. Anjali Rao or Cardiology"
            className="flex-grow bg-secondary/50 focus:border-accent"
            required
            minLength={3}
          />
          <SubmitButton />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-foreground/60">Suggestions:</p>
          {['Cardiology', 'Dermatology', 'Neurology', 'Dr. Vikram Singh'].map(
            spec => (
              <Button
                key={spec}
                type="submit"
                name="query"
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
                Search Results
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {state.data.doctors.map((doctor) => (
                <li
                  key={doctor.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">{doctor.name}</span>
                       <Badge variant="outline" className="ml-2">{doctor.specialization}</Badge>
                    </div>
                  </div>
                  <BookAppointmentForm doctorId={doctor.id} />
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
            We couldn't find any doctors for that query. Please try a
            different one.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
