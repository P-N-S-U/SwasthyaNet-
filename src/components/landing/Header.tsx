
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
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Stethoscope,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Menu,
  Calendar,
  Pill,
  Bot,
  Users,
} from 'lucide-react';
import { useAuthState } from '@/hooks/use-auth-state';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '../ui/separator';

const UserMenu = ({ user }) => {
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return 'U';
    const isEmail = nameOrEmail.includes('@');
    if (isEmail) {
        return nameOrEmail.substring(0, 2).toUpperCase();
    }
    const names = nameOrEmail.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL} alt={user.displayName || user.email} />
            <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
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
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  const MobileNavLink = ({ href, icon: Icon, children }) => (
    <SheetClose asChild>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg p-3 text-lg transition-colors hover:bg-secondary"
      >
        <Icon className="h-5 w-5 text-primary" />
        {children}
      </Link>
    </SheetClose>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold font-headline">SwasthyaNet</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {(!user || (role && role !== 'doctor' && role !== 'partner')) && (
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
              <Link
                href="/patient/pharmacies"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                Pharmacies
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
              <SheetContent side="right" className="flex flex-col">
                <SheetHeader className="text-left">
                  <SheetClose asChild>
                    <Link href="/" className="flex items-center gap-2">
                      <Stethoscope className="h-6 w-6 text-primary" />
                      <span className="text-lg font-bold font-headline">
                        SwasthyaNet
                      </span>
                    </Link>
                  </SheetClose>
                </SheetHeader>
                <div className="flex-grow py-6">
                  <nav className="flex flex-col gap-2">
                    {user && (role && role !== 'doctor' && role !== 'partner') ? (
                      <>
                        <MobileNavLink href="/patient/dashboard" icon={LayoutDashboard}>
                          Dashboard
                        </MobileNavLink>
                        <MobileNavLink href="/patient/appointments" icon={Calendar}>
                          My Appointments
                        </MobileNavLink>
                        <MobileNavLink href="/patient/pharmacies" icon={Pill}>
                          Nearby Pharmacies
                        </MobileNavLink>
                        <MobileNavLink href="/symptom-checker" icon={Bot}>
                          Symptom Checker
                        </MobileNavLink>
                        <MobileNavLink href="/find-a-doctor" icon={Users}>
                          Find a Doctor
                        </MobileNavLink>
                        <MobileNavLink href="/profile" icon={UserCircle}>
                          My Profile
                        </MobileNavLink>
                      </>
                    ) : (
                      <>
                        <MobileNavLink href="/symptom-checker" icon={Bot}>
                          Symptom Checker
                        </MobileNavLink>
                        <MobileNavLink href="/find-a-doctor" icon={Users}>
                          Find a Doctor
                        </MobileNavLink>
                         <MobileNavLink href="/patient/pharmacies" icon={Pill}>
                          Nearby Pharmacies
                        </MobileNavLink>
                      </>
                    )}
                  </nav>
                </div>
                {user ? (
                    <>
                    <Separator className="my-4"/>
                    <SheetClose asChild>
                         <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-lg p-3 gap-3 flex">
                            <LogOut className="h-5 w-5 text-destructive" />
                            Sign Out
                         </Button>
                    </SheetClose>
                    </>
                ) : (
                    <>
                     <Separator className="my-4"/>
                      <SheetClose asChild>
                         <Button asChild className="w-full">
                           <Link href="/auth">Sign In / Sign Up</Link>
                         </Button>
                     </SheetClose>
                    </>
                )}
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
