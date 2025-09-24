import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Dungeon Master - D&D Adventure Game',
  description: 'An AI-powered text-based Dungeons & Dragons game built with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}



