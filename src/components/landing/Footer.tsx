import Link from 'next/link';
import { Github, Linkedin, Twitter, Stethoscope } from 'lucide-react';

const footerLinks = {
  platform: [
    { title: 'Features', href: '#features' },
    { title: 'How It Works', href: '#how-it-works' },
    { title: 'Testimonials', href: '#testimonials' },
  ],
  legal: [
    { title: 'Privacy Policy', href: '#' },
    { title: 'Terms of Service', href: '#' },
  ],
  social: [
    {
      title: 'GitHub',
      href: '#',
      icon: <Github className="h-5 w-5" />,
    },
    {
      title: 'LinkedIn',
      href: '#',
      icon: <Linkedin className="h-5 w-5" />,
    },
    {
      title: 'Twitter',
      href: '#',
      icon: <Twitter className="h-5 w-5" />,
    },
  ],
};

const LinkList = ({ title, links }) => (
  <div>
    <h4 className="mb-4 font-headline font-semibold tracking-wider text-foreground">
      {title}
    </h4>
    <ul className="space-y-3">
      {links.map(link => (
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
);

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-primary" />
              <span className="font-bold font-headline text-lg">
                SwasthyaNet
              </span>
            </Link>
            <p className="max-w-xs text-sm text-foreground/60">
              Your Health, Reimagined. Seamless, secure, and intelligent
              healthcare right at your fingertips.
            </p>
          </div>
          <LinkList title="Platform" links={footerLinks.platform} />
          <LinkList title="Legal" links={footerLinks.legal} />

          <div>
            <h4 className="mb-4 font-headline font-semibold tracking-wider text-foreground">
              Social
            </h4>
            <div className="flex gap-4">
              {footerLinks.social.map(link => (
                <Link
                  key={link.title}
                  href={link.href}
                  aria-label={link.title}
                  className="text-foreground/60 transition-colors hover:text-accent"
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-foreground/60">
          &copy; {new Date().getFullYear()} SwasthyaNet. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
