import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-badge status-active">פעיל</span>;
      case 'cancelled':
        return <span className="status-badge status-cancelled">בוטל על ידי המשתמש</span>;
      case 'expired':
        return <span className="status-badge status-expired">פג תוקף</span>;
      case 'max_reached':
        return <span className="status-badge status-max">הושלמו 6 התראות</span>;
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return (
          <div className="icon success">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'not_found':
      case 'error':
        return (
          <div className="icon error">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'already_cancelled':
      case 'expired':
      case 'max_reached':
        return (
          <div className="icon warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="icon info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="card animation">
          <div className="icon info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1>מעבד בקשה...</h1>
          <p>אנא המתן בזמן שאנו מעבדים את בקשת הביטול שלך.</p>
        </div>
      );
    }

    switch (status) {
      case 'success':
        return (
          <div className="card animation">
            {data && getStatusBadge('cancelled')}
            {getIcon()}
            <h1>הרשמה בוטלה בהצלחה!</h1>
            <p>ההרשמה שלך להתראות במספרת רם-אל בוטלה בהצלחה. לא תקבל עוד התראות על הכתובת הזו.</p>
            
            {data && (
              <div className="details-box">
                <p><strong>פרטי ההרשמה שבוטלה:</strong></p>
                <p>📧 כתובת מייל: {data.email}</p>
                <p>📅 {formatCriteria(data.criteria_type, data.criteria)}</p>
                <p>📊 התראות שנשלחו: {data.notification_count} מתוך 6</p>
                <p>📆 נוצר ב: {formatDate(data.created_at)}</p>
                <p>📨 התראה אחרונה: {data.last_notified ? formatDate(data.last_notified) : 'אף פעם'}</p>
                <p>🚫 בוטל היום: {new Date().toLocaleDateString('he-IL')}</p>
              </div>
            )}
            
            <p>תוכל לחזור ולהירשם להתראות בכל עת דרך האפליקציה.</p>
            <div>
              <button onClick={() => router.push('/')} className="button">רישום מחדש</button>
              <button onClick={() => router.push('/')} className="button secondary">חזרה לאפליקציה</button>
            </div>
          </div>
        );

      case 'already_cancelled':
        return (
          <div className="card animation">
            {data && getStatusBadge('cancelled')}
            {getIcon()}
            <h1>ההרשמה כבר בוטלה</h1>
            <p>ההרשמה שלך להתראות במספרת רם-אל כבר בוטלה בעבר על ידך.</p>
            
            {data && (
              <div className="details-box">
                <p><strong>פרטי ההרשמה:</strong></p>
                <p>📧 כתובת מייל: {data.email}</p>
                <p>📅 {formatCriteria(data.criteria_type, data.criteria)}</p>
                <p>📊 התראות שנשלחו: {data.notification_count} מתוך 6</p>
                <p>📆 נוצר ב: {formatDate(data.created_at)}</p>
                <p>📨 התראה אחרונה: {data.last_notified ? formatDate(data.last_notified) : 'אף פעם'}</p>
              </div>
            )}
            
            <p>אם תרצה לקבל התראות שוב, תוכל לעבור לאפליקציה ולהירשם מחדש.</p>
            <div>
              <button onClick={() => router.push('/')} className="button">רישום מחדש</button>
              <button onClick={() => router.push('/')} className="button secondary">חזרה לאפליקציה</button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="card animation">
            {data && getStatusBadge('expired')}
            {getIcon()}
            <h1>ההרשמה פגה</h1>
            <p>ההרשמה שלך להתראות פגה מאחר והתאריכים שביקשת כבר עברו.</p>
            
            {data && (
              <div className="details-box">
                <p><strong>פרטי ההרשמה שפגה:</strong></p>
                <p>📧 כתובת מייל: {data.email}</p>
                <p>📅 {formatCriteria(data.criteria_type, data.criteria)}</p>
                <p>📊 התראות שנשלחו: {data.notification_count} מתוך 6</p>
                <p>📆 נוצר ב: {formatDate(data.created_at)}</p>
                <p>📨 התראה אחרונה: {data.last_notified ? formatDate(data.last_notified) : 'אף פעם'}</p>
              </div>
            )}
            
            <p>תוכל לבצע הרשמה חדשה לתאריכים עתידיים באפליקציה.</p>
            <div>
              <button onClick={() => router.push('/')} className="button">רישום חדש</button>
              <button onClick={() => router.push('/')} className="button secondary">חזרה לאפליקציה</button>
            </div>
          </div>
        );

      case 'max_reached':
        return (
          <div className="card animation">
            {data && getStatusBadge('max_reached')}
            {getIcon()}
            <h1>הושלמו כל ההתראות</h1>
            <p>ההרשמה שלך להתראות הושלמה לאחר שנשלחו לך 6 התראות מקסימליות.</p>
            
            {data && (
              <div className="details-box">
                <p><strong>פרטי ההרשמה שהושלמה:</strong></p>
                <p>📧 כתובת מייל: {data.email}</p>
                <p>📅 {formatCriteria(data.criteria_type, data.criteria)}</p>
                <p>📊 התראות שנשלחו: {data.notification_count} מתוך 6 ✅</p>
                <p>📆 נוצר ב: {formatDate(data.created_at)}</p>
                <p>📨 התראה אחרונה: {data.last_notified ? formatDate(data.last_notified) : 'אף פעם'}</p>
              </div>
            )}
            
            <p>המערכת הפסיקה לשלוח התראות לאחר שהגיעה למספר המקסימלי. תוכל לבצע הרשמה חדשה אם תרצה.</p>
            <div>
              <button onClick={() => router.push('/')} className="button">רישום חדש</button>
              <button onClick={() => router.push('/')} className="button secondary">חזרה לאפליקציה</button>
            </div>
          </div>
        );

      case 'not_found':
        return (
          <div className="card animation">
            {getIcon()}
            <h1>הרשמה לא נמצאה</h1>
            <p>הקישור שלחצת עליו אינו תקף או שההרשמה כבר הוסרה מהמערכת.</p>
            <div className="details-box">
              <p><strong>סיבות אפשריות:</strong></p>
              <ul style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <li>הקישור פג תוקף</li>
                <li>ההרשמה כבר בוטלה בעבר</li>
                <li>הקישור לא הועתק כראוי</li>
              </ul>
            </div>
            <button onClick={() => router.push('/')} className="button">רישום מחדש לתורים</button>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="card animation">
            {getIcon()}
            <h1>שגיאת מערכת</h1>
            <p>אירעה שגיאה בעת ביטול ההרשמה. אנא נסה שוב מאוחר יותר.</p>
            <div className="details-box">
              <p><strong>מה אפשר לעשות:</strong></p>
              <ul style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <li>נסה לרענן את הדף</li>
                <li>בדוק את החיבור לאינטרנט</li>
                <li>פנה לתמיכה אם הבעיה נמשכת</li>
              </ul>
            </div>
            <div>
              <button onClick={() => router.reload()} className="button">נסה שוב</button>
              <button onClick={() => router.push('/')} className="button secondary">חזרה לאפליקציה</button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Ploni', 'Arial Hebrew', sans-serif;
          direction: rtl;
        }
        body {
          background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
          color: #111827;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          transition: all 0.3s ease;
          line-height: 1.6;
        }
        body.dark {
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          color: #f9fafb;
        }
        .container {
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          text-align: center;
        }
        .card {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
          border: 1px solid rgba(229, 231, 235, 0.8);
        }
        .dark .card {
          background-color: rgba(31, 41, 55, 0.95);
          border: 1px solid rgba(75, 85, 99, 0.8);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
        }
        h1 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
          font-weight: 700;
          color: #111827;
        }
        .dark h1 {
          color: #f9fafb;
        }
        p {
          margin-bottom: 1.5rem;
          line-height: 1.6;
          color: #4b5563;
          font-size: 1rem;
        }
        .dark p {
          color: #d1d5db;
        }
        .icon {
          margin-bottom: 1.5rem;
          width: 72px;
          height: 72px;
          margin-left: auto;
          margin-right: auto;
          opacity: 0.9;
        }
        .success {
          color: #10b981;
        }
        .error {
          color: #ef4444;
        }
        .warning {
          color: #f59e0b;
        }
        .info {
          color: #3b82f6;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #111827 0%, #374151 100%);
          color: white;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          margin: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-size: 0.9rem;
        }
        .dark .button {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
        }
        .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.15);
        }
        .button.secondary {
          background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
        }
        .dark .button.secondary {
          background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
        }
        .toggle-theme {
          position: fixed;
          top: 1rem;
          left: 1rem;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          cursor: pointer;
          color: #4b5563;
          font-size: 1.25rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dark .toggle-theme {
          background: rgba(31, 41, 55, 0.2);
          border-color: rgba(31, 41, 55, 0.3);
          color: #d1d5db;
        }
        .toggle-theme:hover {
          transform: scale(1.05);
        }
        .status-badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-active {
          background-color: #d1fae5;
          color: #065f46;
        }
        .dark .status-active {
          background-color: rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }
        .status-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .dark .status-cancelled {
          background-color: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }
        .status-expired {
          background-color: #fef3c7;
          color: #92400e;
        }
        .dark .status-expired {
          background-color: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
        }
        .status-max {
          background-color: #e0e7ff;
          color: #3730a3;
        }
        .dark .status-max {
          background-color: rgba(99, 102, 241, 0.2);
          color: #c7d2fe;
        }
        .details-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          text-align: right;
          font-size: 0.875rem;
        }
        .dark .details-box {
          background-color: #1e293b;
          border-color: #475569;
        }
        .animation {
          animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        @media (max-width: 640px) {
          .container {
            padding: 0 0.5rem;
          }
          .card {
            padding: 1.5rem;
            border-radius: 12px;
          }
          h1 {
            font-size: 1.5rem;
          }
          .button {
            display: block;
            width: 100%;
            margin: 0.5rem 0;
          }
          .toggle-theme {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
        }
        @media (max-width: 480px) {
          body {
            padding: 0.5rem;
          }
          .card {
            padding: 1.25rem;
          }
          h1 {
            font-size: 1.375rem;
          }
        }
      `}</style>
      
      <div className={darkMode ? 'dark' : ''}>
        <button 
          className="toggle-theme" 
          onClick={() => setDarkMode(!darkMode)}
          aria-label="החלף מצב תצוגה"
        >
          🌓
        </button>
        <div className="container">
          {renderContent()}
        </div>
      </div>
    </>
  );
} 