'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Sliders,
  BookOpen,
  Calendar,
  LogOut,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useKitsQuery } from '@/lib/queries';

interface ISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: ISidebarProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: kits = [] } = useKitsQuery();

  const pathKitMatch = pathname.match(/\/kit\/([^/]+)/);
  const pathKitId = pathKitMatch && pathKitMatch[1] !== 'new' ? pathKitMatch[1] : null;

  const [activeKitId, setActiveKitId] = useState<string | null>(pathKitId);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleKitSelected = (e: Event) => {
      const selectedId = (e as CustomEvent).detail;
      if (selectedId) {
        setActiveKitId(selectedId);
        try {
          localStorage.setItem('trao_last_kit_id', selectedId);
        } catch {}
      }
    };
    const handleKitDeleted = (e: Event) => {
      const deletedId = (e as CustomEvent).detail;
      if (activeKitId === deletedId) {
        const remaining = kits.filter((k) => (k.id || (k as any)._id) !== deletedId);
        const nextId = remaining.length > 0 ? (remaining[0].id || (remaining[0] as any)._id) : null;
        setActiveKitId(nextId);
        try {
          if (nextId) localStorage.setItem('trao_last_kit_id', nextId);
          else localStorage.removeItem('trao_last_kit_id');
        } catch {}
      }
    };

    window.addEventListener('trao_kit_selected', handleKitSelected);
    window.addEventListener('trao_kit_deleted', handleKitDeleted);
    return () => {
      window.removeEventListener('trao_kit_selected', handleKitSelected);
      window.removeEventListener('trao_kit_deleted', handleKitDeleted);
    };
  }, [activeKitId, kits]);

  useEffect(() => {
    if (pathKitId) {
      setActiveKitId(pathKitId);
      try {
        localStorage.setItem('trao_last_kit_id', pathKitId);
      } catch {}
    } else if (isMounted) {
      try {
        const storedId = localStorage.getItem('trao_last_kit_id');
        if (storedId) {
          setActiveKitId(storedId);
        } else if (kits.length > 0) {
          const firstId = kits[0].id || (kits[0] as any)._id;
          if (firstId) {
            setActiveKitId(firstId);
            localStorage.setItem('trao_last_kit_id', firstId);
          }
        }
      } catch {}
    }
  }, [pathname, pathKitId, isMounted, kits]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentTargetId = isMounted
    ? activeKitId || (kits.length > 0 ? kits[0].id || (kits[0] as any)._id : null)
    : pathKitId;

  // With no kit yet, still route to the real page: 'new' keeps useKitQuery disabled,
  // so each view renders its own empty state instead of the click doing nothing.
  const targetKitId = currentTargetId || 'new';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { id: 'kit-builder', label: 'Kit builder', href: `/kit/${targetKitId}`, icon: Sliders },
    { id: 'question-bank', label: 'Question bank', href: `/kit/${targetKitId}/question-bank`, icon: HelpCircle },
    { id: 'schedule', label: 'Schedule', href: `/kit/${targetKitId}/schedule`, icon: Calendar },
    { id: 'practice', label: 'Practice', href: `/kit/${targetKitId}/practice`, icon: BookOpen }
  ];

  const isItemActive = (id: string) => {
    if (id === 'dashboard') return pathname === '/dashboard';
    if (id === 'question-bank') return pathname.includes('/question-bank');
    if (id === 'schedule') return pathname.includes('/schedule') || pathname.includes('/day');
    if (id === 'practice') return pathname.includes('/practice');
    return (
      pathname.startsWith('/kit/') &&
      !pathname.includes('/practice') &&
      !pathname.includes('/schedule') &&
      !pathname.includes('/day') &&
      !pathname.includes('/question-bank')
    );
  };

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) onToggle();
  };

  return (
    <aside
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-hairline bg-surface transition-[width,transform] duration-300 ease-out print:hidden ${
        isOpen
          ? 'w-[17rem] translate-x-0 shadow-overlay md:w-60 md:shadow-none'
          : 'w-[17rem] -translate-x-full md:w-14 md:translate-x-0'
      }`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={`flex h-14 items-center border-b border-hairline ${
            isOpen ? 'justify-between px-3' : 'justify-center px-2'
          }`}
        >
          {isOpen ? (
            <>
              <span className="font-display text-sm font-bold tracking-tight text-muted">
                Navigation
              </span>
              <button
                onClick={onToggle}
                aria-label="Collapse navigation"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-brand-50 hover:text-brand-700 active:scale-95"
              >
                <PanelLeftClose className="hidden h-4 w-4 md:block" />
                <X className="h-5 w-5 md:hidden" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              aria-label="Expand navigation"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition hover:bg-brand-100 active:scale-95"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className={`flex flex-col gap-1 py-3 ${isOpen ? 'px-3' : 'px-2'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.id);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeOnMobile}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={
                  isOpen
                    ? `group relative flex h-11 items-center gap-3 rounded-xl px-3 text-base font-medium transition ${
                        active
                          ? 'bg-brand-50 font-semibold text-brand-800'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                      }`
                    : `group relative mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition ${
                        active
                          ? 'bg-brand-50 text-brand-800'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-ink'
                      }`
                }
              >
                {/* The active marker carries the information; there is no decorative bar. */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600" />
                )}
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-brand-700' : ''}`} />
                {isOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {isOpen && (
          <div className="px-3 pb-3">
            <Link
              href="/new"
              onClick={closeOnMobile}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-semibold text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/60 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" />
              New prep kit
            </Link>
          </div>
        )}
      </div>

      <div className={`border-t border-hairline ${isOpen ? 'p-3' : 'p-2'}`}>
        {user ? (
          isOpen ? (
            <div className="flex items-center gap-2 rounded-xl border border-hairline bg-canvas p-2">
              <Link
                href="/profile"
                onClick={closeOnMobile}
                className="group flex min-w-0 flex-1 items-center gap-2.5"
                title="Edit profile"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 ring-1 ring-inset ring-brand-200">
                  {(user.name || user.email).trim().charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink transition group-hover:text-brand-700">
                    {user.name || user.email}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {user.targetRole || 'Edit profile'}
                  </span>
                </span>
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/profile"
                title={user.name || user.email}
                aria-label="Profile"
                className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-200"
              >
                {(user.name || user.email).trim().charAt(0).toUpperCase()}
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )
        ) : (
          <Link
            href="/login"
            onClick={closeOnMobile}
            title="Sign in"
            className={
              isOpen
                ? 'flex h-11 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white transition hover:bg-slate-800'
                : 'mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white transition hover:bg-slate-800'
            }
          >
            <LogIn className="h-4 w-4" />
            {isOpen && 'Sign in'}
          </Link>
        )}
      </div>
    </aside>
  );
}
