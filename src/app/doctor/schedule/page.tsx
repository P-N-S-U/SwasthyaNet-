
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';

export default function SchedulePage() {
  const { user, loading } = useAuthState();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());

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
            <h1 className="text-4xl font-bold font-headline">My Schedule</h1>
            <p className="mt-2 text-lg text-foreground/70">
              Manage your appointments and availability.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card className="border-border/30 bg-background">
                <CardHeader>
                  <CardTitle>Full Calendar</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border border-border/30"
                  />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="border-border/30 bg-background">
                <CardHeader>
                  <CardTitle>Appointments for Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <span className="text-sm">AUG</span>
                        <span className="text-xl font-bold">10</span>
                      </div>
                      <div>
                        <p className="font-semibold">
                          Consultation with Rohan Kumar
                        </p>
                        <p className="text-sm text-muted-foreground">
                          10:00 AM - 10:30 AM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <span className="text-sm">AUG</span>
                        <span className="text-xl font-bold">10</span>
                      </div>
                      <div>
                        <p className="font-semibold">
                          Follow-up with Priya Sharma
                        </p>
                        <p className="text-sm text-muted-foreground">
                          11:00 AM - 11:15 AM
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
