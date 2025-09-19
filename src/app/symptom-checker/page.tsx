import { SymptomCheckerForm } from '@/components/symptom-checker/SymptomCheckerForm';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Bot } from 'lucide-react';

export default function SymptomCheckerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-grow py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 p-4">
              <Bot className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-headline">
              AI Symptom Checker
            </h1>
            <p className="mt-2 text-lg text-foreground/70">
              Describe your symptoms below to get a preliminary analysis.
            </p>
            <p className="mt-2 text-sm text-amber-500">
              Disclaimer: This is not medical advice. Please consult a qualified
              doctor for any health concerns.
            </p>
          </div>
          <SymptomCheckerForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
