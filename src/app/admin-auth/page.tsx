
import { AuthForm } from '@/components/auth/AuthForm';
import { Stethoscope, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminAuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-900 bg-grid-small-white/[0.1]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="container relative z-10 w-full max-w-md p-4">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-gray-300">
              <Stethoscope className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold font-headline">
                SwasthyaNet
              </span>
            </Link>
            <h1 className="flex items-center justify-center gap-2 text-2xl font-bold font-headline text-red-400">
              <Shield/> Admin Access
            </h1>
            <p className="text-gray-400">
              Sign in to access the administrator dashboard.
            </p>
          </div>
          <AuthForm isAdminLogin={true} />
      </div>
    </div>
  );
}
