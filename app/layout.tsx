import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReAA 2.0 | Karnataka Real Estate Advisory AI',
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
  authors: [{ name: 'ReAA Advisory System' }],
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
      <body className="antialiased min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-zinc-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
