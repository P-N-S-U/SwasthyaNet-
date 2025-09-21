import { DoctorRecommendationForm } from '@/components/doctor-recommendation/DoctorRecommendationForm';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Users } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

async function getRealDoctorSuggestions() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'doctor'), limit(4));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [
        'Cardiology',
        'Dermatology',
        'Neurology',
        'Dr. Vikram Singh',
      ];
    }

    const suggestions: string[] = [];
    const specializations = new Set<string>();

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.displayName) {
        suggestions.push(data.displayName);
      }
      if (data.specialization) {
        specializations.add(data.specialization);
      }
    });

    const combinedSuggestions = [...new Set([...Array.from(specializations), ...suggestions])];
    
    return combinedSuggestions.slice(0, 4);

  } catch (error) {
    console.error("Failed to fetch doctor suggestions:", error);
    // Return fallback suggestions on error
    return [
        'Cardiology',
        'Dermatology',
        'Neurology',
        'Dr. Vikram Singh',
      ];
  }
}

export default async function FindDoctorPage() {
  const suggestions = await getRealDoctorSuggestions();

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
