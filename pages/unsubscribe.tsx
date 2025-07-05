import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Home } from 'lucide-react';

export default function UnsubscribePage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/unsubscribe?token=${token}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          if (data.alreadyUnsubscribed) {
            setStatus('already');
            setMessage(data.message || 'ההרשמה כבר בוטלה');
          } else {
            setStatus('success');
            setMessage(data.message || 'ההרשמה בוטלה בהצלחה');
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'שגיאה בביטול ההרשמה');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage('שגיאת מערכת. אנא נסה שוב מאוחר יותר.');
      }
    };

    unsubscribe();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">מבטל הרשמה...</h2>
            <p className="text-muted-foreground">אנא המתן</p>
          </Card>
        );
      
      case 'success':
        return (
          <Card className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">ההרשמה בוטלה בהצלחה!</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground mb-6">
              לא תקבל יותר התראות למייל זה. תוכל להירשם שוב בכל עת.
            </p>
            <Button onClick={() => router.push('/')} className="mt-4">
              <Home className="ml-2 h-4 w-4" />
              חזרה לדף הבית
            </Button>
          </Card>
        );
      
      case 'already':
        return (
          <Card className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">ההרשמה כבר בוטלה</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground mb-6">
              ההרשמה שלך כבר בוטלה בעבר. אם תרצה, תוכל להירשם מחדש.
            </p>
            <Button onClick={() => router.push('/')} className="mt-4">
              <Home className="ml-2 h-4 w-4" />
              חזרה לדף הבית
            </Button>
          </Card>
        );
      
      case 'error':
        return (
          <Card className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">שגיאה</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="space-y-3">
              <Button onClick={() => router.reload()} variant="outline">
                נסה שוב
              </Button>
              <Button onClick={() => router.push('/')} className="ml-3">
                <Home className="ml-2 h-4 w-4" />
                חזרה לדף הבית
              </Button>
            </div>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (!token) {
    return (
      <Layout title="ביטול הרשמה | תורים לרם-אל" description="ביטול הרשמה להתראות">
        <Card className="p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">קישור לא תקין</h2>
          <p className="text-muted-foreground mb-6">
            לא נמצא טוקן ביטול. אנא ודא שהקישור שלחצת עליו תקין.
          </p>
          <Button onClick={() => router.push('/')} className="mt-4">
            <Home className="ml-2 h-4 w-4" />
            חזרה לדף הבית
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="ביטול הרשמה | תורים לרם-אל" description="ביטול הרשמה להתראות">
      <div className="max-w-md mx-auto">
        {renderContent()}
      </div>
    </Layout>
  );
} 
