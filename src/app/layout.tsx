import type { Metadata, Viewport } from 'next';
import { Courier_Prime } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-courier-prime',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'SUPERNOVA — Curated Affiliate Store',
  description: 'A minimalist, curated storefront featuring handpicked products from top brands. Affiliate powered.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${courierPrime.variable} font-courier antialiased bg-white text-black min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1 pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
