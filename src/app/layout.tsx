import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import AppShell from '@/components/AppShell';
import CJLinkRepair from '@/components/CJLinkRepair';
import './globals.css';

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'SUPERNOVA — Curated Affiliate Store',
  description: 'A minimalist, curated storefront featuring handpicked products from top brands. Affiliate powered.',
  other: {
    'impact-site-verification': '2ea13a73-5da2-4fdd-b008-3bd019660d81',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Código de verificación de Impact para Interporelle */}
        <meta name="impact-site-verification" content="59291e96-5739-478a-8e60-a695a2071270" />
        <meta name="impact-site-verification" content="2ea13a73-5da2-4fdd-b008-3bd019660d81" />
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KGXQPFT6');`,
          }}
        />
        {/* Script Universal de Rastreo de Impact (UTT) */}
        <Script
          id="impact-utt"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A7661331-5a1a-4db3-a9bf-b5f64a0559881.js','script','impactStat',document,window);
impactStat('transformLinks');
impactStat('trackImpression');`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-body antialiased bg-[#F9F9F8] text-[#2D3142] min-h-screen flex flex-col`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KGXQPFT6"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* Código de verificación de Impact */}
        <div style={{ display: 'none' }} aria-hidden="true">
          Impact-Site-Verification: 2ea13a73-5da2-4fdd-b008-3bd019660d81
        </div>
        {/* Código de verificación de Impact para Interporelle */}
        <div style={{ display: 'none' }} aria-hidden="true">
          Impact-Site-Verification: 59291e96-5739-478a-8e60-a695a2071270
        </div>
        <CJLinkRepair />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
