
import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

export const PartnerFooter = () => {
  return (
    <footer className="bg-secondary/30">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between sm:flex-row">
            <Link href="/" className="mb-4 inline-flex items-center gap-2 sm:mb-0">
              <Stethoscope className="h-8 w-8 text-primary" />
              <span className="font-bold font-headline text-lg">
                SwasthyaNet
              </span>
            </Link>
            <p className="text-sm text-foreground/60">
                &copy; {new Date().getFullYear()} SwasthyaNet. All rights reserved.
            </p>
        </div>
      </div>
    </footer>
  );
};
