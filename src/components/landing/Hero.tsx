import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import data from '@/lib/placeholder-images.json';

export const Hero = () => {
  const heroImage = data.placeholderImages.find(
    img => img.id === 'hero-dashboard'
  );

  return (
    <section className="relative py-20 md:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-0 top-0 z-0 h-full w-full bg-background"
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-background"></div>
        <div
          className="absolute inset-x-0 top-1/2 z-10 h-64 -translate-y-1/2 opacity-20 [mask-image:radial-gradient(50%_50%_at_50%_50%,#7DF9FF_0%,transparent_100%)]"
          style={{ background: 'radial-gradient(circle, #A020F0, transparent 60%)' }}
        ></div>
      </div>
      <div className="container relative z-10 text-center">
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold tracking-tighter text-transparent font-headline md:text-6xl">
          Your Health, Reimagined.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/70 md:text-xl">
          SwasthyaNet offers seamless, secure, and intelligent healthcare right
          at your fingertips. Connect with top doctors, get instant
          consultations, and manage your health journey with ease.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
          >
            <Link href="/auth">Book an Appointment</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/symptom-checker">Check Symptoms</Link>
          </Button>
        </div>
        <div className="mt-16 md:mt-24">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              width={1200}
              height={600}
              className="mx-auto rounded-lg border-2 border-border/20 shadow-2xl shadow-primary/20"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
        </div>
      </div>
    </section>
  );
};
