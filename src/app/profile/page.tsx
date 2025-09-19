
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Loader2, User, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user, loading } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const registrationDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString()
    : 'Not available';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-secondary/30 py-12 md:py-20">
        <div className="container">
          <Card className="mx-auto max-w-2xl border-border/30 bg-background">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback className="text-3xl">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-3xl font-bold font-headline">
                {user.displayName || 'User Profile'}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-4 space-y-6">
              <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-4">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-4">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{user.displayName || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-4">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{registrationDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
