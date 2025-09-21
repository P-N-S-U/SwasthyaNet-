
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface Appointment {
  id: string;
  patientName: string;
  appointmentDate: Timestamp;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

export default function SchedulePage() {
  const { user, loading } = useAuthState();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }

    if (user) {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('doctorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const appts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        setAppointments(appts);
        setAppointmentsLoading(false);
      }, (error) => {
          console.error("Error fetching appointments: ", error);
          setAppointmentsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, loading, router]);

  if (loading || !user || appointmentsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  const selectedDay = date || new Date();
  const todaysAppointments = appointments.filter(appt => isSameDay(appt.appointmentDate.toDate(), selectedDay))
    .sort((a, b) => a.appointmentDate.toDate().getTime() - b.appointmentDate.toDate().getTime());

  return (
    <div>
        <div className="mb-10">
            <h1 className="text-4xl font-bold font-headline">My Schedule</h1>
            <p className="mt-2 text-lg text-foreground/70">
                Manage your appointments and availability.
            </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
        <div>
            <Card className="border-border/30 bg-background">
            <CardContent className="p-0">
                <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full"
                modifiers={{
                    booked: appointments.map(a => a.appointmentDate.toDate())
                }}
                modifiersStyles={{
                    booked: { border: "2px solid hsl(var(--primary))", borderRadius: 'var(--radius)' }
                }}
                />
            </CardContent>
            </Card>
        </div>
        <div>
            <Card className="border-border/30 bg-background">
            <CardHeader>
                <CardTitle>Appointments for {selectedDay.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {todaysAppointments.length > 0 ? (
                    todaysAppointments.map(appt => {
                    const apptDate = appt.appointmentDate.toDate();
                    return (
                        <div key={appt.id} className="flex items-start gap-4 rounded-lg bg-secondary/50 p-4">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <span className="text-sm">{apptDate.toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                            <span className="text-xl font-bold">{apptDate.getDate()}</span>
                        </div>
                        <div>
                            <p className="font-semibold">
                            Consultation with {appt.patientName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                            {apptDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        </div>
                    )
                    })
                ) : (
                    <div className="flex h-40 flex-col items-center justify-center text-center">
                        <p className="text-muted-foreground">No appointments for this day.</p>
                    </div>
                )}
                </div>
            </CardContent>
            </Card>
        </div>
        </div>
    </div>
  );
}
