
'use client';

import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { MapPin } from 'lucide-react';
import { PharmacyFinder } from '@/components/patient/PharmacyFinder';

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
              Find a Pharmacy Near You
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              Discover local pharmacies, check their distance, and get directions.
            </p>
          </div>
          <PharmacyFinder />
        </div>
      </main>
      <Footer />
    </div>
  );
}
