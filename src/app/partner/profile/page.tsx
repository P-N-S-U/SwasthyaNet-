
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Loader2,
  User,
  Mail,
  Edit,
  Building,
  FileBadge,
  Phone,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PartnerProfileForm } from '@/components/partner/PartnerProfileForm';
import { UpdateProfileForm } from '@/components/profile/UpdateProfileForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const ProfileDetailItem = ({ icon, label, value, loading = false }) => {
  if (!value && !loading) return null;

  return (
    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-4">
      <div className="mt-1 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-32" />
        ) : (
          <p className="font-medium">
            {value || 'Not provided'}
          </p>
        )}
      </div>
    </div>
  );
};


export default function PartnerProfilePage() {
  const { user, loading: authLoading, role } = useAuthState();
  const { profile, loading: profileLoading, mutate } = useUserProfile(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
    if (!authLoading && role && role !== 'partner') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, role, router]);
  
  const isLoading = authLoading || profileLoading;

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'P';
     const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const partnerProfile = profile?.profile || {};

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline">Partner Profile</h1>
        <p className="mt-2 text-lg text-foreground/70">
          Manage your business information and verification status.
        </p>
      </div>
      <div className="space-y-8">
        <Card className="border-border/30 bg-background">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-headline text-3xl font-bold">
                  {partnerProfile.name || user.displayName || 'Partner Profile'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{profile?.partnerType}</Badge>
                    <Badge variant={profile?.status === 'approved' ? 'default' : 'destructive'}>{profile?.status}</Badge>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Name
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your name and profile picture.
                    </DialogDescription>
                  </DialogHeader>
                  <UpdateProfileForm user={user} onUpdate={mutate} />
                </DialogContent>
              </Dialog>
            </div>
             <div className="mx-auto pt-4 text-center">
              <Avatar className="mx-auto h-24 w-24 border-4 border-primary">
                <AvatarImage src={profile?.photoURL || undefined} alt={partnerProfile.name || ''} />
                <AvatarFallback className="text-3xl">
                  {getInitials(partnerProfile.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </CardHeader>
          <CardContent className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileDetailItem icon={<Mail className="h-5 w-5" />} label="Email" value={profile?.email} loading={isLoading} />
            <ProfileDetailItem icon={<Building className="h-5 w-5" />} label="Business Name" value={partnerProfile.name || 'Not set'} loading={isLoading} />
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-background">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-2xl">
                Business Details
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild disabled={isLoading}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">
                      Business Information
                    </DialogTitle>
                    <DialogDescription>
                      This information will be used for verification and display.
                    </DialogDescription>
                  </DialogHeader>
                  <PartnerProfileForm profile={profile} onUpdate={mutate} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileDetailItem
                  loading={isLoading}
                  icon={<FileBadge className="h-5 w-5" />}
                  label="License Number"
                  value={partnerProfile.licenseNumber}
                />
                <ProfileDetailItem
                  loading={isLoading}
                  icon={<Phone className="h-5 w-5" />}
                  label="Contact Number"
                  value={partnerProfile.contact}
                />
              </div>
              <ProfileDetailItem
                loading={isLoading}
                icon={<MapPin className="h-5 w-5" />}
                label="Full Address"
                value={partnerProfile.address}
              />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
