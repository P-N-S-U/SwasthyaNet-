
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import {
  Loader2,
  User,
  Mail,
  Calendar,
  Edit,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const ProfileDetailItem = ({ icon, label, value, loading = false }) => {
  if (!value && !loading) return null;

  return (
    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-4">
      <div className="mt-1 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="h-6 w-40 mt-1" /> : <p className="font-medium">{value}</p>}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, loading: authLoading, role } = useAuthState();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
        if (!user) {
            router.push('/auth');
        } else if (role === 'doctor') {
            router.replace('/doctor/profile');
        }
    }
  }, [user, authLoading, role, router]);

  const isLoading = authLoading || profileLoading;

  if (isLoading || !user || role === 'doctor') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (nameOrEmail: string | null | undefined) => {
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-secondary/30 py-12 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl space-y-8">
            <Card className="border-border/30 bg-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                   <CardTitle className="text-3xl font-bold font-headline">
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
                        <DialogTitle className="font-headline">
                          Edit Profile
                        </DialogTitle>
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
                </div>
              </CardHeader>
              <CardContent className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <ProfileDetailItem icon={<Mail className="h-5 w-5" />} label="Email" value={profile?.email} loading={isLoading} />
                 <ProfileDetailItem icon={<User className="h-5 w-5" />} label="Full Name" value={profile?.displayName || 'Not set'} loading={isLoading} />
                 <ProfileDetailItem icon={<Calendar className="h-5 w-5" />} label="Member Since" value={registrationDate} loading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
