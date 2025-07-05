import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import NotificationSubscribe from '@/components/NotificationSubscribe';
import UserOTPAuth from '@/components/UserOTPAuth';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationsPage() {
  
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

  const { userEmail: authenticatedEmail, authToken, setAuth, clearAuth } = useAuth();
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  const loadSubscriptionCount = useCallback(async (email: string) => {
    try {
      const response = await fetch(`/api/user-subscriptions?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionCount(data.subscriptions?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load subscription count:', error);
    }
  }, []);

  useEffect(() => {
    // Load subscription count if authenticated
    if (authenticatedEmail) {
      loadSubscriptionCount(authenticatedEmail);
    }
  }, [authenticatedEmail, loadSubscriptionCount]);

  const handleAuthenticated = async (email: string, token: string) => {
    setAuth(email, token);
    loadSubscriptionCount(email);
  };

  const handleDisconnect = () => {
    clearAuth();
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
    <Layout title="התראות | תורים לרם-אל" description="הגדרת התראות לתורים פנויים">
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
    </Layout>
  );
} 