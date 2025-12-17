
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Testimonials } from '@/components/landing/Testimonials';
import { Footer } from '@/components/landing/Footer';
import { Loader2, Building, TestTube, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ForPartnersSection = () => {
  return (
    <section className="bg-secondary/30 py-20 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold font-headline md:text-4xl">
            For Healthcare Partners
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-lg text-foreground/70">
            Join our network to expand your reach and streamline your services.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card className="text-center border-border/30 bg-background/50">
            <CardHeader>
              <div className="mx-auto mb-4 inline-block rounded-lg bg-primary/10 p-4">
                <Building className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>Pharmacies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/60">
                Fulfill digital prescriptions and serve patients in your area.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center border-border/30 bg-background/50">
            <CardHeader>
              <div className="mx-auto mb-4 inline-block rounded-lg bg-primary/10 p-4">
                <TestTube className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>Diagnostic Labs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/60">
                Offer lab tests and upload reports directly to patient
                profiles.
              </p>
            </CardContent>
          </Card>
          <Card className="text-center border-border/30 bg-background/50">
            <CardHeader>
              <div className="mx-auto mb-4 inline-block rounded-lg bg-primary/10 p-4">
                <Truck className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>Home Care Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/60">
                Provide at-home medical services and equipment rentals.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link href="/partners">Join the Network</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};


export default function Home() {
  const { role, loading } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role === 'doctor') {
      router.replace('/doctor/dashboard');
    }
  }, [role, loading, router]);

  if (loading || role === 'doctor') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <HowItWorks />
        <ForPartnersSection />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
