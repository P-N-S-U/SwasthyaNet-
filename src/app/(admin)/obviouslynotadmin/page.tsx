
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { adminDb } from '@/lib/firebase/server-auth';
import { Users, Stethoscope, Building, Calendar } from 'lucide-react';
import type { Timestamp } from 'firebase-admin/firestore';
import { AppointmentChart } from '@/components/admin/AppointmentChart';

interface Appointment {
  id: string;
  appointmentDate: Timestamp;
}

async function getDashboardData() {
  const usersPromise = adminDb.collection('users').count().get();
  const doctorsPromise = adminDb.collection('users').where('role', '==', 'doctor').count().get();
  const partnersPromise = adminDb.collection('partners').count().get();
  const appointmentsPromise = adminDb.collection('appointments').get();

  const [
    usersSnapshot,
    doctorsSnapshot,
    partnersSnapshot,
    appointmentsSnapshot,
  ] = await Promise.all([
    usersPromise,
    doctorsPromise,
    partnersPromise,
    appointmentsPromise,
  ]);
  
  const appointments = appointmentsSnapshot.docs.map(doc => ({
    id: doc.id,
    appointmentDate: doc.data().appointmentDate as Timestamp,
  }));

  return {
    totalUsers: usersSnapshot.data().count,
    totalDoctors: doctorsSnapshot.data().count,
    totalPartners: partnersSnapshot.data().count,
    totalAppointments: appointments.length,
    appointments,
  };
}

const getWeeklyChartData = (appointments: Appointment[] = []) => {
  const dateRange = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayStrings = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return dateRange.map(date => {
    const day = dayStrings[date.getDay()];
    const appointmentsOnDay = (appointments || []).filter(appt => {
      if (!appt.appointmentDate) return false;
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


const StatCard = ({ title, value, icon: Icon }) => (
  <Card className="border-red-500/20 bg-gray-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const weeklyChartData = getWeeklyChartData(data.appointments);

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline text-red-400">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          An overview of the SwasthyaNet platform's activity and key metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={data.totalUsers} icon={Users} />
        <StatCard title="Total Doctors" value={data.totalDoctors} icon={Stethoscope} />
        <StatCard title="Total Partners" value={data.totalPartners} icon={Building} />
        <StatCard title="Total Appointments" value={data.totalAppointments} icon={Calendar} />
      </div>

      <Card className="border-red-500/20 bg-gray-800">
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>
            A forecast of scheduled appointments for the upcoming week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentChart data={weeklyChartData} />
        </CardContent>
      </Card>
    </div>
  );
}
