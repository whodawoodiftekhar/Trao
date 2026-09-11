'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface IHeaderProps {
  onToggleSidebar?: () => void;
}

/** Page identity, derived from the route. Titles are what a user would call the screen. */
function pageName(pathname: string): string {
  if (pathname === '/dashboard') return 'Your prep kits';
  if (pathname === '/profile') return 'Profile';
  if (pathname === '/new') return 'New prep kit';
  if (pathname.includes('/day')) return "Today's questions";
  if (pathname.includes('/schedule')) return 'Study schedule';
  if (pathname.includes('/practice')) return 'Practice';
  if (pathname.includes('/question-bank')) return 'Question bank';
  if (pathname.startsWith('/kit/')) return 'Kit builder';
  return 'Trao';
}

export function Header({ onToggleSidebar }: IHeaderProps) {
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const title = pageName(pathname);

  return (
    <header className="sticky top-0 z-20 h-14 bg-surface/85 backdrop-blur-md border-b border-hairline print:hidden">
      {/* Three equal tracks keep the mark optically centred whatever sits either side. */}
      <div className="h-full grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 sm:px-4">

        <div className="flex items-center gap-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:text-brand-700 hover:bg-brand-50 active:scale-95 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="hidden md:block truncate text-sm font-semibold text-muted pl-1.5">
            {title}
          </span>
        </div>

        <Link
          href="/dashboard"
          aria-label="Trao home"
          className="group flex items-center gap-2 justify-self-center rounded-xl px-2 py-1 transition hover:bg-brand-50/70"
        >
          <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow transition-transform duration-300 group-hover:-rotate-6">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">
            Trao
          </span>
        </Link>

        <div className="flex items-center justify-end gap-1.5 min-w-0">
          <Link
            href="/profile"
            aria-label={user?.name ? `Profile — ${user.name}` : 'Profile'}
            title={user?.name || 'Profile'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-200"
          >
            {user?.name ? user.name.trim().charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </Link>
        </div>
      </div>

      {/* On phones the page name moves below the bar so the mark keeps the centre. */}
      <div className="md:hidden border-t border-hairline/70 bg-surface/60 px-4 py-1.5">
        <p className="truncate text-xs font-semibold text-muted">{title}</p>
      </div>
    </header>
  );
}
