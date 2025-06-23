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
import { createClient } from '@supabase/supabase-js';

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
  const [notifyDate, setNotifyDate] = useState<string | { start: string; end: string }>('')

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
        setLoadingCached(true);
        console.log('Loading cached results from Supabase...');
        const { data, error } = await supabase
          .from('cache')
          .select('value')
          .eq('key', 'auto-check')
          .single();
        if (error) {
          console.error('Supabase error loading cache:', error);
          setCachedResult(null);
        } else if (data && data.value && data.value.result && data.value.result.summary) {
          setCachedResult(data.value);
        } else {
          setCachedResult(null);
        }
      } catch (error) {
        console.error('Failed to load cached results from Supabase:', error);
        setCachedResult(null);
      } finally {
        setLoadingCached(false);
      }
    };
    loadCachedResults();
    // Refresh cached results every 5 minutes
    const interval = setInterval(loadCachedResults, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
    e.preventDefault();
    setNotifyStatus(null);
    const form = e.target as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value;
    const date = typeof notifyDate === 'string' ? notifyDate : notifyDate.start || '';
    if (!email || !date) {
      setNotifyStatus('נא למלא אימייל ותאריך');
      return;
    }
    setNotifyLoading(true);
    try {
      const res = await fetch('/api/notify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, date }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifyStatus('נרשמת בהצלחה! תקבל התראה אם יימצא תור.');
      } else {
        setNotifyStatus(data.error || 'שגיאה בהרשמה');
      }
    } catch (err) {
      setNotifyStatus('שגיאה בהרשמה');
    } finally {
      setNotifyLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center px-2">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 py-6">
        {/* Header */}
        <header className="w-full flex flex-col items-center">
          <img src="/icons/icon-96x96.png" className="w-14 h-14 rounded-xl mb-2 shadow-md" alt="Logo" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">מספרת רם-אל</h1>
          <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">בדיקת תורים אוטומטית</p>
        </header>

        {/* Status Bar */}
        <div className="w-full flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-1">
            {isOnline ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            <span>{isOnline ? 'מחובר' : 'לא מחובר'}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span>ישראל</span>
          </div>
          <span>{new Intl.DateTimeFormat('he-IL', { timeZone: ISRAEL_TIMEZONE, hour: '2-digit', minute: '2-digit' }).format(new Date())}</span>
        </div>

        {/* Appointment Card */}
        <section className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-2 text-right w-full">התור הקרוב ביותר שנמצא</h2>
          {!loadingCached && cachedSummary && cachedFound ? (
            <div className="flex flex-col items-center text-center gap-2">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                התור הכי קרוב
                <span className="text-gray-400 dark:text-gray-500 text-[11px] font-normal ml-1">— נמצא אוטומטית</span>
              </span>
              <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100 leading-tight">
                {formatDisplayDateIsrael(cachedDate)}
              </div>
              <div className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                {getDayNameHebrew(cachedDate)}
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {cachedTimes?.map((time: string, index: number) => (
                  <span key={index} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 text-xs font-semibold">
                    {formatTimeIsrael(time)}
                  </span>
                ))}
              </div>
              <Button
                onClick={() => window.open(generateBookingUrl(cachedDate), '_blank')}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg mt-2 shadow-sm"
              >
                קבע תור עכשיו
              </Button>
              {lastCheckMinutesAgo !== null && (
                <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-center gap-1">
                  <span aria-label="עודכן לאחרונה" title={lastCheckDisplay || ''}>⏱️</span>
                  <span>עודכן לפני {lastCheckMinutesAgo} דקות</span>
                </div>
              )}
            </div>
          ) : loadingCached ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span className="text-gray-600 dark:text-gray-400 font-light">טוען תוצאות אוטומטיות...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                בדיקה אוטומטית כל 5 דקות
              </div>
            </div>
          )}
        </section>

        {/* Notification Form */}
        <section className="w-full bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-2 text-right w-full">קבל התראה על תור פנוי</h2>
          <form className="flex flex-col gap-2" onSubmit={handleNotifySubmit}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">אימייל</label>
            <input
              type="email"
              name="email"
              value={notifyEmail}
              onChange={e => setNotifyEmail(e.target.value)}
              placeholder="האימייל שלך"
              className="w-full rounded border px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              required
              autoComplete="email"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-2">סוג התראה</label>
            <div className="flex gap-2 mb-1">
              <button type="button" className={`flex-1 rounded py-2 text-sm font-medium border ${notifyType === 'single' ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-700 dark:text-emerald-200' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`} onClick={() => setNotifyType('single')}>יום בודד</button>
              <button type="button" className={`flex-1 rounded py-2 text-sm font-medium border ${notifyType === 'range' ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-700 dark:text-emerald-200' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`} onClick={() => setNotifyType('range')}>טווח תאריכים</button>
            </div>
            {notifyType === 'single' ? (
              <input
                type="date"
                name="date"
                value={typeof notifyDate === 'string' ? notifyDate : ''}
                onChange={e => setNotifyDate(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                required
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="date"
                  name="start"
                  value={typeof notifyDate === 'object' ? notifyDate.start : ''}
                  onChange={e => setNotifyDate(prev => (typeof prev === 'object' ? { ...prev, start: e.target.value } : { start: e.target.value, end: '' }))}
                  className="w-full rounded border px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  required
                />
                <input
                  type="date"
                  name="end"
                  value={typeof notifyDate === 'object' ? notifyDate.end : ''}
                  onChange={e => setNotifyDate(prev => (typeof prev === 'object' ? { ...prev, end: e.target.value } : { start: '', end: e.target.value }))}
                  className="w-full rounded border px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  required
                />
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded py-2 text-sm font-medium mt-2 disabled:opacity-60 transition"
              disabled={notifyLoading}
            >
              {notifyLoading ? 'נרשם...' : 'התראה על תור'}
            </button>
            {notifyStatus && (
              <div className="text-xs text-center mt-1 text-gray-500">{notifyStatus}</div>
            )}
          </form>
        </section>

        {/* Search Controls */}
        <section className="w-full flex flex-col gap-4 mb-8">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-2 text-right w-full">אפשרויות חיפוש</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant={searchMode === 'closest' ? 'default' : 'outline'}
                onClick={() => setSearchMode('closest')}
                className="flex-1 rounded-lg"
              >
                הקרוב ביותר
              </Button>
              <Button
                variant={searchMode === 'range' ? 'default' : 'outline'}
                onClick={() => setSearchMode('range')}
                className="flex-1 rounded-lg"
              >
                טווח ימים
              </Button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
              {searchMode === 'range' 
                ? `בדיקת ${days} ימים קדימה (ללא ימי שני ושבת)`
                : 'חיפוש התור הפנוי הקרוב ביותר (עד 30 ימים)'}
            </div>
            {searchMode === 'range' && (
              <Select value={days.toString()} onValueChange={value => setDays(parseInt(value))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
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
          </div>
          <Button
            onClick={checkAppointments}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md transition"
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
        </section>
      </div>
    </div>
  )
} 