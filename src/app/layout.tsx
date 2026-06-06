import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastContainer } from '@/lib/toast'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hagscancook.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'HagsCanCook',
    template: '%s — HagsCanCook',
  },
  description: 'A community recipe site for home cooks.',
  openGraph: {
    siteName: 'HagsCanCook',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
}

/**
 * Root layout — shared across all routes.
 *
 * Renders as a Server Component. `<Providers>` is the client boundary that
 * wraps the app in Firebase Auth context. `<Header>` and `<Footer>` are
 * Server Components; the auth-aware `<UserMenu>` inside Header is a Client
 * Component island.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      {/* Prevent flash of wrong theme by reading localStorage before first paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastContainer />
        </Providers>
      </body>
    </html>
  )
}
