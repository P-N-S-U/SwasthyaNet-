
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Stethoscope, LogOut, UserCircle, LayoutDashboard, Menu } from 'lucide-react';
import { useAuthState } from '@/hooks/use-auth-state';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const UserMenu = ({ user }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL} alt={user.email} />
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Header = () => {
  const { user, role, loading } = useAuthState();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold font-headline">SwasthyaNet</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {(!user || role === 'patient') && (
             <>
              <Link
                href="/symptom-checker"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                Symptom Checker
              </Link>
              <Link
                href="/find-a-doctor"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                Find a Doctor
              </Link>
            </>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Mobile Menu */}
          <div className="md:hidden">
             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon">
                   <Menu className="h-5 w-5" />
                   <span className="sr-only">Open menu</span>
                 </Button>
               </SheetTrigger>
               <SheetContent side="right">
                 <div className="flex flex-col gap-4 py-6">
                 {(!user || role === 'patient') && (
                  <>
                    <SheetClose asChild>
                      <Link href="/symptom-checker" className="text-lg">Symptom Checker</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/find-a-doctor" className="text-lg">Find a Doctor</Link>
                    </SheetClose>
                  </>
                  )}
                 </div>
               </SheetContent>
             </Sheet>
          </div>

          {loading ? (
             <Skeleton className="h-8 w-8 rounded-full" />
          ) : user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
