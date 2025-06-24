import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NotificationData {
  id: string;
  email: string;
  status: string;
  criteria_type: string;
  criteria: any;
  notification_count: number;
  created_at: string;
  last_notified: string | null;
  unsubscribe_token: string;
  updated_at: string;
}

interface EmailHistory {
  id: string;
  notification_id: string;
  sent_at: string;
  email_count: number;
  appointment_data: any;
}

export default function ManagePage() {
  const router = useRouter();
  const { email } = router.query;
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<NotificationData[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (email && typeof email === 'string') {
      setSearchEmail(email);
      loadSubscriptions(email);
    } else {
      setLoading(false);
    }
  }, [email]);

  const loadSubscriptions = async (userEmail: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load subscriptions
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('email', userEmail)
        .order('created_at', { ascending: false });

      if (notificationError) {
        throw notificationError;
      }

      setSubscriptions(notificationData || []);

      // Load email history if we have subscriptions
      if (notificationData && notificationData.length > 0) {
        const notificationIds = notificationData.map(n => n.id);
        
        // Try to load email history (this table might not exist yet)
        try {
          const { data: historyData } = await supabase
            .from('email_history')
            .select('*')
            .in('notification_id', notificationIds)
            .order('sent_at', { ascending: false });

          setEmailHistory(historyData || []);
        } catch (historyError) {
          // Email history table doesn't exist yet, that's okay
          console.log('Email history not available yet');
          setEmailHistory([]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError('שגיאה בטעינת ההרשמות. אנא נסה שוב.');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchEmail.trim()) {
      router.push(`/manage?email=${encodeURIComponent(searchEmail.trim())}`);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string, unsubscribeToken: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      // Refresh the data
      if (searchEmail) {
        loadSubscriptions(searchEmail);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('שגיאה בביטול ההרשמה. אנא נסה שוב.');
    }
  };

  const formatCriteria = (criteriaType: string, criteria: any) => {
    if (criteriaType === 'single' && criteria?.date) {
      return `תאריך בודד: ${criteria.date}`;
    } else if (criteriaType === 'range' && criteria?.start && criteria?.end) {
      return `טווח תאריכים: ${criteria.start} עד ${criteria.end}`;
    }
    return 'לא זמין';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          text: 'פעיל', 
          variant: 'default' as const, 
          icon: '●',
          description: 'מקבל התראות באופן פעיל'
        };
      case 'cancelled':
        return { 
          text: 'בוטל', 
          variant: 'destructive' as const, 
          icon: '⊘',
          description: 'בוטל על ידי המשתמש'
        };
      case 'expired':
        return { 
          text: 'פג תוקף', 
          variant: 'secondary' as const, 
          icon: '⏰',
          description: 'התאריכים שביקשת עברו'
        };
      case 'max_reached':
        return { 
          text: 'הושלם', 
          variant: 'outline' as const, 
          icon: '✓',
          description: 'נשלחו 6 התראות מקסימליות'
        };
      default:
        return { 
          text: 'לא ידוע', 
          variant: 'secondary' as const, 
          icon: '?',
          description: 'סטטוס לא ידוע'
        };
    }
  };

  const getEmailHistoryForSubscription = (subscriptionId: string) => {
    return emailHistory.filter(h => h.notification_id === subscriptionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed top-4 left-4 z-10">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle */}
      <div className="fixed top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-light text-foreground">ניהול התראות</h1>
              <p className="text-muted-foreground mt-1">נהל את כל ההרשמות שלך להתראות במספרת רם-אל</p>
            </div>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              חזרה לאפליקציה
            </Button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="הכנס כתובת מייל לחיפוש הרשמות..."
              className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <Button type="submit" className="px-6">
              חפש
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!searchEmail && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">הכנס כתובת מייל</h2>
            <p className="text-muted-foreground">הכנס את כתובת המייל שלך כדי לראות את כל ההרשמות שלך להתראות</p>
          </div>
        )}

        {searchEmail && subscriptions.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">לא נמצאו הרשמות</h2>
            <p className="text-muted-foreground mb-4">לא נמצאו הרשמות עבור כתובת המייל: {searchEmail}</p>
            <Button onClick={() => router.push('/')} className="gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              צור הרשמה חדשה
            </Button>
          </div>
        )}

        {subscriptions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-foreground">
                הרשמות עבור {searchEmail} ({subscriptions.length})
              </h2>
              <Button onClick={() => router.push('/')} variant="outline" className="gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                הרשמה חדשה
              </Button>
            </div>

            <div className="grid gap-6">
              {subscriptions.map((subscription) => {
                const statusInfo = getStatusInfo(subscription.status);
                const history = getEmailHistoryForSubscription(subscription.id);
                
                return (
                  <Card key={subscription.id} className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <span>{statusInfo.icon}</span>
                              {statusInfo.text}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              נוצר ב-{formatDate(subscription.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
                        </div>
                        
                        {subscription.status === 'active' && (
                          <Button
                            onClick={() => handleCancelSubscription(subscription.id, subscription.unsubscribe_token)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            בטל הרשמה
                          </Button>
                        )}
                      </div>

                      <Separator />

                      {/* Details */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">פרטי ההרשמה</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">קריטריונים</span>
                              <span className="font-medium">{formatCriteria(subscription.criteria_type, subscription.criteria)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">התראות שנשלחו</span>
                              <span className="font-medium">{subscription.notification_count} מתוך 6</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">התראה אחרונה</span>
                              <span className="font-medium">
                                {subscription.last_notified ? formatDate(subscription.last_notified) : 'אף פעם'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">עודכן לאחרונה</span>
                              <span className="font-medium">{formatDate(subscription.updated_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">היסטוריית התראות</h4>
                          {history.length > 0 ? (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {history.map((email) => (
                                <div key={email.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                  <span>התראה #{email.email_count}</span>
                                  <span className="text-muted-foreground">{formatDate(email.sent_at)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {subscription.notification_count > 0 
                                ? 'היסטוריה מפורטת לא זמינה (מערכת חדשה)'
                                : 'עדיין לא נשלחו התראות'
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">התקדמות התראות</span>
                          <span className="font-medium">{subscription.notification_count}/6</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(subscription.notification_count / 6) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => router.push(`/unsubscribe?token=${subscription.unsubscribe_token}`)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          פרטים מלאים
                        </Button>
                        
                        {subscription.criteria_type === 'range' && subscription.criteria?.start && (
                          <Button
                            onClick={() => {
                              const criteria = subscription.criteria;
                              const searchParams = new URLSearchParams({
                                email: subscription.email,
                                hasDate: 'false',
                                hasStart: 'true',
                                hasEnd: 'true',
                                startDate: criteria.start,
                                endDate: criteria.end
                              });
                              router.push(`/?${searchParams.toString()}`);
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            חזור על החיפוש
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2024 מספרת רם-אל • מערכת התראות אוטומטית
        </div>
      </div>
    </div>
  );
} 