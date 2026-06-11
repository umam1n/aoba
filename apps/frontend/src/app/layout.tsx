import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AOBA | Workforce Intelligence',
  description: 'Predictive attrition intelligence for the modern enterprise.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#0a0e1a] text-gray-100 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
