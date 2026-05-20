'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  UsersIcon,
  SettingsIcon,
  LogOut as LogOutIcon,
} from 'lucide-react';

const routes = [
  { href: '/dashboard/member', label: 'Member Dashboard', icon: HomeIcon, roles: ['MEMBER', 'OPERATIONS', 'ADMIN'] },
  { href: '/dashboard/operations', label: 'Operations Console', icon: UsersIcon, roles: ['OPERATIONS', 'ADMIN'] },
  { href: '/dashboard/admin', label: 'Admin Console', icon: SettingsIcon, roles: ['ADMIN'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'MEMBER';

  // Filter routes based on active role hierarchy
  const visibleRoutes = routes.filter((route) => route.roles.includes(userRole));

  return (
    <nav className="flex flex-col space-y-1">
      {visibleRoutes.map((route) => {
        const isActive = pathname.startsWith(route.href);
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
              isActive
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            )}
          >
            <route.icon className={cn('h-4 w-4 mr-3', isActive ? 'text-white' : 'text-slate-500')} />
            {route.label}
          </Link>
        );
      })}
      
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer mt-4 border border-dashed border-slate-800/40 hover:border-rose-950/40"
      >
        <LogOutIcon className="h-4 w-4 mr-3 text-slate-500 group-hover:text-rose-400" />
        Sign Out
      </button>
    </nav>
  );
}
