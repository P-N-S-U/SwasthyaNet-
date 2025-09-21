
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import {
  Loader2,
  Calendar,
  Users,
  Briefcase,
  AlertTriangle,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppointmentsChart } from '@/components/doctor/AppointmentsChart';
import { RecentPatients } from '@/components/doctor/RecentPatients';
import { getUserProfile } from '@/lib/firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

export default function DoctorDashboardPage() {
  const { user, loading } = useAuthState();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }
    if (user) {
      getUserProfile(user.uid).then(userProfile => {
        setProfile(userProfile);
        setProfileLoading(false);
      });

      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('doctorId', '==', user.uid),
        where('appointmentDate', '>=', Timestamp.now()),
        orderBy('appointmentDate', 'asc')
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const appts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        setUpcomingAppointments(appts);
        setAppointmentsLoading(false);
      }, (error) => {
          console.error("Error fetching appointments: ", error);
          setAppointmentsLoading(false);
      });
      
      return () => unsubscribe();
    }
  }, [user, loading, router]);

  const isProfileComplete =
    profile &&
    profile.specialization &&
    profile.qualifications &&
    profile.experience &&
    profile.consultationFee;

  if (loading || !user || profileLoading || appointmentsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow py-12 md:py-20">
        <div className="container">
          <div className="mb-10">
            <h1 className="text-4xl font-bold font-headline">
              Doctor Dashboard
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              Welcome back, Dr. {user.displayName || 'User'}!
            </p>
          </div>

          {!isProfileComplete && (
            <Alert variant="destructive" className="mb-8 border-amber-500/50 text-amber-400 [&>svg]:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold">
                Complete Your Profile to Unlock All Features
              </AlertTitle>
              <AlertDescription>
                Please provide your professional details to start accepting
                appointments.
                <Button asChild size="sm" className="ml-4">
                  <Link href="/profile">Go to Profile</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <Card className="border-border/30 bg-background">
              <CardHeader>
                <CardTitle>Upcoming Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map(appt => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 p-4"
                      >
                        <div>
                          <p className="font-semibold">
                            Call with {appt.patientName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Scheduled for {appt.appointmentDate.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <Button asChild size="sm" disabled={!isProfileComplete}>
                           <Link href={`/doctor/video/${appt.id}`}>
                            <Video className="mr-2 h-4 w-4" /> Join Call
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming calls right now.</p>
                )}
              </CardContent>
            </Card>
          </div>


          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card
              className={`border-border/30 bg-background ${!isProfileComplete && 'opacity-50'}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                <p className="text-xs text-muted-foreground">
                  in the next 7 days
                </p>
                <Button asChild size="sm" className="mt-4" disabled={!isProfileComplete}>
                  <Link href="/doctor/schedule">View Schedule</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,250</div>
                <p className="text-xs text-muted-foreground">
                  +50 new this month
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href="#">Manage Patients</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  My Practice
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {profile?.specialization || 'Not Set'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile?.clinic || 'General Hospital'}
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
            <Card className={`col-span-1 lg:col-span-3 ${!isProfileComplete && 'opacity-50'}`}>
              <CardHeader>
                <CardTitle>Weekly Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentsChart />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentPatients />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
