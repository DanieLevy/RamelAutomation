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

interface AppointmentResponse {
  id: string;
  notification_id: string;
  appointment_date: string;
  appointment_times: string[];
  response_status: 'pending' | 'taken' | 'not_wanted' | 'expired';
  responded_at: string | null;
  created_at: string;
}

export default function ManagePage() {
  const router = useRouter();
  const { email, token } = router.query;
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<NotificationData[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [appointmentResponses, setAppointmentResponses] = useState<AppointmentResponse[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [expandedSubscriptions, setExpandedSubscriptions] = useState<Set<string>>(new Set());
  const [tokenValidated, setTokenValidated] = useState(false);

  useEffect(() => {
    if (token && typeof token === 'string') {
      // Token-based access - validate token first
      validateTokenAndLoadData(token);
    } else if (email && typeof email === 'string') {
      // Legacy email-based access (deprecated)
      setSearchEmail(email);
      setUserEmail(email);
      loadSubscriptions(email);
    } else {
      setLoading(false);
    }
  }, [email, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateTokenAndLoadData = async (managementToken: string) => {
    try {
      setLoading(true);
      setError(null);

      // Validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from('management_tokens')
        .select('email, expires_at, used')
        .eq('token', managementToken)
        .single();

      if (tokenError || !tokenData) {
        setError('קישור לא תקין או פג תוקף. אנא בקש קישור חדש.');
        setLoading(false);
        return;
      }

      // Check if token expired
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        setError('קישור פג תוקף. אנא בקש קישור חדש.');
        setLoading(false);
        return;
      }

      // Mark token as used
      await supabase
        .from('management_tokens')
        .update({ 
          used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('token', managementToken);

      // Load user's subscriptions
      setUserEmail(tokenData.email);
      setSearchEmail(tokenData.email);
      setTokenValidated(true);
      await loadSubscriptions(tokenData.email);

    } catch (error) {
      console.error('Token validation error:', error);
      setError('שגיאה בטעינת הנתונים. אנא נסה שוב.');
      setLoading(false);
    }
  };

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

        // Try to load appointment responses
        try {
          const { data: responsesData } = await supabase
            .from('user_appointment_responses')
            .select('*')
            .in('notification_id', notificationIds)
            .order('created_at', { ascending: false });

          setAppointmentResponses(responsesData || []);
        } catch (responsesError) {
          console.log('Appointment responses not available yet');
          setAppointmentResponses([]);
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
      requestManagementAccess(searchEmail.trim());
    }
  };

  const requestManagementAccess = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/generate-management-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת הבקשה');
      }

      setError(null);
      setLoading(false);
      
      // Show success message
      alert(`✅ ${data.message}`);

    } catch (error: any) {
      console.error('Request management access error:', error);
      setError(error.message || 'שגיאה בשליחת הבקשה. אנא נסה שוב.');
      setLoading(false);
    }
  };

  const toggleSubscriptionExpansion = (subscriptionId: string) => {
    const newExpanded = new Set(expandedSubscriptions);
    if (newExpanded.has(subscriptionId)) {
      newExpanded.delete(subscriptionId);
    } else {
      newExpanded.add(subscriptionId);
    }
    setExpandedSubscriptions(newExpanded);
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הרשמה זו לצמיתות? פעולה זו לא ניתנת לביטול.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      // Refresh the data
      if (userEmail) {
        loadSubscriptions(userEmail);
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('שגיאה במחיקת ההרשמה. אנא נסה שוב.');
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

  const getAppointmentResponsesForSubscription = (subscriptionId: string) => {
    return appointmentResponses.filter(response => response.notification_id === subscriptionId);
  };

  const getResponseStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return <Badge variant="default" className="bg-green-500 text-white">נלקח</Badge>;
      case 'not_wanted':
        return <Badge variant="secondary">לא מתאים</Badge>;
      case 'pending':
        return <Badge variant="outline">ממתין לתגובה</Badge>;
      case 'expired':
        return <Badge variant="destructive">פג תוקף</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

          {/* Secure Access Form */}
          {!tokenValidated && (
            <form onSubmit={handleSearch} className="space-y-4 max-w-md">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-medium text-blue-800 dark:text-blue-200">גישה מאובטחת</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  לאבטחת הפרטיות, נשלח לך קישור מאובטח למייל לניהול ההתראות שלך
                </p>
              </div>
              
              <div className="flex gap-3">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="הכנס כתובת מייל לקבלת קישור מאובטח..."
                  className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Button type="submit" className="px-6" disabled={loading}>
                  {loading ? 'שולח...' : 'שלח קישור'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!tokenValidated && !userEmail && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">גישה מאובטחת להתראות</h2>
            <p className="text-muted-foreground">הכנס את כתובת המייל שלך לקבלת קישור מאובטח לניהול ההתראות</p>
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

            <div className="space-y-4">
              {/* Active subscriptions */}
              {subscriptions.filter(s => s.status === 'active').map((subscription) => {
                const statusInfo = getStatusInfo(subscription.status);
                const history = getEmailHistoryForSubscription(subscription.id);
                const isExpanded = expandedSubscriptions.has(subscription.id);
                
                return (
                  <Card key={subscription.id} className="overflow-hidden">
                    {/* Header - Always visible */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <span>{statusInfo.icon}</span>
                              {statusInfo.text}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatCriteria(subscription.criteria_type, subscription.criteria)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>התראות: {subscription.notification_count}/6</span>
                            <span>נוצר: {formatDate(subscription.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => toggleSubscriptionExpansion(subscription.id)}
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                          >
                            <span>פרטים</span>
                            <svg 
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </Button>
                          <Button
                            onClick={() => handleCancelSubscription(subscription.id, subscription.unsubscribe_token)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            בטל
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="p-6 bg-muted/30">
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
                            <h4 className="font-medium text-foreground">התקדמות התראות</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">התקדמות</span>
                                <span className="font-medium">{subscription.notification_count}/6</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(subscription.notification_count / 6) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-border mt-4">
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
                    )}
                  </Card>
                );
              })}

              {/* Inactive subscriptions - Collapsed by default */}
              {subscriptions.filter(s => s.status !== 'active').length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-muted-foreground">הרשמות לא פעילות</h3>
                  {subscriptions.filter(s => s.status !== 'active').map((subscription) => {
                    const statusInfo = getStatusInfo(subscription.status);
                    const isExpanded = expandedSubscriptions.has(subscription.id);
                    
                    return (
                      <Card key={subscription.id} className="overflow-hidden opacity-75">
                        {/* Collapsed Header */}
                        <div className="p-3 bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant={statusInfo.variant} className="gap-1 text-xs">
                                <span>{statusInfo.icon}</span>
                                {statusInfo.text}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatCriteria(subscription.criteria_type, subscription.criteria)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {subscription.notification_count}/6 התראות
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => toggleSubscriptionExpansion(subscription.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                              >
                                {isExpanded ? 'הסתר' : 'הצג'}
                              </Button>
                              <Button
                                onClick={() => handleDeleteSubscription(subscription.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                              >
                                מחק
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details for inactive */}
                        {isExpanded && (
                          <div className="p-4 border-t border-border">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">סטטוס</span>
                                <span className="font-medium">{statusInfo.description}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">נוצר</span>
                                <span className="font-medium">{formatDate(subscription.created_at)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">התראה אחרונה</span>
                                <span className="font-medium">
                                  {subscription.last_notified ? formatDate(subscription.last_notified) : 'אף פעם'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
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