import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'K-RERA Advisory AI | Karnataka Real Estate Legal Assistant',
  description:
    'Authoritative AI legal advisor for Karnataka Real Estate Regulatory Authority (K-RERA), RERA Act 2016, and Karnataka RERA Rules 2017 with multi-namespace Pinecone vector grounding.',
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
  authors: [{ name: 'K-RERA Advisory System' }],
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
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
