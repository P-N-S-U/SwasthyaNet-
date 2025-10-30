
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
              Nearby Pharmacies
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              Find pharmacies near your location.
            </p>
          </div>
          <Card className="flex min-h-[500px] w-full items-center justify-center border-dashed bg-background">
            <div className="text-center">
                <h2 className="text-2xl font-semibold">Map Feature Coming Soon</h2>
                <p className="mt-2 text-muted-foreground">We are working on bringing you an interactive map of nearby pharmacies.</p>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
