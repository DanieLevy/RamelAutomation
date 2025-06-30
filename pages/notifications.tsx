import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import NotificationSubscribe from '@/components/NotificationSubscribe';
import OpportunityBanner from '@/components/OpportunityBanner';
import BottomNavigation from '@/components/BottomNavigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Wifi, LogOut } from 'lucide-react';
import UserOTPAuth from '@/components/UserOTPAuth';
import AuthenticatedUserNav from '@/components/AuthenticatedUserNav';

export default function NotificationsPage() {
  const router = useRouter();
  
  // Notification form states
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyType, setNotifyType] = useState<'single' | 'range'>('single');
  const [notifyDate, setNotifyDate] = useState<Date | undefined>(undefined);
  const [notifyDateRange, setNotifyDateRange] = useState<{from?: Date, to?: Date}>({from: undefined, to: undefined});
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [subscribedEmail, setSubscribedEmail] = useState<string | undefined>(undefined);
  
  // Notification settings state
  const [notifySettings, setNotifySettings] = useState({
    maxNotifications: 3,
    intervalMinutes: 30,
    notifyOnEveryNew: true
  });

  const [isOnline, setIsOnline] = useState(true);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load saved authentication from localStorage
    const savedEmail = localStorage.getItem('ramel_user_email');
    const savedToken = localStorage.getItem('ramel_auth_token');
    
    if (savedEmail && savedToken) {
      // Verify token is still valid
      verifyAuthToken(savedEmail, savedToken);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const verifyAuthToken = async (email: string, token: string) => {
    try {
      const response = await fetch('/api/verify-auth-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        setAuthenticatedEmail(email);
        setAuthToken(token);
        loadSubscriptionCount(email);
      } else {
        // Token invalid, clear localStorage
        localStorage.removeItem('ramel_user_email');
        localStorage.removeItem('ramel_auth_token');
      }
    } catch (error) {
      console.error('Failed to verify token:', error);
    }
  };

  const loadSubscriptionCount = async (email: string) => {
    try {
      const response = await fetch('/api/user-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionCount(data.subscriptions?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load subscription count:', error);
    }
  };

  const handleAuthenticated = async (email: string, token: string) => {
    localStorage.setItem('ramel_user_email', email);
    localStorage.setItem('ramel_auth_token', token);
    setAuthenticatedEmail(email);
    setAuthToken(token);
    loadSubscriptionCount(email);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('ramel_user_email');
    localStorage.removeItem('ramel_auth_token');
    setAuthenticatedEmail(null);
    setAuthToken(null);
    setSubscriptionCount(0);
  };

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyLoading(true);
    setNotifyStatus(null);
    
    try {
      // Basic validations
      if (!notifyEmail.trim()) {
        throw new Error('יש להזין כתובת מייל');
      }
      if (notifyType === 'single' && !notifyDate) {
        throw new Error('יש לבחור תאריך');
      }
      if (notifyType === 'range' && !notifyDateRange.from) {
        throw new Error('יש לבחור לפחות תאריך התחלה');
      }

      // Format request based on notification type
      let requestPayload: any = {
        email: notifyEmail,
        smartSelection: true,
        notificationSettings: notifySettings
      };

      if (notifyType === 'single') {
        requestPayload.date = format(notifyDate!, 'yyyy-MM-dd');
      } else {
        requestPayload.start = format(notifyDateRange.from!, 'yyyy-MM-dd');
        requestPayload.end = notifyDateRange.to 
          ? format(notifyDateRange.to, 'yyyy-MM-dd') 
          : format(notifyDateRange.from!, 'yyyy-MM-dd');
      }

      // Send API request
      const response = await fetch('/api/notify-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();

      if (response.ok) {
        setSubscribedEmail(notifyEmail);
        setNotifyStatus(`✓ ${data.message || 'נרשמת בהצלחה! תקבל מייל כאשר יתפנה תור'}`);
        setNotifyEmail('');
        setNotifyDate(undefined);
        setNotifyDateRange({from: undefined, to: undefined});
        // Reset notification settings to default
        setNotifySettings({
          maxNotifications: 3,
          intervalMinutes: 30,
          notifyOnEveryNew: true
        });
      } else {
        setNotifyStatus(`❌ ${data.error || 'שגיאה ברישום להתראות'}`);
      }
    } catch (error: any) {
      setNotifyStatus(`❌ ${error.message || 'שגיאה ברישום להתראות'}`);
    } finally {
      setNotifyLoading(false);
    }
  };

  const refreshOpportunities = async () => {
    // Trigger a refresh of cached results
    try {
      await fetch('/api/check-appointments', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          mode: 'closest',  // Find the first available appointment
          days: 365         // Check up to a year ahead
        })
      });
      // Small delay to ensure cache is written
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to refresh opportunities:', error);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      <Head>
        <title>התראות | תורים לרם-אל</title>
        <meta name="description" content="הגדרת התראות לתורים פנויים" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#FFFFFF" id="theme-color-meta" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page-container mx-auto px-4 py-5 max-w-screen-sm" dir="rtl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
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
                  התראות
                </h1>
                <p className="text-xs text-muted-foreground">קבלת התראות לתורים פנויים</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {authenticatedEmail && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="h-7 px-2"
                  title="התנתק"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
              <ThemeToggle className="w-7 h-7" />
              {!isOnline && (
                <div className="text-muted-foreground" title="אופליין">
                  <Wifi className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4"></div>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {!authenticatedEmail ? (
            <div className="space-y-6">
              <UserOTPAuth onAuthenticated={handleAuthenticated} />
              
              {/* Info for non-connected users */}
              <div className="text-center mt-8">
                <div className="bg-muted/30 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm text-muted-foreground">
                    התחבר עם המייל שלך כדי לרשום התראות לתורים פנויים
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <NotificationSubscribe 
              defaultEmail={authenticatedEmail}
              onSubscriptionChange={() => loadSubscriptionCount(authenticatedEmail)}
            />
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
} 