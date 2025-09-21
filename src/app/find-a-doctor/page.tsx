import { DoctorRecommendationForm } from '@/components/doctor-recommendation/DoctorRecommendationForm';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Users } from 'lucide-react';
import { getDoctorSearchSuggestions } from '@/ai/flows/doctor-suggestion-flow';

export default async function FindDoctorPage() {
  const suggestionData = await getDoctorSearchSuggestions();
  const suggestions = suggestionData?.suggestions || [
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Dr. Vikram Singh',
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-grow py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 p-4">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-headline">
              Find Your Specialist
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              Let our AI recommend the best doctors for your needs based on
              their specialization.
            </p>
          </div>
          <DoctorRecommendationForm suggestions={suggestions} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
