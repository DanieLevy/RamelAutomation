import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Head from 'next/head';

type ResponseStatus = 'loading' | 'success' | 'error' | 'invalid';

export default function AppointmentResponsePage() {
  const router = useRouter();
  const { token, action } = router.query;
  const [status, setStatus] = useState<ResponseStatus>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!token || !action) return;

    handleResponse(token as string, action as string);
  }, [token, action]);

  const handleResponse = async (responseToken: string, responseAction: string) => {
    try {
      setStatus('loading');
      
      const response = await fetch('/api/appointment-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response_token: responseToken,
          action: responseAction
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message);
        setDetails(data);
      } else {
        setStatus('error');
        setMessage(data.error || 'אירעה שגיאה בעיבוד התגובה');
      }
    } catch (error) {
      console.error('Response error:', error);
      setStatus('error');
      setMessage('אירעה שגיאה בחיבור לשרת');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return '⏳';
      case 'success':
        return details?.action === 'taken' ? '✅' : '📝';
      case 'error':
        return '❌';
      case 'invalid':
        return '⚠️';
      default:
        return '📧';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'מעבד את התגובה...';
      case 'success':
        return details?.action === 'taken' ? 'תור נקבע בהצלחה!' : 'התגובה נרשמה בהצלחה!';
      case 'error':
        return 'אירעה שגיאה';
      case 'invalid':
        return 'קישור לא תקין';
      default:
        return 'תגובה על תור';
    }
  };

  return (
    <>
      <Head>
        <title>תגובה על תור - Tor-RamEl</title>
        <meta name="description" content="תגובה על התראת תור במספרת רם-אל" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Tor-RamEl</h1>
            <ThemeToggle />
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="text-6xl mb-4">{getStatusIcon()}</div>
                <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
                {status === 'loading' && (
                  <CardDescription>
                    אנא המתן בזמן שאנו מעבדים את התגובה שלך...
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="text-center">
                {status === 'loading' && (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                )}

                {status === 'success' && (
                  <div className="space-y-4">
                    <div className="text-lg">{message}</div>
                    
                    {details?.action === 'taken' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                        <div className="font-semibold mb-2">🎉 מעולה!</div>
                        <div>ההרשמה שלך להתראות הסתיימה. לא תקבל עוד התראות על תורים.</div>
                        {details.appointmentDate && (
                          <div className="mt-2 text-sm">
                            תאריך התור: {details.appointmentDate}
                          </div>
                        )}
                      </div>
                    )}

                    {details?.action === 'not_wanted' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
                        <div className="font-semibold mb-2">📝 התגובה נרשמה</div>
                        <div>נמשיך לחפש תורים אחרים עבורך ולא נתריע על התורים הספציפיים האלה שוב.</div>
                        {details.totalIgnored && (
                          <div className="mt-2 text-sm">
                            סה&quot;כ {details.totalIgnored} תורים נוספו לרשימת המתעלמים
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {status === 'error' && (
                  <div className="space-y-4">
                    <div className="text-lg text-destructive">{message}</div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                      <div>ייתכן שהקישור פג תוקף או שכבר השתמשת בו.</div>
                      <div className="mt-2">תוכל לנהל את ההתראות שלך בעמוד הניהול.</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-center mt-8">
                  <Button 
                    onClick={() => router.push('/')}
                    variant="outline"
                  >
                    🏠 חזור לעמוד הראשי
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/manage')}
                    variant="default"
                  >
                    🔧 ניהול התראות
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
} 