
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import {
  Loader2,
  ArrowLeft,
  Mail,
  Calendar,
  User,
  FileClock,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';

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

const ProfileDetailItem = ({ icon, label, value, loading = false }) => {
  if (!value && !loading) return null;

  return (
    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-3">
      <div className="mt-1 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-32" />
        ) : (
          <p className="font-medium">{value}</p>
        )}
      </div>
    </div>
  );
};

const patientFetcher = async ([, patientId]) => {
  if (!patientId) return null;
  const patientDocRef = doc(db, 'users', patientId);
  try {
    const patientDocSnap = await getDoc(patientDocRef);
    if (!patientDocSnap.exists()) {
      throw new Error('Patient not found');
    }
    const data = patientDocSnap.data();
    return {
      uid: data.uid,
      name: data.displayName,
      email: data.email,
      photoURL: data.photoURL,
      createdAt: data.createdAt,
    } as PatientProfile;
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: patientDocRef.path,
      operation: 'get',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

const appointmentsFetcher = async ([doctorId, patientId]) => {
  if (!doctorId || !patientId) return [];
  const appointmentsRef = collection(db, 'appointments');
  const q = query(
    appointmentsRef,
    where('doctorId', '==', doctorId),
    where('patientId', '==', patientId),
    orderBy('appointmentDate', 'desc')
  );

  try {
    const appointmentSnapshots = await getDocs(q);
    return appointmentSnapshots.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Appointment),
    }));
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: appointmentsRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export default function PatientRecordPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading, role } = useAuthState();
  const router = useRouter();

  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError,
  } = useSWR(['patient', params.id], patientFetcher);
  const { data: appointments, isLoading: appointmentsLoading } = useSWR(
    user ? [user.uid, params.id] : null,
    appointmentsFetcher
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }
    if (role && role !== 'doctor') {
      router.replace('/patient/dashboard');
    }
  }, [user, authLoading, role, router, params.id]);

  if (authLoading || (!user && !patientLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  if (patientError) {
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
              {patientLoading ? (
                <Skeleton className="h-24 w-24 rounded-full" />
              ) : (
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src={patient?.photoURL} alt={patient?.name} />
                  <AvatarFallback className="text-3xl">
                    {getInitials(patient?.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                {patientLoading ? (
                  <Skeleton className="mb-2 h-9 w-48" />
                ) : (
                  <h1 className="text-3xl font-bold font-headline">{patient?.name}</h1>
                )}
                <Badge variant="secondary">Patient</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <ProfileDetailItem
              icon={<Mail className="h-5 w-5" />}
              label="Email"
              value={patient?.email}
              loading={patientLoading}
            />
            <ProfileDetailItem
              icon={<Calendar className="h-5 w-5" />}
              label="Member Since"
              value={patient?.createdAt ? patient.createdAt.toDate().toLocaleDateString() : ''}
              loading={patientLoading}
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
              {appointmentsLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : (appointments || []).length > 0 ? (
                (appointments || []).map(appt => (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {appt.appointmentDate
                          .toDate()
                          .toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        appt.status === 'Confirmed'
                          ? 'default'
                          : appt.status === 'Completed'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {appt.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex h-24 flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground">
                    No appointment history found for this patient.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    