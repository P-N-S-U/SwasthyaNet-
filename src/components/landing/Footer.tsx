import Link from 'next/link';
import { Stethoscope, Github, Linkedin, Twitter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const Footer = () => {
  const footerLinks = {
    platform: [
      { title: 'Features', href: '#features' },
      { title: 'Find a Doctor', href: '/find-a-doctor' },
      { title: 'Symptom Checker', href: '/symptom-checker' },
    ],
    legal: [
      { title: 'Privacy Policy', href: '#' },
      { title: 'Terms of Service', href: '#' },
    ],
  };

  return (
    <footer className="bg-secondary/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Logo and Description */}
          <div className="col-span-12 md:col-span-4">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-primary" />
              <span className="font-bold font-headline text-lg">
                SwasthyaNet
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-foreground/60">
              Your Health, Reimagined. Seamless, secure, and intelligent
              healthcare right at your fingertips.
            </p>
          </div>

          {/* Links */}
          <div className="col-span-6 md:col-span-2">
            <h4 className="mb-4 font-headline font-semibold text-foreground">
              Platform
            </h4>
            <ul className="space-y-2">
              {footerLinks.platform.map(link => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-foreground/60 transition-colors hover:text-accent"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-6 md:col-span-2">
            <h4 className="mb-4 font-headline font-semibold text-foreground">
              Legal
            </h4>
            <ul className="space-y-2">
              {footerLinks.legal.map(link => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-foreground/60 transition-colors hover:text-accent"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-12 md:col-span-4">
            <h4 className="mb-4 font-headline font-semibold text-foreground">
              Subscribe to our newsletter
            </h4>
            <p className="mb-4 text-sm text-foreground/60">
              Get the latest health tips and platform updates delivered to your
              inbox.
            </p>
            <form className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="email"
                placeholder="Email"
                className="bg-background"
              />
              <Button
                type="submit"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col-reverse items-center justify-between border-t border-border/40 pt-8 md:flex-row">
          <p className="mt-4 text-sm text-foreground/60 md:mt-0">
            &copy; {new Date().getFullYear()} SwasthyaNet. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <Link
              href="#"
              className="text-foreground/60 transition-colors hover:text-accent"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-foreground/60 transition-colors hover:text-accent"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="text-foreground/60 transition-colors hover:text-accent"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
