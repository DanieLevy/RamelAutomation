import { useState } from 'react';
import Head from 'next/head';

interface AppointmentResult {
  date: string;
  available: boolean | null;
  message: string;
  times: string[];
}

interface ApiResponse {
  success: boolean;
  totalDaysChecked: number;
  availableAppointments: number;
  results: AppointmentResult[];
  summary: {
    hasAvailableAppointments: boolean;
    earliestAvailable: AppointmentResult | null;
    totalSlots: number;
  };
  performance: {
    totalTimeMs: number;
    averageRequestTimeMs: number;
    requestsPerSecond: number;
  };
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const checkAppointments = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`/api/check-appointments?days=${days}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check appointments');
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Ram-El Barbershop - Appointment Checker</title>
        <meta name="description" content="Check available appointments at Ram-El Barbershop" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ✂️ Ram-El Barbershop
            </h1>
            <p className="text-xl text-gray-600">
              מחפש תור? בדוק זמינות לתקופה הקרובה
            </p>
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <div className="flex items-center gap-2">
                <label htmlFor="days" className="text-sm font-medium text-gray-700">
                  בדוק תורים ל:
                </label>
                <select
                  id="days"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>7 ימים</option>
                  <option value={14}>14 ימים</option>
                  <option value={30}>30 ימים</option>
                  <option value={60}>60 ימים</option>
                </select>
              </div>
              
              <button
                onClick={checkAppointments}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    בודק...
                  </>
                ) : (
                  <>
                    🔍 בדוק תורים
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <div className="text-red-600 text-xl ml-3">❌</div>
                <div>
                  <h3 className="text-red-800 font-medium">שגיאה</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className={`rounded-lg p-6 ${results.summary.hasAvailableAppointments 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {results.summary.hasAvailableAppointments ? '🎉' : '😔'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {results.summary.hasAvailableAppointments 
                          ? `נמצאו ${results.availableAppointments} תאריכים זמינים!`
                          : 'לא נמצאו תורים זמינים'
                        }
                      </h2>
                                             <div className="text-gray-600 space-y-1">
                         <p>נבדקו {results.totalDaysChecked} ימים • סך הכל {results.summary.totalSlots} שעות זמינות</p>
                         <p className="text-sm">
                           ⚡ הושלם ב-{(results.performance.totalTimeMs / 1000).toFixed(1)} שניות
                           • {results.performance.requestsPerSecond} בקשות/שנייה
                         </p>
                       </div>
                    </div>
                  </div>

                  {results.summary.earliestAvailable && (
                    <div className="bg-white rounded-lg px-4 py-2 border">
                      <div className="text-sm text-gray-600">התור הקרוב ביותר:</div>
                      <div className="font-bold text-green-700">
                        {formatDate(results.summary.earliestAvailable.date)}
                      </div>
                      <div className="text-green-600">
                        {results.summary.earliestAvailable.times[0]}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Appointments */}
              {results.summary.hasAvailableAppointments && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-green-600 text-white px-6 py-3">
                    <h3 className="text-lg font-bold">תורים זמינים</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {results.results
                      .filter(result => result.available === true)
                      .map((result, index) => (
                        <div key={result.date} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">
                                {formatDate(result.date)}
                              </h4>
                              <p className="text-gray-600 text-sm">{result.date}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 mb-2">
                                {result.times.length} שעות זמינות
                              </div>
                              <div className="flex flex-wrap gap-2 justify-end">
                                {result.times.map((time, timeIndex) => (
                                  <span
                                    key={timeIndex}
                                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                                  >
                                    {time}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* All Results (Collapsed) */}
              <details className="bg-white rounded-lg shadow">
                <summary className="cursor-pointer px-6 py-3 bg-gray-50 font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  הצג את כל התוצאות ({results.totalDaysChecked} ימים)
                </summary>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {results.results.map((result, index) => (
                    <div key={result.date} className="p-4 text-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{result.date}</span>
                          <span className="text-gray-500 mr-2">
                            ({formatDate(result.date).split(',')[0]})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.available === true ? (
                            <>
                              <span className="text-green-600">✅</span>
                              <span className="text-green-700 font-medium">
                                {result.times.length} תורים
                              </span>
                            </>
                          ) : result.available === false ? (
                            <>
                              <span className="text-red-600">❌</span>
                              <span className="text-gray-600">לא זמין</span>
                            </>
                          ) : (
                            <>
                              <span className="text-yellow-600">⚠️</span>
                              <span className="text-gray-600">לא ברור</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-3">🔧 הגדרות</h3>
            <div className="text-blue-800 text-sm space-y-2">
              <p>• הכלי בודק אוטומטית את זמינות התורים באתר Ram-El</p>
              <p>• התוצאות מתעדכנות בזמן אמת</p>
              <p>• ניתן לבדוק עד 60 ימים קדימה</p>
              <p>• מומלץ לבדוק מספר פעמים ביום כי תורים משתחררים</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 