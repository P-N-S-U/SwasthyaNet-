
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
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
           <Skeleton className="h-[500px] w-full" />
        </div>
        <div className="space-y-4 md:col-span-1">
            <Skeleton className="h-20 w-full" />
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
      <main className="flex-grow bg-secondary/30 py-12 md:py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 p-4">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-headline">
              Find a Location Near You
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              Discover local schools and restaurants, check their distance, and get directions.
            </p>
          </div>
          <PharmacyFinder />
        </div>
      </main>
      <Footer />
    </div>
  );
}
