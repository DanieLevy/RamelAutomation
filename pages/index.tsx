import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Search, Smartphone, Wifi, WifiOff, Share2, Copy, Download, MapPin, ExternalLink } from 'lucide-react';
import PWABanner from '../components/PWABanner';

interface AppointmentResult {
  date: string;
  available: boolean | null;
  message: string;
  times: string[];
}

interface ApiResponse {
  results: AppointmentResult[];
  summary: {
    mode: string;
    found?: boolean;
    date?: string;
    times?: string[];
    totalChecked?: number;
    availableCount?: number;
    hasAvailable?: boolean;
    message?: string;
  };
}

// Israel timezone utility functions
const ISRAEL_TIMEZONE = 'Asia/Jerusalem'

const formatDateIsrael = (date: Date): string => {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date).split('.').reverse().join('-')
}

const formatDisplayDateIsrael = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const formatTimeIsrael = (time: string): string => {
  // Time is already in HH:MM format, just ensure proper display
  return time
}

const getCurrentDateIsrael = (): Date => {
  return new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()) + 'T00:00:00')
}

const getDayNameHebrew = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date)
}

const isClosedDay = (dateStr: string): boolean => {
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date)
  return dayOfWeek === 'Monday' || dayOfWeek === 'Saturday'
}

const generateBookingUrl = (dateStr: string): string => {
  // Convert YYYY-MM-DD to the URL format for the barbershop booking page
  const baseUrl = 'https://mytor.co.il/home.php'
  const params = new URLSearchParams({
    i: 'cmFtZWwzMw==',  // ramel33 encoded
    s: 'MjY1',         // 265
    mm: 'y',
    lang: 'he',
    datef: dateStr,
    signup: 'הצג'      // Hebrew for "Show"
  })
  
  return `${baseUrl}?${params.toString()}`
}

// Utility to detect iOS
function isIOS() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+
}

function isIOSStandalone() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (window.navigator as any).standalone === true;
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  
  // Check for iOS standalone mode
  if (isIOS() && isIOSStandalone()) {
    return true;
  }
  
  // Check for display-mode: standalone (Android, desktop PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for Android app referrer
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  
  return false;
}

