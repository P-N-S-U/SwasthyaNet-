
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  Loader2,
  User,
  Mail,
  Calendar,
  Edit,
  Briefcase,
  GraduationCap,
  CalendarClock,
  IndianRupee,
  Hospital,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DoctorProfileForm } from '@/components/doctor/DoctorProfileForm';
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

const ProfileDetailItem = ({ icon, label, value, isBio = false, loading = false }) => {
  if (!value && !loading && !isBio) return null;

  return (
    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-4">
      <div className="mt-1 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-32" />
        ) : (
          <p className={`font-medium ${isBio ? 'whitespace-pre-wrap' : ''}`}>
            {value || 'Not provided'}
          </p>
        )}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, loading: authLoading, role } = useAuthState();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
    if (!authLoading && role && role !== 'doctor') {
      router.replace('/patient/dashboard');
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

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return 'U';
     const names = nameOrEmail.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  };

  const registrationDate = profile?.createdAt
    ? profile.createdAt.toDate().toLocaleDateString()
    : 'Not available';

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline">Profile</h1>
        <p className="mt-2 text-lg text-foreground/70">
          Manage your personal and professional information.
        </p>
      </div>
      <div className="space-y-8">
        <Card className="border-border/30 bg-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-headline text-3xl font-bold">
                {profile?.displayName || 'User Profile'}
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your name and profile picture.
                    </DialogDescription>
                  </DialogHeader>
                  <UpdateProfileForm user={user} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="mx-auto pt-4 text-center">
              <Avatar className="mx-auto h-24 w-24 border-4 border-primary">
                <AvatarImage src={profile?.photoURL || undefined} alt={profile?.displayName || ''} />
                <AvatarFallback className="text-3xl">
                  {getInitials(profile?.displayName || profile?.email)}
                </AvatarFallback>
              </Avatar>
              {profile?.role === 'doctor' &&
                (isLoading ? (
                  <Skeleton className="mx-auto mt-2 h-6 w-36" />
                ) : (
                  <p className="mt-2 text-lg text-muted-foreground">
                    {profile?.specialization || 'Specialization not set'}
                  </p>
                ))}
            </div>
          </CardHeader>
          <CardContent className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileDetailItem icon={<Mail className="h-5 w-5" />} label="Email" value={profile?.email} loading={isLoading} />
            <ProfileDetailItem
              icon={<User className="h-5 w-5" />}
              label="Full Name"
              value={profile?.displayName || 'Not set'}
              loading={isLoading}
            />
            <ProfileDetailItem
              icon={<Calendar className="h-5 w-5" />}
              label="Member Since"
              value={registrationDate}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        {profile?.role === 'doctor' && (
          <Card className="border-border/30 bg-background">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-2xl">
                Professional Details
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild disabled={isLoading}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">
                      Professional Information
                    </DialogTitle>
                    <DialogDescription>
                      This information will be displayed to patients.
                    </DialogDescription>
                  </DialogHeader>
                  <DoctorProfileForm profile={profile} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileDetailItem
                  loading={isLoading}
                  icon={<Briefcase className="h-5 w-5" />}
                  label="Specialization"
                  value={profile?.specialization}
                />
                <ProfileDetailItem
                  loading={isLoading}
                  icon={<GraduationCap className="h-5 w-5" />}
                  label="Qualifications"
                  value={profile?.qualifications}
                />
                <ProfileDetailItem
                  loading={isLoading}
                  icon={<CalendarClock className="h-5 w-5" />}
                  label="Years of Experience"
                  value={
                    profile?.experience ? `${profile.experience} years` : ''
                  }
                />
                <ProfileDetailItem
                  loading={isLoading}
                  icon={<IndianRupee className="h-5 w-5" />}
                  label="Consultation Fee"
                  value={
                    profile?.consultationFee ? `₹${profile.consultationFee}` : ''
                  }
                />
              </div>
              <ProfileDetailItem
                loading={isLoading}
                icon={<Hospital className="h-5 w-5" />}
                label="Clinic / Hospital"
                value={profile?.clinic}
              />
              <ProfileDetailItem
                loading={isLoading}
                icon={<FileText className="h-5 w-5" />}
                label="Bio"
                value={profile?.bio}
                isBio={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
