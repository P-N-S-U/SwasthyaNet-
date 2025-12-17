import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline text-red-400">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-400">
          Welcome to the SwasthyaNet administrative panel.
        </p>
      </div>

      <Card className="border-red-500/20 bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-red-400" />
            <CardTitle>System Status</CardTitle>
          </div>
          <CardDescription>
            You are logged in as an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            From here, you can manage users, approve partners, and monitor the
            platform. Use the sidebar to navigate to different management
            sections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
