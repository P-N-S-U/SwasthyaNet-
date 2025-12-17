
import { adminDb } from '@/lib/firebase/server-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Briefcase,
  GraduationCap,
  CalendarClock,
  IndianRupee,
  Hospital,
  FileText,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Timestamp } from 'firebase-admin/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: 'patient' | 'doctor';
  photoURL?: string;
  createdAt: Timestamp;
  specialization?: string;
  qualifications?: string;
  experience?: number;
  consultationFee?: number;
  clinic?: string;
  bio?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: Timestamp;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

async function getUserData(id: string): Promise<UserProfile | null> {
  const userRef = adminDb.collection('users').doc(id);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return null;
  }

  const data = userSnap.data() as Omit<UserProfile, 'id'>;

  return {
    id: userSnap.id,
    ...data,
  };
}

async function getUserAppointments(
  id: string,
  role: 'patient' | 'doctor'
): Promise<Appointment[]> {
  const fieldToQuery = role === 'patient' ? 'patientId' : 'doctorId';
  const appointmentsRef = adminDb.collection('appointments');
  const q = appointmentsRef
    .where(fieldToQuery, '==', id)
    .orderBy('appointmentDate', 'desc');

  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    return [];
  }

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Appointment, 'id'>),
  }));
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const ProfileDetailItem = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 rounded-lg p-3 bg-gray-700/50">
            <Icon className="h-5 w-5 mt-0.5 text-red-400" />
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="font-medium text-gray-200">{value}</p>
            </div>
        </div>
    );
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string };
}) {
  const user = await getUserData(params.id);

  if (!user) {
    notFound();
  }

  const appointments = await getUserAppointments(params.id, user.role);

  const backUrl = searchParams.from
    ? `/obviouslynotadmin/users?tab=${searchParams.from}`
    : '/obviouslynotadmin/users';

  return (
    <div className="space-y-8">
      <Button asChild variant="outline" size="sm" className="mb-6 text-gray-300 hover:bg-red-500/10 hover:text-red-300">
        <Link href={backUrl}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      {/* User Profile Card */}
      <Card className="border-red-500/20 bg-gray-800">
        <CardHeader>
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <Avatar className="h-24 w-24 border-4 border-red-500">
              <AvatarImage src={user.photoURL} alt={user.displayName} />
              <AvatarFallback className="text-3xl">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold font-headline text-gray-100">{user.displayName}</h1>
              <Badge variant="secondary" className="mt-2 capitalize">{user.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <ProfileDetailItem icon={Mail} label="Email" value={user.email} />
            <ProfileDetailItem icon={Calendar} label="Member Since" value={user.createdAt.toDate().toLocaleDateString()} />
        </CardContent>
      </Card>

      {/* Professional Details for Doctors */}
      {user.role === 'doctor' && (
        <Card className="border-red-500/20 bg-gray-800">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-red-400" />
                    <CardTitle>Professional Details</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ProfileDetailItem icon={Briefcase} label="Specialization" value={user.specialization} />
                    <ProfileDetailItem icon={GraduationCap} label="Qualifications" value={user.qualifications} />
                    <ProfileDetailItem icon={CalendarClock} label="Years of Experience" value={user.experience ? `${user.experience} years` : null} />
                    <ProfileDetailItem icon={IndianRupee} label="Consultation Fee" value={user.consultationFee ? `₹${user.consultationFee}` : null} />
                </div>
                <ProfileDetailItem icon={Hospital} label="Clinic/Hospital" value={user.clinic} />
                {user.bio && <ProfileDetailItem icon={FileText} label="Bio" value={user.bio} />}
            </CardContent>
        </Card>
      )}

      {/* Appointment History */}
      <Card className="border-red-500/20 bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-red-400" />
            <CardTitle>Appointment History</CardTitle>
          </div>
          <CardDescription>
            A record of all past and upcoming appointments for this user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-red-500/30 hover:bg-gray-700/50">
                <TableHead>{user.role === 'patient' ? 'Doctor' : 'Patient'}</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length > 0 ? (
                appointments.map(appt => (
                  <TableRow key={appt.id} className="border-red-500/30 hover:bg-gray-700/50">
                    <TableCell className="font-medium">
                      {user.role === 'patient' ? appt.doctorName : appt.patientName}
                    </TableCell>
                    <TableCell>
                      {appt.appointmentDate.toDate().toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={appt.status === 'Completed' ? 'default' : appt.status === 'Confirmed' ? 'secondary' : 'destructive'}
                       className={appt.status === 'Completed' ? 'bg-green-600' : ''}
                      >
                         {appt.status === 'Completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                         {appt.status === 'Cancelled' && <XCircle className="mr-1 h-3 w-3" />}
                        {appt.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No appointments found for this user.
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
