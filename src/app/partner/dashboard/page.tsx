'use client';

import { useAuthState } from '@/hooks/use-auth-state';
import {
  Loader2,
  AlertTriangle,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function PartnerDashboardPage() {
  const { user, profile, loading } = useAuthState();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const partnerProfile = profile?.partnerProfile;
  const isProfileComplete = partnerProfile?.licenseNumber && partnerProfile?.address;
  const isApproved = partnerProfile?.status === 'approved';

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline">Partner Dashboard</h1>
        <p className="mt-2 text-lg text-foreground/70">
          Welcome, {profile?.displayName || 'Partner'}!
        </p>
      </div>

      {/* Status Alerts */}
      {!isApproved && (
        <Alert variant="destructive" className="border-amber-500/50 text-amber-400 [&>svg]:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Account Pending Approval</AlertTitle>
          <AlertDescription>
            Your account is currently under review. You will be notified once it's approved. Please ensure your profile is complete to expedite the process.
          </AlertDescription>
        </Alert>
      )}
       {isApproved && (
        <Alert className="border-green-500/50 text-green-400 [&>svg]:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Account Approved</AlertTitle>
          <AlertDescription>
            Your account is active. You can now receive and manage service requests.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Completion Alert */}
      {!isProfileComplete && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Complete Your Profile</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            Your profile is incomplete. Please add your business details to get approved.
            <Button asChild size="sm" className="ml-4">
              <Link href="/partner/profile">Update Profile</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="border-border/30 bg-background">
          <CardHeader>
            <CardTitle>Prescription Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-1/2" /> : <p className="text-4xl font-bold">0</p>}
            <p className="text-muted-foreground">New pending prescriptions.</p>
            <Button size="sm" variant="outline" className="mt-4" disabled={!isApproved}>View Prescriptions</Button>
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-background">
          <CardHeader>
            <CardTitle>Verification Documents</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">
                Upload your business license and other documents for verification.
             </p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link href="/partner/profile">
                <FileText className="mr-2 h-4 w-4" />
                Manage Documents
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
