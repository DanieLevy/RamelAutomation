import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Calendar, CalendarDays, Mail } from 'lucide-react';
import InlineDatePicker from './InlineDatePicker';

interface NotificationSubscribeProps {
  defaultEmail?: string;
  onSubscriptionChange?: () => void;
}

interface ExistingSubscription {
  id: string;
  subscription_type: 'single' | 'range';
  target_date?: string;
  date_start?: string;
  date_end?: string;
}

export default function NotificationSubscribe({ 
  defaultEmail,
  onSubscriptionChange 
}: NotificationSubscribeProps) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [subscriptionType, setSubscriptionType] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [existingSubscriptions, setExistingSubscriptions] = useState<ExistingSubscription[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
      validateEmail(defaultEmail);
      loadExistingSubscriptions(defaultEmail);
    }
  }, [defaultEmail]);

  const loadExistingSubscriptions = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/user-subscriptions?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setExistingSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load existing subscriptions:', error);
    }
  };

  const validateEmail = (email: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsEmailValid(isValid);
    return isValid;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };

  const handleRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!email.trim()) {
      errors.email = 'נא להזין כתובת מייל';
    } else if (!isEmailValid) {
      errors.email = 'כתובת מייל לא תקינה';
    }
    
    if (subscriptionType === 'single' && !selectedDate) {
      errors.date = 'נא לבחור תאריך';
    }
    
    if (subscriptionType === 'range') {
      if (!startDate) {
        errors.dateRange = 'נא לבחור תאריך התחלה';
      } else if (!endDate) {
        errors.dateRange = 'נא לבחור תאריך סיום';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[NotificationSubscribe] Form submission started');
    console.log('[NotificationSubscribe] Form data:', {
      email: email.trim(),
      subscriptionType,
      selectedDate: selectedDate?.toISOString(),
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });
    
    if (!validateForm()) {
      console.log('[NotificationSubscribe] Form validation failed:', validationErrors);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const requestBody: any = {
        email: email.trim(),
        subscriptionType
      };

      if (subscriptionType === 'single') {
        // Format date to YYYY-MM-DD in local timezone
        const year = selectedDate!.getFullYear();
        const month = String(selectedDate!.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate!.getDate()).padStart(2, '0');
        requestBody.targetDate = `${year}-${month}-${day}`;
      } else {
        // Format dates to YYYY-MM-DD in local timezone
        const startYear = startDate!.getFullYear();
        const startMonth = String(startDate!.getMonth() + 1).padStart(2, '0');
        const startDay = String(startDate!.getDate()).padStart(2, '0');
        requestBody.dateStart = `${startYear}-${startMonth}-${startDay}`;
        
        const endYear = endDate!.getFullYear();
        const endMonth = String(endDate!.getMonth() + 1).padStart(2, '0');
        const endDay = String(endDate!.getDate()).padStart(2, '0');
        requestBody.dateEnd = `${endYear}-${endMonth}-${endDay}`;
      }

      console.log('[NotificationSubscribe] Sending request to /api/notify-request');
      console.log('[NotificationSubscribe] Request body:', requestBody);

      const response = await fetch('/api/notify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('[NotificationSubscribe] Response status:', response.status);
      console.log('[NotificationSubscribe] Response headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length')
      });

      const data = await response.json();
      console.log('[NotificationSubscribe] Response data:', data);

      if (response.ok && data.success) {
        console.log('[NotificationSubscribe] Subscription successful');
        setMessage('✅ ' + data.message);
        
        // Reset form
        setSelectedDate(null);
        setStartDate(null);
        setEndDate(null);
        
        // Notify parent component
        if (onSubscriptionChange) {
          onSubscriptionChange();
        }
        
        // Reload subscriptions
        if (email) {
          loadExistingSubscriptions(email);
        }
      } else {
        console.error('[NotificationSubscribe] Subscription failed:', {
          status: response.status,
          error: data.error,
          details: data.details,
          field: data.field
        });
        
        // Provide more detailed error message
        let errorMessage = data.error || 'שגיאה בהרשמה';
        if (data.details) {
          console.error('[NotificationSubscribe] Error details:', data.details);
        }
        setMessage('❌ ' + errorMessage);
      }
    } catch (error) {
      console.error('[NotificationSubscribe] Submit error:', error);
      console.error('[NotificationSubscribe] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setMessage('❌ שגיאת מערכת. נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  // Convert existing subscriptions to date strings for the date picker
  const getExistingDates = (): string[] => {
    const dates: string[] = [];
    existingSubscriptions.forEach(sub => {
      if (sub.subscription_type === 'single' && sub.target_date) {
        dates.push(sub.target_date);
      } else if (sub.subscription_type === 'range' && sub.date_start && sub.date_end) {
        // Add all dates in the range
        const start = new Date(sub.date_start);
        const end = new Date(sub.date_end);
        const current = new Date(start);
        
        while (current <= end) {
          const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
          dates.push(dateStr);
          current.setDate(current.getDate() + 1);
        }
      }
    });
    return dates;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-6" dir="rtl">
        {/* Email Input - Only show if no defaultEmail */}
        {!defaultEmail && (
          <div className="space-y-2">
            <label htmlFor="email-input" className="block text-sm font-medium text-right">
              כתובת מייל
            </label>
            <div className="relative">
              <input
                id="email-input"
                type="email"
                name="email"
                value={email}
                onChange={e => handleEmailChange(e.target.value)}
                placeholder="example@gmail.com"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 bg-background ${
                  email && !isEmailValid ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                }`}
                required
                dir="ltr"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {email && !isEmailValid && (
              <span className="text-xs text-destructive block text-right">
                כתובת מייל לא תקינה
              </span>
            )}
            {validationErrors.email && !email && (
              <span className="text-xs text-destructive block text-right">
                {validationErrors.email}
              </span>
            )}
          </div>
        )}

        {/* Subscription Type Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">בחר סוג חיפוש</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSubscriptionType('single')}
              className={`p-4 rounded-xl border text-center transition-all ${
                subscriptionType === 'single' 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border hover:border-border/60 hover:bg-muted/30'
              }`}
            >
              <Calendar className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">תאריך בודד</div>
              <div className="text-xs text-muted-foreground mt-1">חיפוש תור בתאריך ספציפי</div>
            </button>
            
            <button
              type="button"
              onClick={() => setSubscriptionType('range')}
              className={`p-4 rounded-xl border text-center transition-all ${
                subscriptionType === 'range' 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border hover:border-border/60 hover:bg-muted/30'
              }`}
            >
              <CalendarDays className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">טווח תאריכים</div>
              <div className="text-xs text-muted-foreground mt-1">חיפוש בטווח של עד 30 יום</div>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {subscriptionType === 'single' ? 'בחר תאריך' : 'בחר טווח תאריכים'}
          </h3>
          
          <div className="bg-muted/30 rounded-xl p-4">
            <InlineDatePicker
              mode={subscriptionType === 'single' ? 'single' : 'range'}
              onDateSelect={subscriptionType === 'single' ? setSelectedDate : undefined}
              onRangeSelect={subscriptionType === 'range' ? handleRangeChange : undefined}
              selectedDate={selectedDate}
              selectedRange={subscriptionType === 'range' ? { from: startDate, to: endDate } : undefined}
              disablePast={true}
              disableDays={['Monday', 'Saturday']}
              maxRange={30}
              existingDates={getExistingDates()}
            />
            
            {/* Clear button */}
            {((subscriptionType === 'single' && selectedDate) || 
              (subscriptionType === 'range' && (startDate || endDate))) && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(null);
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  נקה בחירה
                </button>
              </div>
            )}
          </div>
          {(validationErrors.date || validationErrors.dateRange) && (
            <span className="text-xs text-destructive block text-right mt-2">
              {validationErrors.date || validationErrors.dateRange}
            </span>
          )}
        </div>

        {/* Summary */}
        {((subscriptionType === 'single' && selectedDate) || 
          (subscriptionType === 'range' && startDate && endDate)) && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium mb-2">סיכום ההרשמה:</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              {subscriptionType === 'single' ? (
                <p>
                  תאריך: <span className="font-medium text-foreground">
                    {selectedDate?.toLocaleDateString('he-IL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </p>
              ) : (
                <>
                  <p>
                    מתאריך: <span className="font-medium text-foreground">
                      {startDate?.toLocaleDateString('he-IL')}
                    </span>
                  </p>
                  <p>
                    עד תאריך: <span className="font-medium text-foreground">
                      {endDate?.toLocaleDateString('he-IL')}
                    </span>
                  </p>
                </>
              )}
              <p className="mt-2 text-xs">
                כשיימצאו תורים פנויים, תקבל מייל עם כל האפשרויות הזמינות
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={loading || !isEmailValid || 
            (subscriptionType === 'single' && !selectedDate) ||
            (subscriptionType === 'range' && (!startDate || !endDate))
          }
          className="w-full"
        >
          {loading ? 'נרשם...' : 'הרשם להתראות'}
        </Button>

        {/* Status Message */}
        {message && (
          <div className={`text-sm text-center p-3 rounded-lg ${
            message.startsWith('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
            message.startsWith('❌') ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 
            'bg-muted'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
} 