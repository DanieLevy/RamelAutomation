import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Calendar, CalendarDays, Mail } from 'lucide-react';
import InlineDatePicker from './InlineDatePicker';

interface NotificationSubscribeProps {
  defaultEmail?: string;
  onSubscriptionChange?: () => void;
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

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
      validateEmail(defaultEmail);
    }
  }, [defaultEmail]);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('נא להזין כתובת מייל');
      return;
    }

    if (subscriptionType === 'single' && !selectedDate) {
      setMessage('נא לבחור תאריך');
      return;
    }

    if (subscriptionType === 'range' && (!startDate || !endDate)) {
      setMessage('נא לבחור טווח תאריכים');
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
        requestBody.targetDate = selectedDate!.toISOString().split('T')[0];
      } else {
        requestBody.dateStart = startDate!.toISOString().split('T')[0];
        requestBody.dateEnd = endDate!.toISOString().split('T')[0];
      }

      const response = await fetch('/api/notify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ ' + data.message);
        
        // Reset form
        setSelectedDate(null);
        setStartDate(null);
        setEndDate(null);
        
        // Notify parent component
        if (onSubscriptionChange) {
          onSubscriptionChange();
        }
      } else {
        setMessage('❌ ' + (data.error || 'שגיאה בהרשמה'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ שגיאת מערכת. נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
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
            />
          </div>
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