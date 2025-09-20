
'use client';

import { useEffect } from 'react';
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

const upcomingAppointments = [
  {
    doctor: 'Dr. Anjali Rao',
    specialty: 'Cardiologist',
    date: 'August 15, 2024',
    time: '11:00 AM',
    status: 'Confirmed',
  },
];

const pastAppointments = [
  {
    doctor: 'Dr. Vikram Singh',
    specialty: 'Dermatologist',
    date: 'July 22, 2024',
    time: '02:30 PM',
    status: 'Completed',
  },
  {
    doctor: 'Dr. Anjali Rao',
    specialty: 'Cardiologist',
    date: 'June 18, 2024',
    time: '10:00 AM',
    status: 'Completed',
  },
];

export default function AppointmentsPage() {
  const { user, loading } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const AppointmentCard = ({ appointment }) => (
    <Card className="border-border/30 bg-background">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-headline text-xl">
              {appointment.doctor}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {appointment.specialty}
            </p>
          </div>
          <Badge
            variant={
              appointment.status === 'Confirmed'
                ? 'default'
                : 'secondary'
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
            <span>{appointment.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>{appointment.time}</span>
          </div>
        </div>
        {appointment.status === 'Confirmed' && (
          <div className="flex gap-2">
            <Button size="sm">
              <Video className="mr-2 h-4 w-4" /> Join Video Call
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-secondary/30 py-12 md:py-20">
        <div className="container">
          <div className="mb-10">
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
                  upcomingAppointments.map((appt, index) => (
                    <AppointmentCard key={index} appointment={appt} />
                  ))
                ) : (
                  <Card className="flex h-40 flex-col items-center justify-center border-dashed">
                    <p className="text-muted-foreground">
                      You have no upcoming appointments.
                    </p>
                    <Button asChild variant="link">
                      <a href="/find-a-doctor">Book an Appointment</a>
                    </Button>
                  </Card>
                )}
              </div>
            </TabsContent>
            <TabsContent value="past">
              <div className="space-y-6">
                {pastAppointments.length > 0 ? (
                  pastAppointments.map((appt, index) => (
                    <AppointmentCard key={index} appointment={appt} />
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
