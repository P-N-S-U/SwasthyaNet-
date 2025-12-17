'use client';

import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { MapPin, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PharmacyFinder } from '@/components/patient/PharmacyFinder';

export default function PharmaciesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-secondary/30 py-12">
        <div className="container">
          <Button asChild variant="outline" size="sm" className="mb-6">
            <Link href="/patient/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="mb-10 text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 p-4">
              <MapPin className="h-10 w-10 text-primary md:h-12 md:w-12" />
            </div>
            <h1 className="text-3xl font-bold font-headline md:text-4xl">
              Find a Pharmacy Near You
            </h1>
            <p className="mt-2 text-md text-foreground/70 md:text-lg">
              Discover local pharmacies and chemists, check their distance, and
              get directions.
            </p>
          </div>
          <PharmacyFinder />
        </div>
      </main>
      <Footer />
    </div>
  );
}
