
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { adminDb } from '@/lib/firebase/server-auth';
import { Users, Stethoscope, Building, Calendar } from 'lucide-react';

async function getStats() {
  const usersPromise = adminDb.collection('users').count().get();
  const doctorsPromise = adminDb.collection('users').where('role', '==', 'doctor').count().get();
  const partnersPromise = adminDb.collection('partners').count().get();
  const appointmentsPromise = adminDb.collection('appointments').count().get();

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

  return {
    totalUsers: usersSnapshot.data().count,
    totalDoctors: doctorsSnapshot.data().count,
    totalPartners: partnersSnapshot.data().count,
    totalAppointments: appointmentsSnapshot.data().count,
  };
}

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
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline text-red-400">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          An overview of the SwasthyaNet platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard title="Total Doctors" value={stats.totalDoctors} icon={Stethoscope} />
        <StatCard title="Total Partners" value={stats.totalPartners} icon={Building} />
        <StatCard title="Total Appointments" value={stats.totalAppointments} icon={Calendar} />
      </div>

      <Card className="border-red-500/20 bg-gray-800">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            You are logged in as an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            From here, you can manage users, approve partners, and monitor platform activity.
            Use the sidebar to navigate to different management sections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
