import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker, DateRangePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';

interface NotificationSubscribeProps {
  notifyEmail: string;
  setNotifyEmail: (email: string) => void;
  notifyType: 'single' | 'range';
  setNotifyType: (type: 'single' | 'range') => void;
  notifyDate: Date | undefined;
  setNotifyDate: (date: Date | undefined) => void;
  notifyDateRange: {from?: Date, to?: Date};
  setNotifyDateRange: (range: {from?: Date, to?: Date}) => void;
  notifyLoading: boolean;
  notifyStatus: string | null;
  onSubmit: (e: React.FormEvent) => void;
  subscribedEmail?: string;
}

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function NotificationSubscribe({
  notifyEmail,
  setNotifyEmail,
  notifyType,
  setNotifyType,
  notifyDate,
  setNotifyDate,
  notifyDateRange,
  setNotifyDateRange,
  notifyLoading,
  notifyStatus,
  onSubmit,
  subscribedEmail
}: NotificationSubscribeProps) {
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let emails: any = [];
      try {
        emails = JSON.parse(localStorage.getItem('ramel_saved_emails') || '[]');
      } catch {
        emails = [];
      }
      setSavedEmails(Array.isArray(emails) ? emails : []);
    }
  }, []);

  const saveEmail = (email: string) => {
    if (!email) return;
    setSavedEmails(prev => {
      if (prev.includes(email)) return prev;
      const updated = [email, ...prev].slice(0, 10);
      localStorage.setItem('ramel_saved_emails', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (subscribedEmail && !savedEmails.includes(subscribedEmail)) {
      saveEmail(subscribedEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribedEmail]);

  const removeEmail = (email: string) => {
    setSavedEmails(prev => {
      const updated = prev.filter(e => e !== email);
      localStorage.setItem('ramel_saved_emails', JSON.stringify(updated));
      return updated;
    });
    if (notifyEmail === email) setNotifyEmail('');
  };

  const handleBadgeClick = (email: string) => {
    setNotifyEmail(email);
    setIsEmailValid(emailRegex.test(email));
  };

  const handleEmailChange = (email: string) => {
    setNotifyEmail(email);
    setIsEmailValid(emailRegex.test(email));
  };

  const handleSingleDateChange = (date: Date | undefined) => {
    setNotifyDate(date);
  };

  const handleDateRangeChange = (range: {from?: Date, to?: Date}) => {
    setNotifyDateRange(range);
  };

  return (
    <Card className="mb-6 overflow-hidden shadow-xl rounded-2xl border-0 backdrop-blur-sm bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
      <CardHeader className="pt-6">
        <CardTitle className="text-right text-xl font-bold">
          🔔 קבל התראה כשמתפנה תור
        </CardTitle>
        <CardDescription className="text-right">
          נעדכן אותך ברגע שמתפנה תור המתאים לך 📱
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="stack-sm" dir="rtl">
          <div className="form-group">
            <label htmlFor="email-input" className="block text-sm font-medium text-right mb-1">
              כתובת המייל שלך
            </label>
            <div className="relative">
              <input
                id="email-input"
                type="email"
                name="email"
                value={notifyEmail}
                onChange={e => handleEmailChange(e.target.value)}
                placeholder="example@gmail.com"
                className={`w-full input-modern pr-10 border-primary/20 focus:border-primary focus:ring-primary/20 bg-background/50 backdrop-blur-sm ${
                  notifyEmail && !isEmailValid ? 'border-destructive focus:border-destructive' : ''
                }`}
                required
                dir="ltr"
              />
              {notifyEmail && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {isEmailValid ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  )}
                </span>
              )}
            </div>
            {notifyEmail && !isEmailValid && (
              <span className="text-xs text-destructive block text-right mt-1">
                כתובת מייל לא תקינה
              </span>
            )}
            {isEmailValid && (
              <span className="text-xs text-muted-foreground block text-right mt-1">
                נשלח התראה כשמתפנה תור ⚡
              </span>
            )}
          </div>
          {savedEmails.length > 0 && (
            <div className="flex flex-wrap gap-2 min-h-[32px] w-full justify-start flex-row-reverse items-center" dir="ltr">
              {savedEmails.map(email => (
                <Badge
                  key={email}
                  variant={notifyEmail === email ? 'secondary' : 'default'}
                  className="cursor-pointer group pr-1.5"
                  title={notifyEmail === email ? 'נבחר' : 'השתמש במייל זה'}
                  onClick={() => handleBadgeClick(email)}
                  tabIndex={0}
                  aria-label={`השתמש במייל ${email}`}
                >
                  <span className="select-none">{email}</span>
                  <button
                    type="button"
                    aria-label="הסר מייל זה"
                    title="הסר מייל זה"
                    className="ml-1 text-base font-bold text-muted-foreground hover:text-destructive focus:text-destructive focus:bg-destructive/10 hover:bg-destructive/10 rounded-full px-1 py-0.5 transition-colors duration-150"
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', minWidth: 24, minHeight: 24, lineHeight: '20px' }}
                    onClick={e => { e.stopPropagation(); removeEmail(email); }}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="mt-4">
            <label className="block text-sm font-medium text-right mb-2">
              איך אתה רוצה לחפש?
            </label>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant={notifyType === 'single' ? "default" : "outline"}
                className={`flex-1 rounded-xl border-primary/30 ${notifyType === 'single' ? 'bg-primary text-primary-foreground' : 'text-primary hover:text-primary hover:bg-primary/10'}`}
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
                className={`flex-1 rounded-xl border-primary/30 ${notifyType === 'range' ? 'bg-primary text-primary-foreground' : 'text-primary hover:text-primary hover:bg-primary/10'}`}
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
          <div className="mt-3">
            <label className="block text-sm font-medium text-right mb-2">
              {notifyType === 'single' ? 'באיזה תאריך אתה זמין?' : 'באיזה טווח תאריכים אתה זמין?'}
            </label>
            <div className="flex items-center gap-2">
              {notifyType === 'single' ? (
                <>
                  <DatePicker 
                    date={notifyDate}
                    onDateChange={handleSingleDateChange}
                    placeholder="בחר תאריך"
                    autoClose={true}
                  />
                  {notifyDate && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      title="נקה בחירה"
                      aria-label="נקה בחירה"
                      onClick={() => setNotifyDate(undefined)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <DateRangePicker
                    dateRange={notifyDateRange}
                    onDateRangeChange={handleDateRangeChange}
                    placeholder="בחר טווח תאריכים"
                  />
                  {(notifyDateRange.from || notifyDateRange.to) && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      title="נקה בחירה"
                      aria-label="נקה בחירה"
                      onClick={() => setNotifyDateRange({})}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                  )}
                </>
              )}
            </div>
            {notifyDateRange.from && notifyDateRange.to && (
              <div className="flex items-center bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 text-primary">
                  <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z"></path>
                  <path d="M12 8v4l3 3"></path>
                </svg>
                <span className="text-xs text-primary/80">
                  חיפוש חכם - המערכת מאתרת מועד בטווח שבחרת
                </span>
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={notifyLoading || !isEmailValid}
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
          {notifyStatus && (
            <div className={`text-sm text-center mt-3 p-3 rounded-xl backdrop-blur-sm ${notifyStatus.startsWith('✓') ? 'bg-secondary/10 text-foreground border border-secondary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
              {notifyStatus}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-primary/10 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z"></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
          ההתראות ימשיכו להישלח עד לקביעת תור
        </div>
      </CardFooter>
    </Card>
  );
} 