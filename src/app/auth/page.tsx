import { AuthForm } from '@/components/auth/AuthForm';
import { Stethoscope } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-grid-small-white/[0.2]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="container relative z-10 w-full max-w-md p-4">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-headline">
              SwasthyaNet
            </span>
          </Link>
          <h1 className="text-2xl font-bold font-headline">Welcome Back</h1>
          <p className="text-foreground/60">
            Sign in or create an account to continue
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
