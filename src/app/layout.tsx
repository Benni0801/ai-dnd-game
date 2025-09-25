import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI D&D Game',
  description: 'AI-powered Dungeons & Dragons game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}