import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'

// Custom ThemeProvider implementation
function ThemeProvider({ children }: { children: React.ReactNode }) {
  // This runs only on the client-side
  useEffect(() => {
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    
    if (savedTheme) {
      // Apply saved theme
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      
      // Update theme-color meta tag for notch/status bar
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          savedTheme === 'dark' ? '#171717' : '#FFFFFF'
        )
      }
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', systemPrefersDark)
      localStorage.setItem('theme', systemPrefersDark ? 'dark' : 'light')
      
      // Update theme-color meta tag
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          systemPrefersDark ? '#171717' : '#FFFFFF'
        )
      }
    }
  }, [])
  
  return <>{children}</>
}

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
    <AuthProvider>
      <ThemeProvider>
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
        
        {/* PWA Configuration */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Theme color will be set dynamically via JavaScript */}
        <meta name="theme-color" content="#FFFFFF" id="theme-color-meta" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Dynamic Manifest - will be switched based on theme */}
        <link rel="manifest" href="/api/manifest" id="manifest-link" />
        
        {/* Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/touch-icon-iphone-retina.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/touch-icon-ipad.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/touch-icon-ipad-retina.png" />
        
        {/* Apple Splash Screens */}
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-640-1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/icons/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        
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
      
      <div className="font-hebrew min-h-screen bg-background text-foreground transition-colors duration-300">
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
    </AuthProvider>
  )
} 