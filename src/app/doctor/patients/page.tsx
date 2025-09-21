
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Loader2, Users, Mail, Calendar, User } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Patient {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  lastAppointment: Timestamp;
  memberSince?: Timestamp;
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

export default function PatientsPage() {
  const { user, loading, role } = useAuthState();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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
                        memberSince: userData.createdAt,
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
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm" onClick={() => setSelectedPatient(patient)}>
                             View Profile
                           </Button>
                        </DialogTrigger>
                        {selectedPatient && selectedPatient.id === patient.id && (
                           <DialogContent className="sm:max-w-md">
                           <DialogHeader className="items-center text-center">
                                <Avatar className="h-24 w-24 border-4 border-primary">
                                <AvatarImage src={selectedPatient.photoURL} alt={selectedPatient.name} />
                                <AvatarFallback className="text-3xl">{getInitials(selectedPatient.name)}</AvatarFallback>
                                </Avatar>
                                <DialogTitle className="pt-2 text-2xl font-bold font-headline">{selectedPatient.name}</DialogTitle>
                                <DialogDescription>
                                    <Badge variant="secondary">Patient</Badge>
                                </DialogDescription>
                           </DialogHeader>
                            <div className="mt-4 grid grid-cols-1 gap-4">
                                <ProfileDetailItem icon={<Mail className="h-5 w-5" />} label="Email" value={selectedPatient.email} />
                                <ProfileDetailItem 
                                    icon={<Calendar className="h-5 w-5" />} 
                                    label="Member Since" 
                                    value={selectedPatient.memberSince ? selectedPatient.memberSince.toDate().toLocaleDateString() : 'N/A'} 
                                />
                            </div>
                         </DialogContent>
                        )}
                      </Dialog>
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
