import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KMC Stats Calc',
  description: 'KMC Stats Calc for 104th Battalion MilSim',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
