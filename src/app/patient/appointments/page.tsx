
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import {
  Loader2,
  Calendar,
  Clock,
  Video,
  FileText,
  User,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import Link from 'next/link';
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
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: Timestamp;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
  const appointmentDate = appointment.appointmentDate.toDate();
  const date = appointmentDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = appointmentDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="border-border/30 bg-background">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-headline text-xl">
              {appointment.doctorName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {appointment.doctorSpecialization}
            </p>
          </div>
          <Badge
            variant={
              appointment.status === 'Confirmed' ? 'default' : 'secondary'
            }
          >
            {appointment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-foreground/80">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{time}</span>
          </div>
        </div>
        {appointment.status === 'Confirmed' && (
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href={`/patient/video/${appointment.id}`}>
                <Video className="mr-2 h-4 w-4" /> Join Video Call
              </Link>
            </Button>
            <Button size="sm" variant="outline">
              Reschedule
            </Button>
          </div>
        )}
        {appointment.status === 'Completed' && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <FileText className="mr-2 h-4 w-4" /> View Prescription
            </Button>
            <Button size="sm" variant="outline">
              <User className="mr-2 h-4 w-4" /> View Doctor's Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AppointmentsPage() {
  const { user, loading } = useAuthState();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('patientId', '==', user.uid),
        orderBy('appointmentDate', 'desc')
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

  const now = new Date();
  const upcomingAppointments = appointments.filter(
    appt => appt.appointmentDate.toDate() >= now
  );
  const pastAppointments = appointments.filter(
    appt => appt.appointmentDate.toDate() < now
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-secondary/30 py-12 md:py-20">
        <div className="container">
          <div className="mb-8">
             <Button asChild variant="outline" size="sm" className="mb-6">
                <Link href="/patient/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
             </Button>
            <h1 className="text-4xl font-bold font-headline">My Appointments</h1>
            <p className="mt-2 text-lg text-foreground/70">
              Manage your upcoming and past consultations.
            </p>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 md:w-fit">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              <div className="space-y-6">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appt) => (
                    <AppointmentCard key={appt.id} appointment={appt} />
                  ))
                ) : (
                  <Card className="flex h-40 flex-col items-center justify-center border-dashed">
                    <p className="text-muted-foreground">
                      You have no upcoming appointments.
                    </p>
                    <Button asChild variant="link">
                      <Link href="/find-a-doctor">Book an Appointment</Link>
                    </Button>
                  </Card>
                )}
              </div>
            </TabsContent>
            <TabsContent value="past">
              <div className="space-y-6">
                {pastAppointments.length > 0 ? (
                  pastAppointments.map((appt) => (
                    <AppointmentCard key={appt.id} appointment={appt} />
                  ))
                ) : (
                   <Card className="flex h-40 items-center justify-center border-dashed">
                    <p className="text-muted-foreground">
                      You have no past appointments.
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
