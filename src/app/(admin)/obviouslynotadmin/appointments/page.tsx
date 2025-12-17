
import { adminDb } from '@/lib/firebase/server-auth';
import type { Timestamp } from 'firebase-admin/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhotoURL?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  appointmentDate: Timestamp;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

async function getAppointments(): Promise<Appointment[]> {
  const snapshot = await adminDb
    .collection('appointments')
    .orderBy('appointmentDate', 'desc')
    .limit(50) // Limit to last 50 for performance
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(doc => ({
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

const StatusBadge = ({ status }: { status: Appointment['status'] }) => {
  const variant =
    status === 'Completed'
      ? 'default'
      : status === 'Cancelled'
      ? 'destructive'
      : 'secondary';
  const Icon =
    status === 'Completed'
      ? CheckCircle
      : status === 'Cancelled'
      ? XCircle
      : Clock;
  const colorClass =
    status === 'Completed'
      ? 'bg-green-600/90'
      : status === 'Cancelled'
      ? ''
      : '';

  return (
    <Badge variant={variant} className={`gap-1.5 ${colorClass}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </Badge>
  );
};

const FloatingAvatar = ({
  name,
  id,
  role,
  photoURL,
  isPatient,
}: {
  name: string;
  id: string;
  role: string;
  photoURL?: string;
  isPatient: boolean;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={`/obviouslynotadmin/users/${id}?from=${role}s`}>
          <Avatar
            className={`h-12 w-12 border-4 bg-gray-700 transition-all hover:-translate-y-1 hover:scale-110 ${
              isPatient ? 'border-blue-400' : 'border-purple-400'
            }`}
          >
            <AvatarImage src={photoURL} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
        </Link>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-gray-100 border-red-500/30">
        <div className="flex items-center gap-2">
          {isPatient ? (
            <User className="h-4 w-4 text-blue-400" />
          ) : (
            <Stethoscope className="h-4 w-4 text-purple-400" />
          )}
          <div>
            <p className="font-bold">{name}</p>
            <p className="text-xs capitalize">{role}</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default async function AppointmentsManagementPage() {
  const appointments = await getAppointments();

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline text-red-400">
          Appointment Timeline
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          A live feed of all appointments across the platform.
        </p>
      </div>

      {appointments.length > 0 ? (
        <div className="relative pl-6">
          {/* Vertical line for the timeline */}
          <div className="absolute left-12 top-0 h-full w-0.5 bg-red-500/20"></div>

          <div className="space-y-10">
            {appointments.map(appt => {
              const apptDate = appt.appointmentDate.toDate();
              return (
                <div key={appt.id} className="relative flex items-center gap-6">
                  {/* Timeline Dot */}
                  <div className="absolute left-[38px] z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 ring-8 ring-gray-900">
                    <CalendarDays className="h-4 w-4 text-red-400" />
                  </div>

                  <Card className="flex-1 border-red-500/20 bg-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div>
                        <CardTitle className="text-sm font-medium text-gray-400">
                          {apptDate.toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </CardTitle>
                        <p className="text-xl font-bold">
                          {apptDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <StatusBadge status={appt.status} />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <FloatingAvatar
                          name={appt.patientName}
                          id={appt.patientId}
                          photoURL={appt.patientPhotoURL}
                          role="patient"
                          isPatient={true}
                        />
                        <div className="h-px flex-grow bg-gradient-to-r from-blue-400 via-purple-400 to-purple-400"></div>
                        <FloatingAvatar
                          name={appt.doctorName}
                          id={appt.doctorId}
                          role="doctor"
                          isPatient={false}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-red-500/20 bg-gray-800">
          <CardContent className="py-24 text-center">
            <p className="text-lg text-gray-400">
              No appointments found on the platform yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
