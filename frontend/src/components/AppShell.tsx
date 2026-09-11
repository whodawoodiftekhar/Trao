'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DbStatusBanner } from './DbStatusBanner';
import { useAuth } from '@/lib/auth-context';

const DESKTOP = 768;

export function AppShell({ children }: { children: React.ReactNode }) {
  // Collapsed by default until we know the viewport, so phones never flash an open drawer.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname() || '';
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const sync = () => setIsSidebarOpen(window.innerWidth >= DESKTOP);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  // Navigating on a phone should close the drawer behind you.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < DESKTOP) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  // Escape closes the drawer, and the page beneath must not scroll while it is open.
  useEffect(() => {
    const isMobileDrawer = typeof window !== 'undefined' && window.innerWidth < DESKTOP && isSidebarOpen;
    if (!isMobileDrawer) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [isSidebarOpen]);

  const isAuthPage =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password');

  if (isAuthPage || !user || isLoading) {
    return (
      <main className="min-h-screen w-full flex flex-col">
        <DbStatusBanner />
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-ink/45 backdrop-blur-[2px] md:hidden"
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div
        className={`flex flex-1 flex-col min-w-0 transition-[margin] duration-300 ease-out ml-0 ${
          isSidebarOpen ? 'md:ml-60' : 'md:ml-14'
        }`}
      >
        <DbStatusBanner />
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 w-full">
          {/* Capped column so content stays readable on very wide screens. */}
          <div className="mx-auto w-full max-w-shell px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
