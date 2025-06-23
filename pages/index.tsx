import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Clock, Search, Smartphone, Wifi, WifiOff, Share2, Copy, Download, MapPin, ExternalLink } from 'lucide-react';
import PWABanner from '../components/PWABanner';
import { DatePicker, DateRangePicker } from '@/components/ui/date-picker';
import { createClient } from '@supabase/supabase-js';
import { format, parseISO, addDays } from 'date-fns';

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

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

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
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null)
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifyType, setNotifyType] = useState<'single' | 'range'>('single')
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyDate, setNotifyDate] = useState<Date | undefined>(undefined)
  const [notifyDateRange, setNotifyDateRange] = useState<{from?: Date, to?: Date}>({from: undefined, to: undefined})

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

  // Load cached results on mount and handle automatic email processing
  useEffect(() => {
    const loadCachedResults = async () => {
      try {
        setLoadingCached(true);
        console.log('Loading cached results from Supabase...');
        
        // Try new optimized cache first, fallback to old format
        const { data: newData, error: newError } = await supabase
          .from('cache')
          .select('value, updated_at')
          .eq('key', 'auto-check-minimal')
          .single();
        
        let cacheData = null;
        
        if (!newError && newData?.value) {
          console.log('🚀 New optimized cache found:', newData);
          cacheData = newData;
          
          // AUTOMATIC EMAIL PROCESSING: Check if emails need to be sent
          const cacheValue = newData.value;
          if (cacheValue?.found && cacheValue?.preview?.length > 0) {
            console.log('📧 Auto-triggering email processing for new appointments');
            
            // Trigger email processing in background (non-blocking)
            fetch('/api/process-notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                appointments: cacheValue.preview // Send the appointment data
              }),
            })
            .then(response => response.json())
            .then(result => {
              if (result.success) {
                console.log(`📧 ✅ Email processing completed: ${result.emailsSent} sent, ${result.emailsSkipped} skipped`);
              } else {
                console.error('📧 ❌ Email processing failed:', result.error);
              }
            })
            .catch(error => {
              console.error('📧 ❌ Failed to trigger email processing:', error);
            });
          }
        } else {
          // Fallback to old cache format
          const { data: oldData, error: oldError } = await supabase
            .from('cache')
            .select('value, updated_at')
            .eq('key', 'auto-check')
            .single();
            
          if (!oldError && oldData?.value) {
            console.log('📄 Fallback to old cache format:', oldData);
            cacheData = oldData;
          }
        }
          
        if (!cacheData) {
          console.log('No cached data found');
          setCachedResult(null);
        } else {
          console.log('Cached data found:', cacheData);
          
          // Process the data for display
          const now = Date.now();
          const timestamp = cacheData.value.timestamp;
          let updatedTimeAgo = 'זה עתה';
          
          if (timestamp) {
            const minutesAgo = Math.floor((now - timestamp) / 60000);
            if (minutesAgo < 1) {
              updatedTimeAgo = 'פחות מדקה';
            } else if (minutesAgo < 60) {
              updatedTimeAgo = `${minutesAgo} דקות`;
            } else {
              const hoursAgo = Math.floor(minutesAgo / 60);
              updatedTimeAgo = `${hoursAgo} שעות`;
            }
          }
          
          // Handle different cache formats
          let results = [];
          let summary = {};
          
          if (cacheData.value.preview) {
            // New optimized format
            results = cacheData.value.preview || [];
            summary = {
              ...cacheData.value.summary,
              hasAvailable: cacheData.value.found,
              found: cacheData.value.found
            };
          } else if (cacheData.value.result) {
            // Old format
            results = cacheData.value.result?.results || [];
            summary = {
              ...cacheData.value.result?.summary,
              hasAvailable: results.some((r: any) => r.available === true)
            };
          }
          
          // Create a properly formatted cached result object
          const processedResult = {
            ...cacheData.value,
            updatedTimeAgo,
            results: results,
            summary: summary
          };
          
          console.log('Processed cached result:', processedResult);
          setCachedResult(processedResult);
        }
      } catch (error) {
        console.error('Failed to load cached results from Supabase:', error);
        setCachedResult(null);
      } finally {
        setLoadingCached(false);
      }
    };
    
    loadCachedResults();
    // Refresh cached results every 90 seconds (optimized for new faster auto-check)
    const interval = setInterval(loadCachedResults, 90 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAppointments = async () => {
    setLoading(true)
    setResults([])
    
    try {
      const currentDate = getCurrentDateIsrael()
      const startDate = formatDateIsrael(currentDate)
      
      console.log(`Manual search: Starting with mode=${searchMode}, days=${days}, startDate=${startDate}`)
      
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
      console.log('Manual search: Received results:', data)
      
      // Make sure we get full results for display
      if (data.results && Array.isArray(data.results)) {
        setResults(data.results)
      } else if (data.result && data.result.results && Array.isArray(data.result.results)) {
        // Handle alternative response format
        setResults(data.result.results)
      } else {
        console.error('Manual search: Unexpected result format', data)
        throw new Error('Unexpected response format')
      }
      
      // If we received results but array is empty in 'closest' mode, display a message
      if (searchMode === 'closest' && data.results && data.results.length === 0) {
        setResults([{
          date: startDate,
          available: false,
          message: 'לא נמצאו תורים פנויים',
          times: []
        }])
      }
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

  // When rendering, always use cachedResult.result.summary (robust to structure)
  const cachedSummary = cachedResult?.result?.summary;
  const cachedFound = cachedSummary?.found;
  const cachedDate = cachedSummary?.date;
  const cachedTimes = cachedSummary?.times;
  const lastCheckTimestamp = cachedResult?.timestamp;

  // Calculate how many minutes ago the last check was
  let lastCheckMinutesAgo: number | null = null;
  let lastCheckDisplay: string | null = null;
  if (lastCheckTimestamp) {
    const now = Date.now();
    lastCheckMinutesAgo = Math.floor((now - lastCheckTimestamp) / 60000);
    // Format the exact time in Israel timezone
    const lastCheckDate = new Date(lastCheckTimestamp);
    lastCheckDisplay = new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(lastCheckDate);
  }

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotifyLoading(true)
    setNotifyStatus(null)
    
    try {
      // Basic validations
      if (!notifyEmail.trim()) {
        throw new Error('יש להזין כתובת מייל')
      }
      
      if (notifyType === 'single' && !notifyDate) {
        throw new Error('יש לבחור תאריך')
      }
      
      if (notifyType === 'range' && !notifyDateRange.from) {
        throw new Error('יש לבחור לפחות תאריך התחלה')
      }
      
      // Format request based on notification type
      let requestPayload: any = {
        email: notifyEmail,
        smartSelection: true // Enable smart date selection by default
      }
      
      if (notifyType === 'single') {
        requestPayload.date = format(notifyDate!, 'yyyy-MM-dd')
      } else {
        requestPayload.start = format(notifyDateRange.from!, 'yyyy-MM-dd')
        requestPayload.end = notifyDateRange.to 
          ? format(notifyDateRange.to, 'yyyy-MM-dd') 
          : format(notifyDateRange.from!, 'yyyy-MM-dd')
      }
      
      // Send API request
      const response = await fetch('/api/notify-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Success notification with custom message from server
        setNotifyStatus(`✓ ${data.message || 'נרשמת בהצלחה! תקבל מייל כאשר יתפנה תור'}`)
        
        // Clear form fields on success
        setNotifyEmail('')
        setNotifyDate(undefined)
        setNotifyDateRange({from: undefined, to: undefined})
      } else {
        // Show error message from server or fallback
        setNotifyStatus(`❌ ${data.error || 'שגיאה ברישום להתראות'}`)
      }
    } catch (error: any) {
      console.error('Error submitting notify request:', error)
      setNotifyStatus(`❌ ${error.message || 'שגיאה ברישום להתראות'}`)
    } finally {
      setNotifyLoading(false)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Head>
        <title>תורים לרם-אל | בדיקת תורים פנויים</title>
        <meta name="description" content="בדיקת תורים פנויים למספרת רם-אל" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {showPWABanner && (
        <PWABanner 
          onInstall={handleInstall}
          onDismiss={handleDismissPWABanner}
          ios={isIOSDevice}
          canInstall={canInstall}
        />
      )}

      <div className="page-container mx-auto px-4 py-6 max-w-screen-sm">
        {/* App Header */}
        <header className="app-header mb-8">
          <h1 className="text-2xl font-bold text-center mb-1">תורים למספרה רם-אל</h1>
          <p className="text-muted-foreground text-center text-sm">בדיקת תורים פנויים וקבלת התראות</p>
          
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span>מחובר</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span>לא מחובר</span>
              </div>
            )}
          </div>
        </header>
        
        {/* Cached Results */}
        {loadingCached ? (
          <div className="card-modern p-0 overflow-hidden mb-6">
            <div className="h-20 animate-pulse bg-muted"></div>
          </div>
        ) : cachedResult && cachedResult.summary?.hasAvailable ? (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                  תורים זמינים
                </Badge>
                <CardTitle className="text-right text-base">תוצאות עדכניות</CardTitle>
              </div>
              <CardDescription className="text-right">
                עודכן לפני {cachedResult.updatedTimeAgo}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-4">
                {cachedResult.results.filter((r: any) => r.available === true).map((result: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 pb-5 text-right">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="bg-[hsl(var(--accent))] border-none text-xs">
                        {result.times.length} זמנים
                      </Badge>
                      <div>
                        <div className="font-medium">
                          {formatDisplayDateIsrael(result.date)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getDayNameHebrew(result.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end mb-3">
                      {result.times.map((time: string, timeIdx: number) => (
                        <span key={timeIdx} className="px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-accent-foreground text-xs font-medium">
                          {formatTimeIsrael(time)}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => window.open(generateBookingUrl(result.date), '_blank')}
                        size="sm"
                        className="ml-auto"
                      >
                        קבע תור
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : cachedResult ? (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  אין תורים
                </Badge>
                <CardTitle className="text-right text-base">אין תורים זמינים</CardTitle>
              </div>
              <CardDescription className="text-right">
                עודכן לפני {cachedResult.updatedTimeAgo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-2">
                לא נמצאו תורים זמינים בבדיקה האחרונה
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Notification Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-right">קבל התראה כשמתפנה תור</CardTitle>
            <CardDescription className="text-right">
              נשלח לך מייל ברגע שמתפנה תור המתאים לבחירתך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNotifySubmit} className="stack-sm">
              {/* Email Field with Visual Indicator */}
              <div className="form-group">
                <label htmlFor="email-input" className="block text-sm font-medium text-right mb-1">
                  כתובת מייל
                </label>
                <div className="relative">
                  <input
                    id="email-input"
                    type="email"
                    name="email"
                    value={notifyEmail}
                    onChange={e => setNotifyEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full input-modern pr-10"
                    required
                    dir="ltr"
                  />
                  {notifyEmail.includes('@') && (
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground block text-right mt-1">
                  יישלח מייל כאשר מתפנה תור
                </span>
              </div>
              
              {/* Date Selection Type Toggle */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-right mb-2">
                  סוג בחירת תאריכים
                </label>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant={notifyType === 'single' ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setNotifyType('single')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                      <rect x="9" y="14" width="4" height="4"></rect>
                    </svg>
                    יום בודד
                  </Button>
                  <Button 
                    type="button"
                    variant={notifyType === 'range' ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setNotifyType('range')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                      <rect x="8" y="14" width="2" height="2"></rect>
                      <rect x="14" y="14" width="2" height="2"></rect>
                    </svg>
                    טווח תאריכים
                  </Button>
                </div>
              </div>
              
              {/* Date Picker with Smart Selection Indicator */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-right mb-2">
                  {notifyType === 'single' ? 'בחר תאריך' : 'בחר טווח תאריכים'}
                </label>
                {notifyType === 'single' ? (
                  <DatePicker 
                    date={notifyDate}
                    onDateChange={setNotifyDate}
                    placeholder="בחר תאריך"
                  />
                ) : (
                  <>
                    <DateRangePicker
                      dateRange={notifyDateRange}
                      onDateRangeChange={setNotifyDateRange}
                      placeholder="בחר טווח תאריכים"
                    />
                    {notifyDateRange.from && notifyDateRange.to && (
                      <div className="flex items-center bg-muted rounded-md px-3 py-1 mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                          <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z"></path>
                          <path d="M12 8v4l3 3"></path>
                        </svg>
                        <span className="text-xs text-muted-foreground">
                          חיפוש חכם - המערכת מאתרת מועד בטווח שבחרת
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Submit Button with Visual Feedback */}
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={notifyLoading}
                size="lg"
              >
                {notifyLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    <span>נרשם להתראות...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                    </svg>
                    הרשם להתראה
                  </>
                )}
              </Button>
              
              {/* Status Message with Visual Indicator */}
              {notifyStatus && (
                <div className={`text-sm text-center mt-3 p-2 rounded-md ${notifyStatus.startsWith('✓') ? 'bg-[hsl(var(--success)/10%)] text-[hsl(var(--success))]' : 'bg-[hsl(var(--destructive)/10%)] text-[hsl(var(--destructive))]'}`}>
                  {notifyStatus}
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4 text-xs text-muted-foreground">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              ההתראות ימשיכו להישלח עד לקביעת תור
            </div>
          </CardFooter>
        </Card>

        {/* Search Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-right">חיפוש תורים</CardTitle>
            <CardDescription className="text-right">
              חפש תורים זמינים בזמן אמת
            </CardDescription>
          </CardHeader>
          <CardContent className="stack-sm">
            <div className="flex gap-2">
              <Button
                variant={searchMode === 'closest' ? 'default' : 'outline'}
                onClick={() => setSearchMode('closest')}
                className="flex-1"
              >
                הקרוב ביותר
              </Button>
              <Button
                variant={searchMode === 'range' ? 'default' : 'outline'}
                onClick={() => setSearchMode('range')}
                className="flex-1"
              >
                טווח ימים
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground text-center mt-1">
              {searchMode === 'range' 
                ? `בדיקת ${days} ימים קדימה (ללא ימי שני ושבת)`
                : 'חיפוש התור הפנוי הקרוב ביותר (עד 30 ימים)'}
            </div>
            
            {searchMode === 'range' && (
              <Select value={days.toString()} onValueChange={value => setDays(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מספר ימים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 ימים</SelectItem>
                  <SelectItem value="7">7 ימים</SelectItem>
                  <SelectItem value="14">14 ימים</SelectItem>
                  <SelectItem value="21">21 ימים</SelectItem>
                  <SelectItem value="30">30 ימים</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={checkAppointments}
              disabled={loading}
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{searchMode === 'closest' ? 'מחפש תור...' : 'בודק תורים...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  <span>{searchMode === 'closest' ? 'חפש תור קרוב' : 'בדוק תורים'}</span>
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Manual Search Results */}
        {results.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                {results.filter(r => r.available === true).length > 0 && (
                  <Button 
                    onClick={handleShare}
                    size="sm"
                    variant="outline"
                  >
                    <Share2 className="h-4 w-4 ml-1" />
                    שתף
                  </Button>
                )}
                <CardTitle className="text-right">תוצאות חיפוש</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {results.filter(r => r.available === true).length > 0 ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--success)/20%)] text-[hsl(var(--success))] text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]"></div>
                    נמצאו {results.filter(r => r.available === true).length} תורים זמינים
                  </div>
                  
                  {searchMode === 'closest' && results.filter(r => r.available === true).length > 0 ? (
                    // Closest mode - show only the first available appointment
                    <div className="flex flex-col items-center text-center gap-3 py-2">
                      <div className="text-xl font-medium text-primary leading-tight">
                        {formatDisplayDateIsrael(results[0].date)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {getDayNameHebrew(results[0].date)}
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {results[0].times.map((time, timeIdx) => (
                          <Badge key={timeIdx} variant="outline" className="bg-[hsl(var(--accent))]">
                            {formatTimeIsrael(time)}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        onClick={() => window.open(generateBookingUrl(results[0].date), '_blank')}
                        className="w-full mt-2"
                      >
                        קבע תור עכשיו
                      </Button>
                    </div>
                  ) : (
                    // Range mode - show all available dates
                    <div className="space-y-4">
                      {results.filter(r => r.available === true).map((result, idx) => (
                        <div key={idx} className="border rounded-lg p-3 text-right">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="bg-[hsl(var(--accent))] border-none">
                              {result.times.length} זמנים
                            </Badge>
                            <div>
                              <div className="font-medium">
                                {formatDisplayDateIsrael(result.date)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {getDayNameHebrew(result.date)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end mb-3">
                            {result.times.map((time, timeIdx) => (
                              <span key={timeIdx} className="px-2 py-0.5 rounded-full bg-[hsl(var(--accent))] text-accent-foreground text-xs font-medium">
                                {formatTimeIsrael(time)}
                              </span>
                            ))}
                          </div>
                          <Button
                            onClick={() => window.open(generateBookingUrl(result.date), '_blank')}
                            size="sm"
                            className="w-full"
                          >
                            קבע תור
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : results.some(r => r.available === null) ? (
                <div className="text-center py-6">
                  <div className="text-destructive mb-2">שגיאה בבדיקת התורים</div>
                  <div className="text-sm text-muted-foreground">אנא נסה שוב מאוחר יותר</div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-primary mb-2">לא נמצאו תורים פנויים</div>
                  <div className="text-sm text-muted-foreground">נסה תאריכים אחרים או בדוק מאוחר יותר</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <p>פותח בידי דניאל פנחס &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">בדיקת תורים למספרת רם-אל</p>
        </footer>
      </div>
    </div>
  )
} 