export default function Home() {
  const [results, setResults] = useState<AppointmentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [cachedResult, setCachedResult] = useState<any>(null)
  const [loadingCached, setLoadingCached] = useState(true)
  const [days, setDays] = useState(7)
  const [searchMode, setSearchMode] = useState<'range' | 'closest'>('closest')
  const [isOnline, setIsOnline] = useState(true)
  const [canInstall, setCanInstall] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showPWABanner, setShowPWABanner] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if app is already installed (running in standalone mode)
    const checkStandalone = () => {
      const standaloneMode = isInStandaloneMode()
      setIsStandalone(standaloneMode)
      return standaloneMode
    }

    // Check PWA installability
    const checkPWAInstallability = () => {
      // Don't show banner if already installed
      if (checkStandalone()) {
        return
      }

      // Check if banner was recently dismissed
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      if (dismissed) {
        const dismissedTime = parseInt(dismissed)
        const oneDay = 24 * 60 * 60 * 1000 // 24 hours
        if (Date.now() - dismissedTime < oneDay) {
          return
        }
      }

      const isIOSDevice = isIOS()
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
      
      // For iOS devices, always show banner if not dismissed and not standalone
      if (isIOSDevice && isSecure) {
        setTimeout(() => {
          const stillDismissed = localStorage.getItem('pwa-banner-dismissed')
          if (!stillDismissed && !isInStandaloneMode()) {
            setShowPWABanner(true)
            setIsIOSDevice(true)
          }
        }, 2000) // Show after 2 seconds
        return
      }

      // For non-iOS devices, check service worker support
      if (!('serviceWorker' in navigator)) {
        return
      }

      // For development/testing, show banner after a delay if no beforeinstallprompt
      if (process.env.NODE_ENV === 'development' || !isSecure) {
        setTimeout(() => {
          const stillDismissed = localStorage.getItem('pwa-banner-dismissed')
          if (stillDismissed) {
            return
          }
          
          if (!installPrompt && !isInStandaloneMode()) {
            setCanInstall(true)
            setShowPWABanner(true)
          }
        }, 3000) // Show after 3 seconds if no event received
      }
    }

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Only prevent default if we're not in standalone mode and banner wasn't recently dismissed
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      const recentlyDismissed = dismissed && (Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000)
      
      if (!isInStandaloneMode() && !recentlyDismissed) {
        e.preventDefault()
        setInstallPrompt(e)
        setCanInstall(true)
        setShowPWABanner(true)
      }
    }

    const handleAppInstalled = () => {
      setCanInstall(false)
      setInstallPrompt(null)
      setShowPWABanner(false)
      setIsStandalone(true)
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Initial checks
    checkPWAInstallability()

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      const standaloneMode = isInStandaloneMode()
      setIsStandalone(standaloneMode)
      if (standaloneMode) {
        setShowPWABanner(false)
      }
    }
    mediaQuery.addListener(handleDisplayModeChange)

    setIsIOSDevice(isIOS())

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeListener(handleDisplayModeChange)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) {
      // For iOS or when no install prompt is available
      setShowPWABanner(false)
      setCanInstall(false)
      return
    }

    try {
      // Show the install prompt
      const result = await installPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        setCanInstall(false)
        setShowPWABanner(false)
      } else {
        // User dismissed the prompt
        setShowPWABanner(false)
      }
      
      // Clear the stored prompt
      setInstallPrompt(null)
    } catch (error) {
      console.error('Error during PWA installation:', error)
      setShowPWABanner(false)
      setCanInstall(false)
    }
  }

  const handleDismissPWABanner = () => {
    // Immediately hide banner and store dismissal
    setShowPWABanner(false)
    setCanInstall(false) // Also set canInstall to false to prevent re-showing
    
    // Store dismissal in localStorage to prevent showing again for a while
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
  }

  // Check if banner was recently dismissed (run once on mount)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const oneDay = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - dismissedTime < oneDay) {
        setShowPWABanner(false)
        setCanInstall(false)
        return
      } else {
        // Clean up old dismissal
        localStorage.removeItem('pwa-banner-dismissed')
      }
    }
  }, [])

  // Load cached results on mount
  useEffect(() => {
    const loadCachedResults = async () => {
      try {
        setLoadingCached(true)
        let response = await fetch('/.netlify/functions/get-cached-result')
        
        // If Netlify function fails, try Next.js API route as fallback
        if (!response.ok && response.status === 404) {
          console.warn('Netlify function not available, trying Next.js API fallback')
          response = await fetch('/api/get-cached-result')
        }
        
        if (response.ok) {
          const data = await response.json()
          
          // Check if we have cached auto-check results
          if (data.cached && data.summary?.found) {
            setCachedResult(data)
          } else if (data.cached) {
            setCachedResult(null)
          }
        } else {
          console.warn('Cache not available:', response.status)
          setCachedResult(null)
        }
      } catch (error) {
        console.error('Failed to load cached results:', error)
        setCachedResult(null)
      } finally {
        setLoadingCached(false)
      }
    }

    loadCachedResults()

    // Set up interval to refresh cached results every 2 minutes
    const interval = setInterval(loadCachedResults, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkAppointments = async () => {
    setLoading(true)
    setResults([])
    
    try {
      const currentDate = getCurrentDateIsrael()
      const startDate = formatDateIsrael(currentDate)
      
      const response = await fetch('/api/check-appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          days,
          mode: searchMode
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Error checking appointments:', error)
      setResults([{
        date: formatDateIsrael(getCurrentDateIsrael()),
        available: null,
        message: 'שגיאה בבדיקת התורים',
        times: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const availableResults = results.filter(r => r.available === true)
    if (availableResults.length === 0) return
    
    const text = `נמצאו תורים פנויים ברם-אל! 
${availableResults.length} תאריכים זמינים 
התור הקרוב ביותר: ${formatDisplayDateIsrael(availableResults[0].date)} 
בדוק עכשיו: ${window.location.href}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'תור רם-אל', text })
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    }
  }

  return (
    <>
      <Head>
        <title>מספרת רם-אל - מערכת לבדיקת תורים אוטומטית</title>
        <meta name="description" content="מערכת לבדיקת תורים אוטומטית במספרת רם-אל" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Set theme color for iOS notch and browser UI */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#18181b" media="(prefers-color-scheme: dark)" />
      </Head>

      {/* PWA Install Banner */}
      {showPWABanner && !isStandalone && (
        isIOSDevice ? (
          <PWABanner ios onInstall={handleInstall} onDismiss={handleDismissPWABanner} />
        ) : (
          canInstall && <PWABanner onInstall={handleInstall} onDismiss={handleDismissPWABanner} />
        )
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-hebrew">
        {/* Status Bar */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto px-4 py-2 flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs font-light">
                {isOnline ? 'מחובר' : 'לא מחובר'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-light">ישראל</span>
            </div>

            <div className="text-xs font-light text-gray-500">
              {new Intl.DateTimeFormat('he-IL', {
                timeZone: ISRAEL_TIMEZONE,
                hour: '2-digit',
                minute: '2-digit'
              }).format(new Date())}
            </div>
          </div>
        </div>

        <div className={`max-w-md mx-auto p-4 space-y-6 ${showPWABanner ? 'pb-24' : 'pb-4'}`}>
          {/* Header */}
          <div className="text-center space-y-3 pt-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="relative mb-1">
                <img 
                  src="/icons/icon-96x96.png" 
                  alt="מספרת רם-אל" 
                  className="w-14 h-14 rounded-xl shadow-lg ring-2 ring-white/50 dark:ring-gray-700/50"
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                  }}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
              </div>
              <h1 className="text-3xl font-normal text-gray-900 dark:text-white">
                מספרת רם-אל
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-light">
              מערכת לבדיקת תורים אוטומטית
            </p>
          </div>

          {/* Auto-Check Results */}
          {!loadingCached && (
            <>
              {cachedResult && cachedResult.summary?.found ? (
                <div className="font-hebrew relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/50 dark:via-green-950/50 dark:to-teal-950/50 border border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
                  <div className="relative p-6 space-y-5">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        תור זמין נמצא
                      </div>
                      <div className="text-3xl font-light text-emerald-900 dark:text-emerald-100 tracking-wide">
                        {formatDisplayDateIsrael(cachedResult.summary.date)}
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-300 font-medium">
                        {getDayNameHebrew(cachedResult.summary.date)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      {cachedResult.summary.times?.map((time: string, index: number) => (
                        <div key={index} className="px-3 py-1 rounded-lg bg-white/70 dark:bg-black/20 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-200 font-medium text-sm">
                          {formatTimeIsrael(time)}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => window.open(generateBookingUrl(cachedResult.summary.date), '_blank')}
                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        🎯 קבע תור עכשיו
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="h-12 px-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/30 rounded-xl"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80 text-center">
                      עודכן לפני {cachedResult.cacheAge} דקות
                    </div>
                  </div>
                </div>
              ) : (
                <div className="font-hebrew text-center py-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    בדיקה אוטומטית כל 5 דקות
                  </div>
                </div>
              )}
            </>
          )}
          
          {loadingCached && (
            <Card className="font-hebrew border-gray-200 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600 dark:text-gray-400 font-light">
                    טוען תוצאות אוטומטיות...
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Mode Toggle */}
          <Card className="font-hebrew">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-normal flex items-center gap-2">
                <Search className="h-5 w-5" />
                סוג חיפוש
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={searchMode === 'range' ? 'default' : 'outline'}
                  onClick={() => setSearchMode('range')}
                  className="font-light"
                >
                  טווח ימים
                </Button>
                <Button
                  variant={searchMode === 'closest' ? 'default' : 'outline'}
                  onClick={() => setSearchMode('closest')}
                  className="font-light"
                >
                  הקרוב ביותר
                </Button>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 font-light">
                {searchMode === 'range' 
                  ? `בדיקת תורים פנויים ב-${days} הימים הקרובים (ללא ימי שני ושבת)`
                  : 'חיפוש התור הפנוי הקרוב ביותר (עד 30 ימים)'
                }
              </div>
            </CardContent>
          </Card>

          {/* Days Selection (only for range mode) */}
          {searchMode === 'range' && (
            <Card className="font-hebrew">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-normal flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  כמות ימים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value))}>
                  <SelectTrigger className="font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-hebrew">
                    <SelectItem value="3" className="font-light">3 ימים</SelectItem>
                    <SelectItem value="7" className="font-light">7 ימים</SelectItem>
                    <SelectItem value="14" className="font-light">14 ימים</SelectItem>
                    <SelectItem value="21" className="font-light">21 ימים</SelectItem>
                    <SelectItem value="30" className="font-light">30 ימים</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Check Button */}
          <Button 
            onClick={checkAppointments} 
            disabled={loading}
            className="w-full h-12 text-lg font-normal"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="font-light">
                  {searchMode === 'closest' ? 'מחפש תור קרוב...' : 'בודק תורים...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <span className="font-light">
                  {searchMode === 'closest' ? 'חפש תור קרוב' : 'בדוק תורים'}
                </span>
              </div>
            )}
          </Button>

          {/* Offline Alert */}
          {!isOnline && (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 font-hebrew">
              <WifiOff className="h-4 w-4 text-orange-600" />
              <AlertDescription className="font-light">
                אין חיבור לאינטרנט. התוצאות המוצגות עשויות להיות לא עדכניות.
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4 font-hebrew">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-normal">תוצאות</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="font-light"
                >
                  <Share2 className="h-4 w-4 ml-1" />
                  שתף
                </Button>
              </div>

              <div className="space-y-3">
                {results.map((result, index) => {
                  const dayName = getDayNameHebrew(result.date)
                  const isClosed = isClosedDay(result.date)
                  
                  return (
                    <Card key={index} className={`font-hebrew ${
                      result.available === true 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : result.available === false
                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-normal text-lg">
                              {formatDisplayDateIsrael(result.date)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-light">
                              {dayName}
                              {isClosed && (
                                <Badge variant="secondary" className="mr-2 font-light">
                                  סגור
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                result.available === true ? "default" :
                                result.available === false ? "destructive" : "secondary"
                              }
                              className="font-light"
                            >
                              {result.available === true ? 'פנוי' :
                               result.available === false ? 'תפוס' : 'לא ידוע'}
                            </Badge>
                            
                            {result.available === true && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(generateBookingUrl(result.date), '_blank')}
                                className="font-light h-8 px-3"
                              >
                                <ExternalLink className="h-4 w-4 ml-1" />
                                קבע תור
                              </Button>
                            )}
                          </div>
                        </div>

                        {result.times && result.times.length > 0 && (
                          <div className="space-y-2">
                            <Separator />
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-light">
                              <Clock className="h-4 w-4" />
                              זמנים פנויים:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {result.times.map((time, timeIndex) => (
                                <Badge key={timeIndex} variant="outline" className="time-display font-light">
                                  {formatTimeIsrael(time)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.message && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-light">
                            {result.message}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 