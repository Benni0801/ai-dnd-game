import type { Metadata } from 'next';

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
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}