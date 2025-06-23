import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Set Israel timezone for the application
    if (typeof window !== 'undefined') {
      // Store Israel timezone in localStorage for consistent usage
      localStorage.setItem('appTimezone', 'Asia/Jerusalem')
      
      // Set document language and direction
      document.documentElement.lang = 'he'
      document.documentElement.dir = 'rtl'
      
      // Ensure proper Hebrew locale
      if (navigator.language !== 'he-IL') {
        console.log('Setting Hebrew locale for better date/time formatting')
      }
    }
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <>
      <Head>
        {/* Preload Hebrew fonts for better performance */}
        <link
          rel="preload"
          href="/fonts/ploni-regular-aaa.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ploni-light-aaa.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ploni-ultralight-aaa.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        
        {/* Hebrew language and RTL support */}
        <meta name="language" content="Hebrew" />
        <meta httpEquiv="Content-Language" content="he-IL" />
        <meta name="locale" content="he_IL" />
        
        {/* Enhanced PWA meta tags with Hebrew support */}
        <meta name="application-name" content="תור רם-אל" />
        <meta name="apple-mobile-web-app-title" content="תור רם-אל" />
        <meta name="description" content="בדיקת תורים פנויים במספרת רם-אל" />
        
        {/* Timezone hint for better date/time handling */}
        <meta name="timezone" content="Asia/Jerusalem" />
        
        {/* Font display optimization */}
        <style jsx>{`
          @font-face {
            font-family: 'Ploni';
            font-display: swap;
          }
        `}</style>
      </Head>
      
      <div className="font-hebrew min-h-screen bg-background text-foreground">
        <Component {...pageProps} />
      </div>
    </>
  )
} 