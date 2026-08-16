import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import {
  Geist,
  Geist_Mono,
  Orbitron,
  Press_Start_2P,
  Silkscreen,
  VT323,
} from 'next/font/google'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const pressStart = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-pixel' })
const silkscreen = Silkscreen({ subsets: ['latin'], weight: '400', variable: '--font-silkscreen' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })
const vt323 = VT323({ subsets: ['latin'], weight: '400', variable: '--font-vt323' })

export const metadata: Metadata = {
  title: 'Grobo — Mobile Robot Assistant',
  description: 'A cute robot companion with animated eyes, Pomodoro, timer, and clock modes.',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#000000',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} ${silkscreen.variable} ${orbitron.variable} ${vt323.variable} dark bg-background`}
    >
      <body className="antialiased font-sans">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
