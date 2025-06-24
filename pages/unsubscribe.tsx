import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ThemeToggle } from '../components/ui/theme-toggle';

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
}

export default function UnsubscribePage() {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NotificationData | null>(null);
  const [status, setStatus] = useState<'loading' | 'not_found' | 'already_cancelled' | 'expired' | 'max_reached' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      setStatus('not_found');
      setLoading(false);
      return;
    }

    handleUnsubscribe(token);
  }, [token]);

  const handleUnsubscribe = async (unsubscribeToken: string) => {
    try {
      setLoading(true);
      
      // Check if token exists and get subscription details
      const { data: notificationData, error } = await supabase
        .from('notifications')
        .select('id, email, status, criteria_type, criteria, notification_count, created_at, last_notified')
        .eq('unsubscribe_token', unsubscribeToken)
        .single();

      if (error || !notificationData) {
        setStatus('not_found');
        setLoading(false);
        return;
      }

      setData(notificationData);

      // Handle different subscription statuses
      const currentStatus = notificationData.status || 'active';
      
      if (currentStatus === 'cancelled') {
        setStatus('already_cancelled');
        setLoading(false);
        return;
      }

      if (currentStatus === 'expired') {
        setStatus('expired');
        setLoading(false);
        return;
      }

      if (currentStatus === 'max_reached') {
        setStatus('max_reached');
        setLoading(false);
        return;
      }

      // For active subscriptions, perform the cancellation
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('unsubscribe_token', unsubscribeToken);

      if (updateError) {
        setStatus('error');
      } else {
        setStatus('success');
        // Update local data to reflect the change
        setData(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing unsubscribe request:', error);
      setStatus('error');
      setLoading(false);
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
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { text: 'פעיל', color: 'emerald', icon: '●' };
      case 'cancelled':
        return { text: 'בוטל', color: 'red', icon: '⊘' };
      case 'expired':
        return { text: 'פג תוקף', color: 'amber', icon: '⏰' };
      case 'max_reached':
        return { text: 'הושלם', color: 'blue', icon: '✓' };
      default:
        return { text: 'לא ידוע', color: 'gray', icon: '?' };
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return (
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'not_found':
      case 'error':
        return (
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'already_cancelled':
      case 'expired':
      case 'max_reached':
        return (
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/20 rounded-full">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-fade-in">
          {getIcon()}
          <h1 className="text-2xl font-light text-center mb-4 text-foreground">
            מעבד בקשה...
          </h1>
          <p className="text-muted-foreground text-center mb-8 leading-relaxed">
            אנא המתן בזמן שאנו מעבדים את בקשת הביטול שלך
          </p>
        </div>
      );
    }

    switch (status) {
      case 'success':
        return (
          <div className="animate-fade-in">
            {getIcon()}
            <h1 className="text-3xl font-light text-center mb-4 text-foreground">
              הרשמה בוטלה בהצלחה
            </h1>
            <p className="text-muted-foreground text-center mb-8 leading-relaxed">
              ההרשמה שלך להתראות במספרת רם-אל בוטלה בהצלחה.<br />
              לא תקבל עוד התראות על הכתובת הזו.
            </p>
            
            {data && (
              <div className="bg-muted/50 rounded-xl p-6 mb-8 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  פרטי ההרשמה שבוטלה
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">כתובת מייל</span>
                    <span className="font-medium">{data.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">קריטריונים</span>
                    <span className="font-medium">{formatCriteria(data.criteria_type, data.criteria)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">התראות שנשלחו</span>
                    <span className="font-medium">{data.notification_count} מתוך 6</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">נוצר ב</span>
                    <span className="font-medium">{formatDate(data.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">התראה אחרונה</span>
                    <span className="font-medium">{data.last_notified ? formatDate(data.last_notified) : 'אף פעם'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-muted-foreground">סטטוס</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-xs font-medium">
                      ⊘ בוטל
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                רישום מחדש
              </button>
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                חזרה לאפליקציה
              </button>
            </div>
          </div>
        );

      case 'already_cancelled':
        const statusInfo = getStatusInfo('cancelled');
        return (
          <div className="animate-fade-in">
            {getIcon()}
            <h1 className="text-3xl font-light text-center mb-4 text-foreground">
              ההרשמה כבר בוטלה
            </h1>
            <p className="text-muted-foreground text-center mb-8 leading-relaxed">
              ההרשמה שלך להתראות במספרת רם-אל כבר בוטלה בעבר על ידך.
            </p>
            
            {data && (
              <div className="bg-muted/50 rounded-xl p-6 mb-8 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  פרטי ההרשמה
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">כתובת מייל</span>
                    <span className="font-medium">{data.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">קריטריונים</span>
                    <span className="font-medium">{formatCriteria(data.criteria_type, data.criteria)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">התראות שנשלחו</span>
                    <span className="font-medium">{data.notification_count} מתוך 6</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-muted-foreground">סטטוס</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-900/20 text-${statusInfo.color}-700 dark:text-${statusInfo.color}-300 rounded-md text-xs font-medium`}>
                      {statusInfo.icon} {statusInfo.text}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                רישום מחדש
              </button>
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                חזרה לאפליקציה
              </button>
            </div>
          </div>
        );

      case 'expired':
        const expiredStatusInfo = getStatusInfo('expired');
        return (
          <div className="animate-fade-in">
            {getIcon()}
            <h1 className="text-3xl font-light text-center mb-4 text-foreground">
              ההרשמה פגה
            </h1>
            <p className="text-muted-foreground text-center mb-8 leading-relaxed">
              ההרשמה שלך להתראות פגה מאחר והתאריכים שביקשת כבר עברו.
            </p>
            
            {data && (
              <div className="bg-muted/50 rounded-xl p-6 mb-8 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  פרטי ההרשמה שפגה
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">כתובת מייל</span>
                    <span className="font-medium">{data.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">קריטריונים</span>
                    <span className="font-medium">{formatCriteria(data.criteria_type, data.criteria)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">התראות שנשלחו</span>
                    <span className="font-medium">{data.notification_count} מתוך 6</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-muted-foreground">סטטוס</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-${expiredStatusInfo.color}-100 dark:bg-${expiredStatusInfo.color}-900/20 text-${expiredStatusInfo.color}-700 dark:text-${expiredStatusInfo.color}-300 rounded-md text-xs font-medium`}>
                      {expiredStatusInfo.icon} {expiredStatusInfo.text}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                רישום חדש
              </button>
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                חזרה לאפליקציה
              </button>
            </div>
          </div>
        );

      case 'max_reached':
        const maxStatusInfo = getStatusInfo('max_reached');
        return (
          <div className="animate-fade-in">
            {getIcon()}
            <h1 className="text-3xl font-light text-center mb-4 text-foreground">
              הושלמו כל ההתראות
            </h1>
            <p className="text-muted-foreground text-center mb-8 leading-relaxed">
              ההרשמה שלך להתראות הושלמה לאחר שנשלחו לך 6 התראות מקסימליות.
            </p>
            
            {data && (
              <div className="bg-muted/50 rounded-xl p-6 mb-8 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  פרטי ההרשמה שהושלמה
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">כתובת מייל</span>
                    <span className="font-medium">{data.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">קריטריונים</span>
                    <span className="font-medium">{formatCriteria(data.criteria_type, data.criteria)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">התראות שנשלחו</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{data.notification_count} מתוך 6 ✓</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-muted-foreground">סטטוס</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-${maxStatusInfo.color}-100 dark:bg-${maxStatusInfo.color}-900/20 text-${maxStatusInfo.color}-700 dark:text-${maxStatusInfo.color}-300 rounded-md text-xs font-medium`}>
                      {maxStatusInfo.icon} {maxStatusInfo.text}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                רישום חדש
              </button>
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                חזרה לאפליקציה
              </button>
            </div>
          </div>
        );

      case 'not_found':
        return (
          <div className="animate-fade-in">
            {getIcon()}
            <h1 className="text-3xl font-light text-center mb-4 text-foreground">
              הרשמה לא נמצאה
            </h1>
            <p className="text-muted-foreground text-center mb-8 leading-relaxed">
              הקישור שלחצת עליו אינו תקף או שההרשמה כבר הוסרה מהמערכת.
            </p>
            
            <div className="bg-muted/50 rounded-xl p-6 mb-8 border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                סיבות אפשריות
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                  הקישור פג תוקף
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                  ההרשמה כבר בוטלה בעבר
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                  הקישור לא הועתק כראוי
                </li>
              </ul>
            </div>
            
            <button 
              onClick={() => router.push('/')} 
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
            >
              רישום מחדש לתורים
            </button>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="animate-fade-in">
            {getIcon()}
            <h1 className="text-3xl font-light text-center mb-4 text-foreground">
              שגיאת מערכת
            </h1>
            <p className="text-muted-foreground text-center mb-8 leading-relaxed">
              אירעה שגיאה בעת ביטול ההרשמה. אנא נסה שוב מאוחר יותר.
            </p>
            
            <div className="bg-muted/50 rounded-xl p-6 mb-8 border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                מה אפשר לעשות
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                  נסה לרענן את הדף
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                  בדוק את החיבור לאינטרנט
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                  פנה לתמיכה אם הבעיה נמשכת
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => router.reload()} 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                נסה שוב
              </button>
              <button 
                onClick={() => router.push('/')} 
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                חזרה לאפליקציה
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
              <span className="text-xl font-light">רם</span>
            </div>
            <h2 className="text-lg font-light text-muted-foreground">
              מספרת רם-אל • ביטול הרשמה
            </h2>
          </div>

          {/* Content */}
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          © 2024 מספרת רם-אל • מערכת התראות אוטומטית
        </div>
      </div>
    </div>
  );
} 