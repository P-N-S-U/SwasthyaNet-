
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  UserCircle,
  LayoutDashboard,
  Calendar,
  Stethoscope,
  Users,
  Menu,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/firebase/auth';
import type { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import React from 'react';


const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const NavLink = ({ href, children, icon: Icon, onClick }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} passHref>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start"
        onClick={onClick}
      >
        <Icon className="mr-2 h-4 w-4" />
        {children}
      </Button>
    </Link>
  );
};

const NavContent = ({ user, onLinkClick }) => {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <>
        <div className="flex h-16 items-center border-b border-border/60 px-6">
            <Link href="/doctor/dashboard" className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="font-bold">SwasthyaNet</span>
            </Link>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            <NavLink href="/doctor/dashboard" icon={LayoutDashboard} onClick={onLinkClick}>
            Dashboard
            </NavLink>
            <NavLink href="/doctor/schedule" icon={Calendar} onClick={onLinkClick}>
            My Schedule
            </NavLink>
            <NavLink href="/doctor/patients" icon={Users} onClick={onLinkClick}>
            Patients
            </NavLink>
        </nav>

        <div className="mt-auto border-t border-border/60 p-4">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-left">
                <div className="flex w-full items-center gap-2">
                    <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                    <p className="truncate text-sm font-medium">
                        {user.displayName || 'Doctor'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </p>
                    </div>
                </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <Link href="/doctor/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
        </>
    );
};


export function DoctorSidebar({ user }: { user: User }) {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
             <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-20 bg-background/50 backdrop-blur-sm">
                <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 w-64">
            <NavContent user={user} onLinkClick={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden h-full w-64 flex-col border-r border-border/60 bg-background md:flex">
         <NavContent user={user} onLinkClick={() => {}} />
      </aside>
    </>
  );
}
