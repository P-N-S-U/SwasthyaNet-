
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Loader2, Users, Eye } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


interface Patient {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  lastAppointment: Timestamp;
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};


export default function PatientsPage() {
  const { user, loading, role } = useAuthState();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
    if (user && role) {
      if (role !== 'doctor') {
        router.replace('/patient/dashboard');
      } else {
        const fetchPatients = async () => {
          try {
            const appointmentsRef = collection(db, 'appointments');
            const q = query(
              appointmentsRef,
              where('doctorId', '==', user.uid),
              orderBy('appointmentDate', 'desc')
            );
            const appointmentSnapshots = await getDocs(q);

            const patientData = new Map<string, { lastAppointment: Timestamp; name: string; photoURL?: string }>();
            appointmentSnapshots.forEach(doc => {
              const data = doc.data();
              if (!patientData.has(data.patientId)) {
                patientData.set(data.patientId, {
                  lastAppointment: data.appointmentDate,
                  name: data.patientName,
                  photoURL: data.patientPhotoURL,
                });
              }
            });
            
            const patientList: Patient[] = [];
            for (const [patientId, info] of patientData.entries()) {
                const userDoc = await getDoc(doc(db, 'users', patientId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    patientList.push({
                        id: patientId,
                        name: info.name,
                        email: userData.email || 'No email found',
                        photoURL: info.photoURL,
                        lastAppointment: info.lastAppointment,
                    });
                }
            }

            setPatients(patientList);
          } catch (error) {
            console.error("Error fetching patients: ", error);
          } finally {
            setPageLoading(false);
          }
        };
        fetchPatients();
      }
    }
  }, [user, loading, role, router]);

  if (loading || pageLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading Patients...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline">My Patients</h1>
        <p className="mt-2 text-lg text-foreground/70">
          A list of all patients you have consulted with.
        </p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">
                Patient Records
              </CardTitle>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Last Appointment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length > 0 ? (
                patients.map(patient => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={patient.photoURL} alt={patient.name} />
                          <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      {patient.lastAppointment.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button asChild variant="outline" size="sm">
                         <Link href={`/doctor/patients/${patient.id}`}>
                           <Eye className="mr-2 h-4 w-4" /> View Record
                         </Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No patients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
