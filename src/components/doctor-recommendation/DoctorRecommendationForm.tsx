
'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { getDoctorRecommendations } from '@/app/find-a-doctor/actions';
import { bookAppointment } from '@/app/actions/appointments';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  Search,
  User,
  Stethoscope,
  CalendarPlus,
  Eye,
  GraduationCap,
  CalendarClock,
  IndianRupee,
  Hospital,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '../ui/toast';
import Link from 'next/link';

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
  const [state, formAction, pending] = useActionState(bookAppointment, initialBookState);
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
        action: (
          <ToastAction asChild altText="View Appointments">
            <Link href="/patient/appointments">View</Link>
          </ToastAction>
        ),
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction}>
      <input type="hidden" name="doctorId" value={doctorId} />
      <Button variant="default" size="sm" type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CalendarPlus className="mr-2 h-4 w-4" />
        )}
        Book Now
      </Button>
    </form>
  );
}

const ProfileDetailItem = ({ icon, label, value }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg">
      <div className="mt-1 shrink-0 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={'font-semibold text-lg'}>
          {value}
        </p>
      </div>
    </div>
  );
};

const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function DoctorRecommendationForm({
  suggestions,
}: {
  suggestions: string[];
}) {
  const [state, formAction] = useActionState(
    getDoctorRecommendations,
    initialSearchState
  );
  const [query, setQuery] = useState('');

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <div className="flex gap-2">
          <Input
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Dr. Anjali Rao or Cardiology"
            className="flex-grow bg-secondary/50 focus:border-accent"
            required
            minLength={3}
          />
          <SubmitButton />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-foreground/60">Suggestions:</p>
          {suggestions.map(
            spec => (
              <Button
                key={spec}
                type="button"
                onClick={() => setQuery(spec)}
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
              {state.data.doctors.map(doctor => (
                <li
                  key={doctor.id}
                  className="flex flex-col items-start gap-4 rounded-lg border border-border/50 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">{doctor.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {doctor.specialization}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader className="items-center text-center">
                          <Avatar className="h-24 w-24 border-4 border-primary">
                            <AvatarImage
                              src={doctor.photoURL}
                              alt={doctor.name}
                            />
                            <AvatarFallback className="text-3xl">
                              {getInitials(doctor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <DialogTitle className="pt-2 font-headline text-2xl">
                            {doctor.name}
                          </DialogTitle>
                          <DialogDescription>
                            <Badge variant="secondary">{doctor.specialization}</Badge>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="my-6 space-y-4 rounded-lg bg-secondary/30 p-4">
                            <div className="grid grid-cols-2 gap-4">
                               <ProfileDetailItem icon={<GraduationCap size={20} />} label="Qualifications" value={doctor.qualifications} />
                               <ProfileDetailItem icon={<CalendarClock size={20} />} label="Experience" value={doctor.experience ? `${doctor.experience} years` : ''} />
                               <ProfileDetailItem icon={<IndianRupee size={20} />} label="Fee" value={doctor.consultationFee ? `₹${doctor.consultationFee}` : ''} />
                               <ProfileDetailItem icon={<Hospital size={20} />} label="Clinic" value={doctor.clinic} />
                            </div>
                        </div>
                        {doctor.bio && (
                           <div className='space-y-2'>
                                <h4 className='font-headline text-lg'>About</h4>
                                <p className='text-muted-foreground text-sm'>{doctor.bio}</p>
                           </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <div className="flex-1">
                      <BookAppointmentForm doctorId={doctor.id} />
                    </div>
                  </div>
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
            We couldn't find any doctors for that query. Please try a different
            one.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
