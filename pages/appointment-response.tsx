import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface ResponseState {
  success: boolean;
  action?: 'taken' | 'not_wanted';
  message?: string;
  appointmentDate?: string;
  appointmentTimes?: string[];
  error?: string;
}

export default function AppointmentResponse() {
  const router = useRouter();
  const { token, action } = router.query;
  const [responseState, setResponseState] = useState<ResponseState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && action && ['taken', 'not_wanted'].includes(action as string)) {
      handleResponse(token as string, action as string);
    }
  }, [token, action]);

  const handleResponse = async (response_token: string, userAction: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/appointment-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response_token,
          action: userAction
        })
      });

      const data = await response.json();
      setResponseState(data);
    } catch (error) {
      setResponseState({
        success: false,
        error: 'Failed to process your response. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🎯 תור רם-אל
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              תגובה להתראת תור
            </p>
          </div>

          <Card className="p-8">
            {loading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">מעבד את התגובה שלך...</p>
              </div>
            )}

            {!loading && responseState && (
              <div className="text-center">
                {responseState.success ? (
                  <>
                    <div className="mb-6">
                      {responseState.action === 'taken' ? (
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">✅</span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">🔍</span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                      {responseState.action === 'taken' ? 'מעולה!' : 'הבנו!'}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      {responseState.message}
                    </p>

                    {responseState.appointmentDate && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          תאריך התור:
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {responseState.appointmentDate}
                        </p>
                        {responseState.appointmentTimes && responseState.appointmentTimes.length > 0 && (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 mb-2">
                              שעות זמינות:
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {responseState.appointmentTimes.join(', ')}
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {responseState.action === 'taken' && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                        <p className="text-green-800 dark:text-green-200 text-sm">
                          💡 <strong>זכור:</strong> עליך להזמין את התור באתר של המספרה. 
                          המערכת שלנו רק מוצאת תורים זמינים ומודיעה לך עליהם.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">❌</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                      שגיאה
                    </h2>
                    <p className="text-red-600 dark:text-red-400 mb-6">
                      {responseState.error || 'אירעה שגיאה בעיבוד התגובה'}
                    </p>
                  </>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => router.push('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    חזור לעמוד הראשי
                  </Button>
                  <Button 
                    onClick={() => router.push('/manage')}
                    variant="outline"
                  >
                    נהל התראות
                  </Button>
                </div>
              </div>
            )}

            {!loading && !responseState && (token || action) && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">❌</span>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  קישור לא תקין
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  הקישור שלחצת עליו אינו תקין או פג תוקפו.
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  חזור לעמוד הראשי
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 