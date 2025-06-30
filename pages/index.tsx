import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import OpportunityBanner from '@/components/OpportunityBanner';
import BottomNavigation from '@/components/BottomNavigation';
import SubscriptionManager from '@/components/SubscriptionManager';
import UserOTPAuth from '@/components/UserOTPAuth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Bell, Search, Smartphone, Wifi, Mail, Plus, LogOut } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

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

  const refreshOpportunities = async () => {
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

  const handleAuthenticated = (email: string, token: string) => {
    localStorage.setItem('ramel_user_email', email);
    localStorage.setItem('ramel_auth_token', token);
    setUserEmail(email);
    setAuthToken(token);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('ramel_user_email');
    localStorage.removeItem('ramel_auth_token');
    setUserEmail(null);
    setAuthToken(null);
  };

  const verifyAuthToken = async (email: string, token: string) => {
    try {
      const response = await fetch('/api/verify-auth-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        setUserEmail(email);
        setAuthToken(token);
      } else {
        // Token invalid, clear localStorage
        localStorage.removeItem('ramel_user_email');
        localStorage.removeItem('ramel_auth_token');
      }
    } catch (error) {
      console.error('Failed to verify token:', error);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      <Head>
        <title>תורים לרם-אל | בדיקת תורים פנויים</title>
        <meta name="description" content="בדיקת תורים פנויים למספרת רם-אל" />
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
                  תורים לרם-אל
                </h1>
                <p className="text-xs text-muted-foreground">בדיקת תורים וקבלת התראות</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {userEmail && (
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

        {/* Opportunity Banner - Only shown on home page */}
        <OpportunityBanner onRefresh={refreshOpportunities} />

        {/* Main Content */}
        <div className="space-y-6">
          {!userEmail ? (
            // User not connected - show OTP authentication
            <div className="space-y-6">
              <UserOTPAuth onAuthenticated={handleAuthenticated} />

              {/* Info for non-connected users */}
              <div className="text-center space-y-4 mt-8">
                <div className="bg-muted/30 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm text-muted-foreground">
                    כדי לרשום התראות עליך להתחבר עם המייל שלך
                  </p>
                </div>
                
                {/* Quick Actions for non-connected users */}
                <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
                  <Button
                    onClick={() => router.push('/manual-search')}
                    variant="outline"
                    className="h-12 border-primary/30 text-primary hover:text-primary hover:bg-primary/10"
                    size="lg"
                  >
                    <Search className="w-5 h-5 ml-2" />
                    חיפוש ידני
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // User connected - show subscription management
            <div className="space-y-6">
              {/* Subscription Manager */}
              <SubscriptionManager 
                userEmail={userEmail} 
                onDisconnect={handleDisconnect}
              />
              
              {/* Quick Actions for connected users */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold mb-4 text-center">פעולות מהירות</h3>
                <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
                  <Button
                    onClick={() => router.push('/notifications')}
                    className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground justify-start"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף התראה חדשה
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/manual-search')}
                    variant="outline"
                    className="h-11 border-primary/30 text-primary hover:text-primary hover:bg-primary/10 justify-start"
                  >
                    <Search className="w-4 h-4 ml-2" />
                    חיפוש ידני
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
} 