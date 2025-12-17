
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';

export const PartnerHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/partners" className="mr-6 flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold font-headline">SwasthyaNet</span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
                asChild
                variant="ghost"
              >
                <Link href="/partners/signup">Partner Login</Link>
            </Button>
            <Button
                asChild
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Link href="/partners/signup">Register Your Business</Link>
            </Button>
        </div>
      </div>
    </header>
  );
};
