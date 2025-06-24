import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Clock, Search, Smartphone, Wifi, WifiOff, Share2, Copy, Download, MapPin, ExternalLink } from 'lucide-react';
import { ThemeToggle } from '../components/ui/theme-toggle';
import PWABanner from '../components/PWABanner';
import CachedResults from '../components/CachedResults';
import NotificationSubscribe from '../components/NotificationSubscribe';
import ManualSearch from '../components/ManualSearch';
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
  const [searchMode, setSearchMode] = useState<'range' | 'closest'>('range')
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

  // State for sticky header
  const [isHeaderSticky, setIsHeaderSticky] = useState(false)

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
  }, [installPrompt])

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

  useEffect(() => {
    // Check if online
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Scroll event for sticky header
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsHeaderSticky(scrollPosition > 100) // Show sticky header after scrolling 100px
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <Head>
        <title>תורים לרם-אל | בדיקת תורים פנויים</title>
        <meta name="description" content="בדיקת תורים פנויים למספרת רם-אל" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* Theme color set dynamically based on current theme */}
        <meta name="theme-color" content="#FFFFFF" id="theme-color-meta" />
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

      <div className={`page-container mx-auto px-4 py-5 max-w-screen-sm transition-all duration-300 ${
        isHeaderSticky ? 'pt-12' : 'pt-4'
      }`} dir="rtl">
        {/* Sticky Header - shows when scrolling */}
        <header 
          className={`fixed top-0 left-0 right-0 z-50 sticky-header ${
            isHeaderSticky 
              ? 'translate-y-0 opacity-100 shadow-sm' 
              : 'translate-y-[-100%] opacity-0'
          }`}
        >
          <div className="sticky-header-content max-w-screen-sm mx-auto px-4 py-1.5 bg-background/95 dark:bg-background/90 border-b border-border/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <img 
                  src="/icons/icon-72x72.png" 
                  alt="תור רם-אל"
                  className="w-6 h-6 rounded-md"
                />
                <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-white/10 to-transparent dark:from-black/10"></div>
              </div>
              <h2 className="text-xs font-medium text-foreground">
                תורים לרם-אל
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                className="text-[10px] bg-background hover:bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground border border-border/30 transition-colors"
                aria-label="חזרה למעלה"
              >
                ↑
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Header - only shows when not scrolled */}
        <header className={`app-header mb-5 ${
          isHeaderSticky ? 'opacity-0 transform translate-y-[-8px] pointer-events-none' : 'opacity-100 transform translate-y-0'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/icons/icon-72x72.png" 
                  alt="תור רם-אל"
                  className="w-11 h-11 rounded-xl shadow-sm"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent dark:from-black/20"></div>
              </div>
              
              <div>
                <h1 className="text-lg font-bold mb-0.5 leading-none">
                  תורים לרם-אל
                </h1>
                <p className="text-xs text-muted-foreground">בדיקת תורים וקבלת התראות</p>
              </div>
            </div>
            
            <ThemeToggle className="w-7 h-7" />
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3"></div>
        </header>
        
        {/* Cached Results Component */}
        <CachedResults
          loading={loadingCached}
          cachedResult={cachedResult}
          onCheckAppointments={checkAppointments}
          formatDisplayDateIsrael={formatDisplayDateIsrael}
          getDayNameHebrew={getDayNameHebrew}
          formatTimeIsrael={formatTimeIsrael}
          generateBookingUrl={generateBookingUrl}
        />

        {/* Notification Subscribe Component */}
        <NotificationSubscribe
          notifyEmail={notifyEmail}
          setNotifyEmail={setNotifyEmail}
          notifyType={notifyType}
          setNotifyType={setNotifyType}
          notifyDate={notifyDate}
          setNotifyDate={setNotifyDate}
          notifyDateRange={notifyDateRange}
          setNotifyDateRange={setNotifyDateRange}
          notifyLoading={notifyLoading}
          notifyStatus={notifyStatus}
          onSubmit={handleNotifySubmit}
        />

        {/* Manual Search Component */}
        <ManualSearch
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          days={days}
          setDays={setDays}
          loading={loading}
          results={results}
          onCheckAppointments={checkAppointments}
          onShare={handleShare}
          formatDisplayDateIsrael={formatDisplayDateIsrael}
          getDayNameHebrew={getDayNameHebrew}
          formatTimeIsrael={formatTimeIsrael}
          generateBookingUrl={generateBookingUrl}
        />
        
        {/* Footer */}
        <div className="mt-8 mb-4 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-xs text-center flex items-center gap-1.5">
              פותח ב
              <span className="inline-block text-primary animate-pulse" role="img" aria-label="heart">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </span>
              על ידי דניאל לוי
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              {new Date().getFullYear()} © כל הזכויות שמורות
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 