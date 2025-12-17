import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerFooter } from '@/components/partner/PartnerFooter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building, TestTube, Truck, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const benefits = [
  {
    icon: <CheckCircle className="h-6 w-6 text-accent" />,
    text: 'Expand your reach to a wider patient base.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-accent" />,
    text: 'Receive verified digital prescriptions seamlessly.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-accent" />,
    text: 'Streamline your operations and manage orders digitally.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-accent" />,
    text: 'Become a trusted part of a modern healthcare network.',
  },
];


export default function PartnersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PartnerHeader />
      <main className="flex-grow">
        <section className="relative bg-secondary/30 py-20 md:py-32">
           <div className="absolute inset-0 h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
           <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div
              className="absolute inset-x-0 top-1/2 z-0 h-64 -translate-y-1/2 opacity-25 [mask-image:radial-gradient(50%_50%_at_50%_50%,#007BFF_0%,transparent_100%)]"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 60%)' }}
            ></div>
           <div className="container relative z-10 text-center">
            <h1 className="text-4xl font-bold tracking-tighter text-foreground font-headline md:text-5xl">
              Partner with SwasthyaNet
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/70 md:text-xl">
              Join our growing network of healthcare providers and revolutionize patient care together.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/partners/signup">Register Your Business</Link>
              </Button>
            </div>
          </div>
        </section>
        
        <section className="py-20 md:py-24">
            <div className="container">
                 <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold font-headline md:text-4xl">
                        Who Can Join?
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-lg text-foreground/70">
                        We are building a comprehensive ecosystem of healthcare providers.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <Card className="text-center border-border/30 bg-secondary/50">
                        <CardHeader>
                           <div className="mx-auto mb-4 inline-block rounded-lg bg-primary/10 p-4">
                             <Building className="h-10 w-10 text-primary" />
                           </div>
                           <CardTitle>Pharmacies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground/60">Fulfill digital prescriptions and serve patients in your area.</p>
                        </CardContent>
                    </Card>
                     <Card className="text-center border-border/30 bg-secondary/50">
                        <CardHeader>
                            <div className="mx-auto mb-4 inline-block rounded-lg bg-primary/10 p-4">
                                <TestTube className="h-10 w-10 text-primary" />
                            </div>
                           <CardTitle>Diagnostic Labs</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-foreground/60">Offer lab tests and upload reports directly to patient profiles.</p>
                        </CardContent>
                    </Card>
                     <Card className="text-center border-border/30 bg-secondary/50">
                        <CardHeader>
                            <div className="mx-auto mb-4 inline-block rounded-lg bg-primary/10 p-4">
                               <Truck className="h-10 w-10 text-primary" />
                            </div>
                           <CardTitle>Home Care Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground/60">Provide at-home medical services and equipment rentals.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section className="bg-secondary/30 py-20 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold font-headline md:text-4xl">
                Benefits of Joining
              </h2>
               <p className="mx-auto mt-2 max-w-xl text-lg text-foreground/70">
                   Grow your business and streamline your workflow with our platform.
                </p>
            </div>
            <div className="mx-auto mt-12 max-w-2xl">
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="mt-1">{benefit.icon}</div>
                    <span className="text-lg text-foreground/80">{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

      </main>
      <PartnerFooter />
    </div>
  );
}
