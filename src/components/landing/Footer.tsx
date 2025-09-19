import Link from 'next/link';
import { Github, Linkedin, Twitter, Stethoscope } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">SwasthyaNet</span>
          </div>
          <p className="text-sm text-foreground/60">
            &copy; {new Date().getFullYear()} SwasthyaNet. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" aria-label="GitHub">
              <Github className="h-5 w-5 text-foreground/60 hover:text-foreground" />
            </Link>
            <Link href="#" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 text-foreground/60 hover:text-foreground" />
            </Link>
            <Link href="#" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-foreground/60 hover:text-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
