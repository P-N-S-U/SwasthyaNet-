
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import {
  Loader2,
  Calendar,
  Users,
  AlertTriangle,
  Video,
  IndianRupee,
  Award,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppointmentsChart } from '@/components/doctor/AppointmentsChart';
import { RecentPatients } from '@/components/doctor/RecentPatients';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  collection,
  query,
  where,
  Timestamp,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import useSWR from 'swr';
import { getUserProfile } from '@/lib/firebase/firestore';
import { completeAppointment } from '@/app/actions/appointments';
import { useToast } from '@/hooks/use-toast';

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

const appointmentsFetcher = async ([, uid]) => {
  if (!uid) return [];
  const q = query(
    collection(db, 'appointments'),
    where('doctorId', '==', uid),
    orderBy('appointmentDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
};

const profileFetcher = async (uid) => {
    if (!uid) return null;
    try {
      return await getUserProfile(uid);
    } catch(e) {
      // Errors will be handled by the global error emitter in firestore.ts
      return null;
    }
};


const getWeeklyChartData = (appointments: Appointment[] = []) => {
  // Show from yesterday up to 5 days in the future
  const dateRange = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 1 + i); // Start from yesterday
    return d;
  });

  const dayStrings = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return dateRange.map(date => {
    const day = dayStrings[date.getDay()];
    const appointmentsOnDay = (appointments || []).filter(appt => {
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
  const { user, loading: authLoading, role } = useAuthState();
  const router = useRouter();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useSWR(
    user ? user.uid : null,
    profileFetcher
  );

  const { data: allAppointments, isLoading: appointmentsLoading, mutate } = useSWR(
    user ? ['appointments', user.uid] : null,
    appointmentsFetcher,
    { revalidateOnFocus: true }
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
     if (!authLoading && role && role !== 'doctor') {
      router.replace('/patient/dashboard');
    }
  }, [user, authLoading, role, router]);
  
  const handleCompleteAppointment = async (appointmentId: string) => {
    const result = await completeAppointment(appointmentId);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Appointment marked as completed.',
      });
      mutate(); // Re-fetch appointments
    }
  };

  const pageIsLoading = authLoading || profileLoading || appointmentsLoading || !user;

  if (pageIsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const isProfileComplete =
    profile &&
    profile.specialization &&
    profile.qualifications &&
    profile.experience &&
    profile.consultationFee;

  const upcomingAppointments = (allAppointments || []).filter(
    appt => appt.appointmentDate.toDate() >= new Date() && appt.status === 'Confirmed'
  ).sort((a,b) => a.appointmentDate.toDate().getTime() - b.appointmentDate.toDate().getTime());
  
  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  const weeklyChartData = getWeeklyChartData(allAppointments);
  
  const getRecentPatients = (): RecentPatient[] => {
    const uniquePatients = new Map<string, RecentPatient>();
    
    // Appointments are already sorted by date descending
    for (const appt of (allAppointments || [])) {
      if (!uniquePatients.has(appt.patientId) && uniquePatients.size < 5) {
        uniquePatients.set(appt.patientId, { id: appt.patientId, name: appt.patientName, photoURL: appt.patientPhotoURL });
      }
    }
    
    return Array.from(uniquePatients.values());
  };

  const recentPatients = getRecentPatients();

  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const todaysAppointmentsCount = upcomingAppointments.filter(appt => isSameDay(appt.appointmentDate.toDate(), new Date())).length;

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline">
          Doctor Dashboard
        </h1>
        <p className="mt-2 text-lg text-foreground/70">
          Welcome back, Dr. {user.displayName || 'User'}!
        </p>
      </div>

      {!isProfileComplete && (
        <Alert variant="destructive" className="border-amber-500/50 text-amber-400 [&>svg]:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">
            Complete Your Profile
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            Please provide your professional details to start accepting appointments.
            <Button asChild size="sm" className="ml-4">
              <Link href="/doctor/profile">Update Profile</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Actions & Overview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            {nextAppointment ? (
                <Card className="border-border/30 bg-gradient-to-br from-primary/10 to-background">
                <CardHeader>
                    <CardTitle className="font-headline">Next Appointment</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                    <p className="text-2xl font-bold">
                        {nextAppointment.patientName}
                    </p>
                    <p className="text-muted-foreground">
                        Today at {nextAppointment.appointmentDate.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild size="lg" disabled={!isProfileComplete}>
                            <Link href={`/doctor/video/${nextAppointment.id}`}>
                                <Video className="mr-2 h-5 w-5" /> Join Call
                            </Link>
                        </Button>
                         <Button
                            size="lg"
                            variant="outline"
                            onClick={() => handleCompleteAppointment(nextAppointment.id)}
                            disabled={!isProfileComplete}
                        >
                            <CheckCircle className="mr-2 h-5 w-5" /> Mark as Complete
                        </Button>
                    </div>
                </CardContent>
                </Card>
            ) : (
                <Card className="flex h-full min-h-[160px] items-center justify-center border-dashed">
                    <div className="text-center">
                        <p className="text-lg font-medium text-muted-foreground">No upcoming appointments</p>
                        <p className="text-sm text-muted-foreground">Your schedule is clear for now.</p>
                    </div>
                </Card>
            )}
        </div>
        <Card className="border-border/30 bg-background">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{todaysAppointmentsCount}</p>
            <p className="text-muted-foreground">Confirmed appointments today.</p>
             <Button asChild size="sm" variant="outline" className="mt-4" disabled={!isProfileComplete}>
              <Link href="/doctor/schedule">View Full Schedule</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Key Stats */}
       <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <Card className="border-border/30 bg-secondary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPatients.length}</div>
            <p className="text-xs text-muted-foreground">All-time consulted patients</p>
          </CardContent>
        </Card>
         <Card className="border-border/30 bg-secondary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Total confirmed appointments</p>
          </CardContent>
        </Card>
         <Card className="border-border/30 bg-secondary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultation Fee</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{profile?.consultationFee || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Per consultation</p>
          </CardContent>
        </Card>
         <Card className="border-border/30 bg-secondary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experience</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.experience || 'N/A'} yrs</div>
            <p className="text-xs text-muted-foreground">In {profile?.specialization || 'field'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className={`col-span-1 border-border/30 bg-background lg:col-span-3 ${!isProfileComplete && 'opacity-50'}`}>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Overview of appointments for the week.</p>
          </CardHeader>
          <CardContent>
            <AppointmentsChart data={weeklyChartData} />
          </CardContent>
        </Card>
        <Card className="col-span-1 border-border/30 bg-background lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
             <p className="text-sm text-muted-foreground">Your 5 most recently consulted patients.</p>
          </CardHeader>
          <CardContent>
            <RecentPatients patients={recentPatients}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    