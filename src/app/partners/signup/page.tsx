import { PartnerAuthForm } from '@/components/auth/PartnerAuthForm';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { PartnerFooter } from '@/components/partner/PartnerFooter';

export default function PartnerAuthPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PartnerHeader />
      <main className="relative flex flex-grow items-center justify-center bg-grid-small-white/[0.2] py-10">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <div className="container relative z-10 w-full max-w-md p-4">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold font-headline">Partner Registration</h1>
            <p className="text-foreground/60">
              Create an account to join our network
            </p>
          </div>
          <PartnerAuthForm />
        </div>
      </main>
      <PartnerFooter />
    </div>
  );
}
