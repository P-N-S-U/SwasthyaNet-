
'use client';

import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { MapPin, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const PharmacyFinder = dynamic(
  () => import('@/components/patient/PharmacyFinder').then(mod => mod.PharmacyFinder),
  {
    loading: () => (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-[300px] md:h-[500px] w-full" />
        <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function PharmaciesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow bg-secondary/30 py-12">
        <div className="container">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 p-4">
              <MapPin className="h-10 w-10 md:h-12 md:w-12 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline">
              Find a Pharmacy Near You
            </h1>
            <p className="mt-2 text-md md:text-lg text-foreground/70">
              Discover local pharmacies and chemists, check their distance, and get directions.
            </p>
          </div>
          <PharmacyFinder />
        </div>
      </main>
      <Footer />
    </div>
  );
}
