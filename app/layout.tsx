import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'REAA | Legal & Relational Advisory AI for K-RERA',
  description:
    'Authoritative hybrid vector and relational Text-to-SQL AI advisor for Karnataka Real Estate Regulatory Authority (K-RERA), RERA Act 2016, and Karnataka RERA Rules 2017.',
  keywords: [
    'K-RERA',
    'Karnataka RERA',
    'Real Estate Legal AI',
    'Section 18 Delay in Possession',
    'RERA Act 2016',
    'Form M Complaint',
    'Form N Adjudicating Officer',
    'Karnataka RERA Rules 2017',
    'Bangalore Real Estate Legal Advice',
  ],
  authors: [{ name: 'REAA Advisory System' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased min-h-screen bg-black text-white font-sans flex flex-col selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
