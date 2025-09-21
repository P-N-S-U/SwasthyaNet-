
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
  patientId: string;
  patientPhotoURL?: string;
  appointmentDate: Timestamp;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

export interface RecentPatient {
    id: string;
    name: string;
    photoURL?: string;
}

const getWeeklyChartData = (appointments: Appointment[]) => {
  // Show from yesterday up to 5 days in the future
  const dateRange = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 1 + i); // Start from yesterday
    return d;
  });

  const dayStrings = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return dateRange.map(date => {
    const day = dayStrings[date.getDay()];
    const appointmentsOnDay = appointments.filter(appt => {
      const apptDate = appt.appointmentDate.toDate();
      return (
        apptDate.getFullYear() === date.getFullYear() &&
        apptDate.getMonth() === date.getMonth() &&
        apptDate.getDate() === date.getDate()
      );
    }).length;

    return { day, appointments: appointmentsOnDay };
  });
};


export default function DoctorDashboardPage() {
  const { user, loading: authLoading } = useAuthState();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  // Effect for auth and profile fetching
  useEffect(() => {
    if (authLoading) return; // Wait until auth state is determined

    if (!user) {
      router.push('/auth');
      setProfileLoading(false);
      setAppointmentsLoading(false);
      return;
    }

    // Fetch Profile
    getUserProfile(user.uid).then(userProfile => {
      setProfile(userProfile);
      setProfileLoading(false);

      // Once profile is loaded, fetch appointments
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('doctorId', '==', user.uid),
        orderBy('appointmentDate', 'desc')
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const appts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        setAllAppointments(appts);
        setAppointmentsLoading(false);
      }, (error) => {
          console.error("Error fetching appointments: ", error);
          setAppointmentsLoading(false);
      });
      
      return () => unsubscribe();
    });

  }, [user, authLoading, router]);


  const isProfileComplete =
    profile &&
    profile.specialization &&
    profile.qualifications &&
    profile.experience &&
    profile.consultationFee;

  if (authLoading || profileLoading || appointmentsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
      return null; // Should have been redirected, but good for safety
  }


  const upcomingAppointments = allAppointments.filter(
    appt => appt.appointmentDate.toDate() >= new Date()
  ).sort((a,b) => a.appointmentDate.toDate().getTime() - b.appointmentDate.toDate().getTime());

  const weeklyChartData = getWeeklyChartData(allAppointments);
  
  const getRecentPatients = (): RecentPatient[] => {
    const uniquePatients = new Map<string, RecentPatient>();
    
    // Appointments are already sorted by date descending
    for (const appt of allAppointments) {
      if (!uniquePatients.has(appt.patientId) && uniquePatients.size < 5) {
        uniquePatients.set(appt.patientId, { id: appt.patientId, name: appt.patientName, photoURL: appt.patientPhotoURL });
      }
    }
    
    return Array.from(uniquePatients.values());
  };

  const recentPatients = getRecentPatients();

  return (
    <div>
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
              <Link href="/doctor/profile">Go to Profile</Link>
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

        <Card className={`border-border/30 bg-background ${!isProfileComplete && 'opacity-50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Manage Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPatients.length} Total</div>
             <p className="text-xs text-muted-foreground">
              View and manage patient records.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4" disabled={!isProfileComplete}>
              <Link href="/doctor/patients">View Patients</Link>
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
              <Link href="/doctor/profile">Edit Profile</Link>
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
            <AppointmentsChart data={weeklyChartData} />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentPatients patients={recentPatients}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
