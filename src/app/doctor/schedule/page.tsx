
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
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
        where('doctorId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const appts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        
        // Sort appointments by date ascending
        appts.sort((a, b) => a.appointmentDate.toDate().getTime() - b.appointmentDate.toDate().getTime());
        
        setAppointments(appts);
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

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  const selectedDay = date || new Date();
  const todaysAppointments = appointments.filter(appt => isSameDay(appt.appointmentDate.toDate(), selectedDay));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-secondary/30 py-12 md:py-20">
        <div className="container">
          <div className="mb-10">
            <h1 className="text-4xl font-bold font-headline">My Schedule</h1>
            <p className="mt-2 text-lg text-foreground/70">
              Manage your appointments and availability.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card className="border-border/30 bg-background">
                <CardHeader>
                  <CardTitle>Full Calendar</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border border-border/30"
                    modifiers={{
                      booked: appointments.map(a => a.appointmentDate.toDate())
                    }}
                    modifiersStyles={{
                      booked: { border: "2px solid hsl(var(--primary))" }
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
                      <p className="text-muted-foreground text-center pt-8">No appointments for this day.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
