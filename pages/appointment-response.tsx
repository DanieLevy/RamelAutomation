import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Head from 'next/head';
import Link from 'next/link';

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

  const handleResponse = async (responseToken: string, userAction: string) => {
    try {
      const response = await fetch('/api/appointment-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response_token: responseToken,
          action: userAction,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setDetails(data);
        
        if (userAction === 'taken') {
          setMessage('התגובה נרשמה בהצלחה! המינוי שלך מוכן.');
        } else if (userAction === 'not_wanted') {
          setMessage('התגובה נרשמה בהצלחה! נמשיך לחפש תורים אחרים עבורך.');
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'אירעה שגיאה בעיבוד התגובה');
      }
    } catch (error) {
      console.error('Error handling response:', error);
      setStatus('error');
      setMessage('אירעה שגיאה בחיבור לשרת');
    }
  };

  const renderSuccessContent = () => {
    if (!details) return null;

    return (
      <div className="space-y-6">
        {/* Success Message */}
        <div className={`rounded-xl p-6 text-center ${
          details.action === 'taken' 
            ? 'bg-green-50 border-2 border-green-200' 
            : 'bg-blue-50 border-2 border-blue-200'
        }`}>
          <div className={`text-4xl mb-3 ${
            details.action === 'taken' ? 'text-green-600' : 'text-blue-600'
          }`}>
            {details.action === 'taken' ? '🎉' : '👍'}
          </div>
          <h2 className={`text-xl font-bold mb-2 ${
            details.action === 'taken' ? 'text-green-800' : 'text-blue-800'
          }`}>
            {details.action === 'taken' ? 'מעולה! מצאת תור!' : 'הבנו, נמשיך לחפש'}
          </h2>
          <p className={`${
            details.action === 'taken' ? 'text-green-700' : 'text-blue-700'
          }`}>
            {message}
          </p>
        </div>

        {/* Action-specific content */}
        {details.action === 'taken' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="text-green-800 flex items-center justify-center gap-2">
                <span>✅</span>
                המינוי שלך הושלם בהצלחה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">📋 מה קורה עכשיו?</h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>המינוי שלך למערכת נרשם ולא תקבל יותר התראות לאותו בקשה</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>אנא התקשר למספר הספר ליום ולשעה הרצויים לך</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>זכור להגיע בזמן למספרה!</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">🔍 רוצה לחפש תור נוסף?</h3>
                <p className="text-green-700 mb-3">
                  אם אתה רוצה לחפש תור נוסף לתאריך אחר, תוכל לעשות זאת באתר
                </p>
                <Link href="/">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    🏠 חזור לאתר לחיפוש חדש
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {details.action === 'not_wanted' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="text-blue-800 flex items-center justify-center gap-2">
                <span>🔍</span>
                נמשיך לחפש עבורך
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">📋 מה קורה עכשיו?</h3>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>התורים שהוצגו לך לא יופיעו יותר בהתראות הבאות</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>נמשיך לחפש תורים חדשים בתאריכים שביקשת</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>כשנמצא תורים חדשים, תקבל התראה חדשה</span>
                  </li>
                </ul>
              </div>

              {/* Show ignored appointments if available */}
              {details.totalIgnored && details.totalIgnored > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">🚫 תורים שלא יופיעו יותר</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      {details.totalIgnored} תורים הוסרו
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-600">
                    התורים הספציפיים שהוצגו לך במייל האחרון לא יופיעו יותר בחיפושים עתידיים
                  </p>
                </div>
              )}

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">⚙️ רוצה לשנות את החיפוש?</h3>
                <p className="text-blue-700 mb-3">
                  אם אתה רוצה לשנות את התאריכים או לבטל את ההתראות, תוכל לעשות זאת באתר
                </p>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                      🔍 חפש תאריכים אחרים
                    </Button>
                  </Link>
                  <Link href="/manage" className="flex-1">
                    <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                      ⚙️ נהל התראות
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>ℹ️</span>
              מידע שימושי
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• השירות פועל באופן אוטומטי ובודק כל 5 דקות אם יש תורים חדשים</p>
              <p>• אם יש לך שאלות או בעיות, תוכל לפנות אלינו דרך האתר</p>
              <p>• התראות יישלחו רק בשעות פעילות המספרה</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderErrorContent = () => (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="text-center">
        <CardTitle className="text-red-800 flex items-center justify-center gap-2">
          <span>❌</span>
          אירעה שגיאה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <p className="text-red-700 text-center mb-4">{message}</p>
          <div className="space-y-2">
            <p className="text-sm text-red-600">סיבות אפשריות:</p>
            <ul className="text-sm text-red-600 space-y-1">
              <li>• הקישור פג תוקף (קישורים תקפים ל-7 ימים)</li>
              <li>• כבר הגבת לבקשה הזו</li>
              <li>• שגיאה טכנית במערכת</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-2 flex-col sm:flex-row">
          <Link href="/" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              🏠 חזור לאתר הראשי
            </Button>
          </Link>
          <Link href="/manage" className="flex-1">
            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">
              ⚙️ נהל התראות
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const renderLoadingContent = () => (
    <Card className="border-gray-200">
      <CardContent className="pt-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">מעבד את התגובה שלך...</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Head>
        <title>תגובה למייל התראה - תור רמל</title>
        <meta name="description" content="עמוד תגובה למייל התראה על תורים פנויים" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" dir="rtl">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ר</span>
                </div>
                <span className="font-bold text-gray-900">תור רמל</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              תגובה למייל התראה
            </h1>
            <p className="text-gray-600">
              עמוד זה מציג את תוצאות התגובה שלך למייל ההתראה
            </p>
          </div>

          {status === 'loading' && renderLoadingContent()}
          {status === 'success' && renderSuccessContent()}
          {status === 'error' && renderErrorContent()}
        </main>

        {/* Footer */}
        <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600">
              <p>© 2024 תור רמל - מערכת התראות אוטומטיות לתורים</p>
              <p className="mt-1">
                <Link href="/" className="text-blue-600 hover:text-blue-800">
                  חזור לעמוד הראשי
                </Link>
                {' • '}
                <Link href="/manage" className="text-blue-600 hover:text-blue-800">
                  נהל התראות
                </Link>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 