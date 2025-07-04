import { useState } from 'react';
import { useRouter } from 'next/router';

export default function TestEmails() {
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [email, setEmail] = useState('daniellofficial@gmail.com');
  const router = useRouter();

  const sendTestEmails = async () => {
    setSending(true);
    setResults([]);

    try {
      const response = await fetch('/api/test-email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'f1039cc377c4a66a8167e943defe23a7e687d13b8cf11a2be91761dc39500234'}`
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Failed to send test emails:', error);
      setResults([{
        name: 'Error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🎨 בדיקת תבניות אימייל מעוצבות מחדש
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              כתובת אימייל לבדיקה:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="your-email@example.com"
            />
          </div>

          <button
            onClick={sendTestEmails}
            disabled={sending || !email}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              sending || !email
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {sending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                שולח...
              </>
            ) : (
              '📧 שלח את כל תבניות האימייל'
            )}
          </button>

          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">תוצאות:</h2>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      result.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl ml-3">
                        {result.success ? '✅' : '❌'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{result.name}</p>
                        {result.success ? (
                          <p className="text-sm text-gray-600">נשלח בהצלחה</p>
                        ) : (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📱 טיפים לבדיקה:</h3>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>בדוק את האימיילים בטלפון הנייד</li>
              <li>ודא שהכפתורים עובדים</li>
              <li>בדוק שהעברית מוצגת נכון (RTL)</li>
              <li>ודא שהעיצוב נראה טוב בכל הגדלים</li>
            </ul>
          </div>

          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← חזור לדף הבית
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 