import { useState } from 'react';
import { Button } from './ui/button';
import { Mail, Shield, ArrowRight, AlertCircle, LogOut } from 'lucide-react';

interface UserOTPAuthProps {
  onAuthenticated: (email: string, token: string) => void;
  className?: string;
}

export default function UserOTPAuth({ onAuthenticated, className = '' }: UserOTPAuthProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);

  const validateEmail = (email: string) => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsValidEmail(valid);
    return valid;
  };

  const handleEmailSubmit = async () => {
    if (!isValidEmail) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-user-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('otp');
      } else {
        setError(data.error || 'שגיאה בשליחת קוד אימות');
      }
    } catch (error) {
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (otp.length !== 6) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/verify-user-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onAuthenticated(email, data.token);
      } else {
        setError(data.error || 'קוד אימות שגוי');
      }
    } catch (error) {
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'email' && isValidEmail) {
        handleEmailSubmit();
      } else if (step === 'otp' && otp.length === 6) {
        handleOTPSubmit();
      }
    }
  };

  return (
    <div className={`max-w-sm mx-auto ${className}`}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">התחבר למערכת</h2>
        <p className="text-sm text-muted-foreground">
          {step === 'email' 
            ? 'הכנס את המייל שלך לקבלת קוד אימות' 
            : `נשלח קוד אימות ל-${email}`
          }
        </p>
      </div>

      {step === 'email' ? (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="כתובת המייל שלך"
              className={`w-full px-4 py-3 border rounded-lg text-center transition-colors ${
                email && !isValidEmail 
                  ? 'border-destructive focus:border-destructive' 
                  : 'border-border focus:border-primary'
              }`}
              dir="ltr"
              autoFocus
            />
            {email && !isValidEmail && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
            )}
          </div>

          {email && !isValidEmail && (
            <p className="text-xs text-destructive text-center">אנא הכנס כתובת מייל תקינה</p>
          )}

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleEmailSubmit}
            disabled={!isValidEmail || loading}
            className="w-full h-12 text-base"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                שולח קוד...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                שלח קוד אימות
              </div>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="הכנס קוד בן 6 ספרות"
              className="w-full px-4 py-3 border border-border focus:border-primary rounded-lg text-center text-lg tracking-widest"
              dir="ltr"
              autoFocus
            />
          </div>

          <div className="text-xs text-muted-foreground text-center">
            לא קיבלת קוד?{' '}
            <button
              onClick={() => {
                setStep('email');
                setOtp('');
                setError('');
              }}
              className="text-primary hover:underline"
            >
              שלח שוב
            </button>
          </div>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleOTPSubmit}
            disabled={otp.length !== 6 || loading}
            className="w-full h-12 text-base"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                מאמת...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                התחבר
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 