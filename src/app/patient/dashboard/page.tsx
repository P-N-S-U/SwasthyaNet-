
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Loader2, Bot, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PatientDashboardPage() {
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-secondary/30 py-12 md:py-20">
        <div className="container">
          <div className="mb-10">
            <h1 className="text-4xl font-bold font-headline">
              Welcome back, {user.displayName || 'User'}!
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              Here's your patient health portal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/30 bg-background transition-all hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  My Appointments
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">No Upcoming</div>
                <p className="text-xs text-muted-foreground">
                  You have no upcoming appointments.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/find-a-doctor">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Link href="/symptom-checker">
              <Card className="h-full border-border/30 bg-background transition-all hover:border-accent/50 hover:bg-secondary/50">
                <CardHeader>
                  <div className="mb-4 inline-block rounded-lg bg-primary/10 p-3">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-headline">
                    AI Symptom Checker
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/60">
                    Get a preliminary analysis of your symptoms.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/find-a-doctor">
              <Card className="h-full border-border/30 bg-background transition-all hover:border-accent/50 hover:bg-secondary/50">
                <CardHeader>
                  <div className="mb-4 inline-block rounded-lg bg-primary/10 p-3">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-headline">
                    Find a Doctor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/60">
                    Search for specialists and book a consultation.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
