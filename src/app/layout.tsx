import type { Metadata } from 'next'
import { Crimson_Text, Nunito, Great_Vibes } from 'next/font/google'
import './globals.css'

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  variable: '--font-crimson-text',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '600', '700'],
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  variable: '--font-great-vibes',
  display: 'swap',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'one year of us',
  description: 'for lorie ♡',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${crimsonText.variable} ${nunito.variable} ${greatVibes.variable} h-full`}>
      <body className="min-h-full bg-locked antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
