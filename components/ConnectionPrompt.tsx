import { useState } from 'react';
import { Button } from './ui/button';
import { Mail, AlertCircle } from 'lucide-react';

interface ConnectionPromptProps {
  onConnect: (email: string) => void;
  className?: string;
}

export default function ConnectionPrompt({ onConnect, className = '' }: ConnectionPromptProps) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateEmail = (email: string) => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsValid(valid);
    return valid;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setTempEmail(email);
    validateEmail(email);
  };

  const handleConnect = () => {
    if (isValid) {
      onConnect(tempEmail);
      setShowEmailInput(false);
      setTempEmail('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleConnect();
    }
  };

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="mb-4">
        <Mail className="w-16 h-16 mx-auto text-primary/60" />
      </div>
      <h2 className="text-xl font-bold mb-2">התחבר למערכת</h2>
      <p className="text-muted-foreground text-sm mb-6">
        התחבר עם המייל שלך כדי לנהל התראות ולעקוב אחר הסטטוס שלך
      </p>
      
      {!showEmailInput ? (
        <Button
          onClick={() => setShowEmailInput(true)}
          className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          size="lg"
        >
          <Mail className="w-5 h-5 ml-2" />
          התחבר עם מייל
        </Button>
      ) : (
        <div className="max-w-xs mx-auto space-y-4">
          <div className="relative">
            <input
              type="email"
              value={tempEmail}
              onChange={handleEmailChange}
              onKeyPress={handleKeyPress}
              placeholder="המייל שלך"
              className={`w-full px-4 py-3 border rounded-lg text-center transition-colors ${
                tempEmail && !isValid 
                  ? 'border-destructive focus:border-destructive' 
                  : 'border-border focus:border-primary'
              }`}
              dir="ltr"
              autoFocus
            />
            {tempEmail && !isValid && (
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
            )}
          </div>
          
          {tempEmail && !isValid && (
            <p className="text-xs text-destructive">אנא הכנס כתובת מייל תקינה</p>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleConnect}
              disabled={!isValid}
              className="flex-1 h-10"
            >
              התחבר
            </Button>
            <Button
              onClick={() => {
                setShowEmailInput(false);
                setTempEmail('');
                setIsValid(false);
              }}
              variant="outline"
              className="flex-1 h-10"
            >
              ביטול
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 