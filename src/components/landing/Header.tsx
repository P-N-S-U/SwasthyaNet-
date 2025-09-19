import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">SwasthyaNet</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/symptom-checker"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Symptom Checker
          </Link>
          <Link
            href="/find-a-doctor"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Find a Doctor
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button asChild variant="ghost">
            <Link href="/auth">Sign In</Link>
          </Button>
          <Button
            asChild
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link href="/auth">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
