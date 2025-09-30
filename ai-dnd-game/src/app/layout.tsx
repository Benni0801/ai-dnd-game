import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI D&D Adventure',
  description: 'An AI-powered Dungeons & Dragons adventure game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


