'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isKinship = pathname?.startsWith('/kinship');

  if (isKinship) {
    return (
      <main className="flex-1 w-full min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
}
