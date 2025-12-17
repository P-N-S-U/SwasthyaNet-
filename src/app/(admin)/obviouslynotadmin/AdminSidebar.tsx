'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  LayoutDashboard,
  Stethoscope,
  Building,
  Users,
  Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { signOut } from './actions';
import React from 'react';

const NavLink = ({ href, children, icon: Icon, onClick }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link href={href} passHref>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start !text-gray-100 hover:!bg-red-500/20"
        onClick={onClick}
      >
        <Icon className="mr-2 h-4 w-4" />
        {children}
      </Button>
    </Link>
  );
};

const NavContent = ({ onLinkClick }) => {

  return (
    <>
      <div className="flex h-16 items-center border-b border-red-500/30 px-6">
        <Link href="/obviouslynotadmin" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-red-500" />
          <span className="font-bold text-gray-100">Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        <NavLink href="/obviouslynotadmin" icon={LayoutDashboard} onClick={onLinkClick}>
          Dashboard
        </NavLink>
        <NavLink href="#" icon={Building} onClick={onLinkClick}>
          Partners
        </NavLink>
        <NavLink href="#" icon={Users} onClick={onLinkClick}>
          Users
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-red-500/30 p-4">
        <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full justify-start !text-red-400 hover:!bg-red-500/20 hover:!text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
            </Button>
        </form>
      </div>
    </>
  );
};

export function AdminSidebar() {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-20 bg-gray-800/50 text-gray-100 backdrop-blur-sm"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-64 flex-col bg-gray-900 p-0 text-gray-100">
            <NavContent onLinkClick={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden h-full w-64 flex-col border-r border-red-500/30 bg-gray-900 md:flex">
        <NavContent onLinkClick={() => {}} />
      </aside>
    </>
  );
}
