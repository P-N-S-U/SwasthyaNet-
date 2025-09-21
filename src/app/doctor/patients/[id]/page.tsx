
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Loader2, ArrowLeft, Mail, Calendar, User, FileClock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PatientProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
}

interface Appointment {
  id: string;
  appointmentDate: Timestamp;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const ProfileDetailItem = ({ icon, label, value }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-3">
      <div className="mt-1 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
};


export default function PatientRecordPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuthState();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  
  const patientId = params.id;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }

    const fetchPatientData = async () => {
      try {
        // Fetch patient profile
        const patientDocRef = doc(db, 'users', patientId);
        const patientDocSnap = await getDoc(patientDocRef);

        if (!patientDocSnap.exists()) {
          // Handle case where patient doesn't exist
          setPageLoading(false);
          return;
        }
        
        const patientData = patientDocSnap.data();
        setPatient({
            uid: patientData.uid,
            name: patientData.displayName,
            email: patientData.email,
            photoURL: patientData.photoURL,
            createdAt: patientData.createdAt,
        });

        // Fetch patient appointments with this doctor
        const appointmentsRef = collection(db, 'appointments');
        const q = query(
          appointmentsRef,
          where('doctorId', '==', user.uid),
          where('patientId', '==', patientId),
          orderBy('appointmentDate', 'desc')
        );
        const appointmentSnapshots = await getDocs(q);
        
        const appointmentList: Appointment[] = appointmentSnapshots.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Appointment));

        setAppointments(appointmentList);

      } catch (error) {
        console.error("Error fetching patient data: ", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchPatientData();
  }, [user, authLoading, patientId, router]);


  if (pageLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading Patient Record...</p>
      </div>
    );
  }

  if (!patient) {
     return (
      <div>
        <Button asChild variant="outline" size="sm" className="mb-6">
            <Link href="/doctor/patients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Patients
            </Link>
        </Button>
        <h1 className="text-2xl font-bold">Patient not found</h1>
        <p>The requested patient record could not be located.</p>
      </div>
    );
  }

  return (
    <div>
       <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/doctor/patients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
          </Link>
       </Button>

       <div className="space-y-8">
            <Card className="border-border/30 bg-background">
                <CardHeader>
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                        <Avatar className="h-24 w-24 border-4 border-primary">
                            <AvatarImage src={patient.photoURL} alt={patient.name} />
                            <AvatarFallback className="text-3xl">{getInitials(patient.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold font-headline">{patient.name}</h1>
                             <Badge variant="secondary">Patient</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <ProfileDetailItem icon={<Mail className="h-5 w-5" />} label="Email" value={patient.email} />
                    <ProfileDetailItem 
                        icon={<Calendar className="h-5 w-5" />} 
                        label="Member Since" 
                        value={patient.createdAt ? patient.createdAt.toDate().toLocaleDateString() : 'N/A'} 
                    />
                </CardContent>
            </Card>

            <Card className="border-border/30 bg-background">
                 <CardHeader>
                    <div className="flex items-center gap-3">
                        <FileClock className="h-6 w-6 text-primary" />
                        <CardTitle className="font-headline text-2xl">
                            Appointment History
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {appointments.length > 0 ? (
                            appointments.map(appt => (
                                <div key={appt.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                                    <div>
                                        <p className="font-semibold">{appt.appointmentDate.toDate().toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                                    </div>
                                     <Badge variant={appt.status === 'Confirmed' ? 'default' : 'secondary'}>
                                        {appt.status}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                             <div className="flex h-24 flex-col items-center justify-center text-center">
                                <p className="text-muted-foreground">No appointment history found for this patient.</p>
                             </div>
                        )}
                    </div>
                </CardContent>
            </Card>
       </div>
    </div>
  );
}

