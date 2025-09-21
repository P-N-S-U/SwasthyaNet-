
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
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
import { getUserProfile } from '@/lib/firebase/firestore';
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

const ProfileDetailItem = ({ icon, label, value, isBio = false }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-4">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`font-medium ${isBio ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
      </div>
    </div>
  );
};


export default function ProfilePage() {
  const { user, loading, role } = useAuthState();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
    if (user) {
      getUserProfile(user.uid).then(userProfile => {
        setProfile(userProfile);
        setProfileLoading(false);
      });
    }
  }, [user, loading, router]);

  if (loading || !user || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = email => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const registrationDate = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString()
    : 'Not available';
    
  const isDoctor = role === 'doctor';

  return (
    <div className="flex min-h-screen flex-col">
      {!isDoctor && <Header />}
      <main className={`flex-grow ${!isDoctor ? 'bg-secondary/30 py-12 md:py-20' : ''}`}>
        <div className="container">
           {isDoctor && (
             <div className="mb-10">
                <h1 className="text-4xl font-bold font-headline">Profile</h1>
                <p className="mt-2 text-lg text-foreground/70">
                    Manage your personal and professional information.
                </p>
            </div>
           )}
          <div className="mx-auto max-w-2xl space-y-8">
            <Card className="border-border/30 bg-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                   <CardTitle className="text-3xl font-bold font-headline">
                    {user.displayName || 'User Profile'}
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
                <div className="mx-auto pt-4">
                  <Avatar className="h-24 w-24 border-4 border-primary">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback className="text-3xl">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                 {profile.role === 'doctor' && (
                  <p className="text-center text-lg text-muted-foreground">{profile.specialization || 'Specialization not set'}</p>
                 )}
              </CardHeader>
              <CardContent className="mt-4 space-y-4">
                 <ProfileDetailItem icon={<Mail className="h-5 w-5 text-primary" />} label="Email" value={user.email} />
                 <ProfileDetailItem icon={<User className="h-5 w-5 text-primary" />} label="Full Name" value={user.displayName || 'Not set'} />
                 <ProfileDetailItem icon={<Calendar className="h-5 w-5 text-primary" />} label="Member Since" value={registrationDate} />
              </CardContent>
            </Card>

            {profile.role === 'doctor' && (
              <Card className="border-border/30 bg-background">
                <CardHeader className="flex flex-row items-center justify-between">
                   <CardTitle className="font-headline text-2xl">
                    Professional Details
                  </CardTitle>
                   <Dialog>
                    <DialogTrigger asChild>
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
                   <ProfileDetailItem icon={<Briefcase className="h-5 w-5 text-primary" />} label="Specialization" value={profile.specialization} />
                   <ProfileDetailItem icon={<GraduationCap className="h-5 w-5 text-primary" />} label="Qualifications" value={profile.qualifications} />
                   <ProfileDetailItem icon={<CalendarClock className="h-5 w-5 text-primary" />} label="Years of Experience" value={profile.experience} />
                   <ProfileDetailItem icon={<IndianRupee className="h-5 w-5 text-primary" />} label="Consultation Fee" value={profile.consultationFee ? `₹${profile.consultationFee}` : ''} />
                   <ProfileDetailItem icon={<Hospital className="h-5 w-5 text-primary" />} label="Clinic / Hospital" value={profile.clinic} />
                   <ProfileDetailItem icon={<FileText className="h-5 w-5 text-primary" />} label="Bio" value={profile.bio} isBio={true} />
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </main>
      {!isDoctor && <Footer />}
    </div>
  );
}
