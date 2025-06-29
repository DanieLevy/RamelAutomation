import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ManualSearch from '@/components/ManualSearch';
import OpportunityBanner from '@/components/OpportunityBanner';
import BottomNavigation from '@/components/BottomNavigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowLeft, Search } from 'lucide-react';

interface AppointmentResult {
  date: string;
  available: boolean | null;
  message: string;
  times: string[];
}

export default function ManualSearchPage() {
  const router = useRouter();
  const [results, setResults] = useState<AppointmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [searchMode, setSearchMode] = useState<'range' | 'closest'>('range');

  const checkAppointments = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const response = await fetch('/api/check-appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          mode: searchMode,
          days: days 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data && data.data.results) {
        setResults(data.data.results);
      } else {
        throw new Error(data.error || 'Failed to get results');
      }
    } catch (error: any) {
      console.error('Error checking appointments:', error);
      setResults([{
        date: '',
        available: null,
        message: `שגיאה: ${error.message}`,
        times: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const refreshOpportunities = async () => {
    // Trigger a refresh of cached results
    try {
      await fetch('/api/check-appointments', { method: 'POST' });
      // The OpportunityBanner will reload automatically
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh opportunities:', error);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      <Head>
        <title>חיפוש ידני | תורים לרם-אל</title>
        <meta name="description" content="חפש תורים פנויים במספרת רם-אל" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#FFFFFF" id="theme-color-meta" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page-container mx-auto px-4 py-5 max-w-screen-sm" dir="rtl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                aria-label="חזור"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Search className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">חיפוש ידני</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-muted-foreground text-sm">
            חפש תורים פנויים בתאריכים הקרובים
          </p>
        </header>



        {/* Manual Search Component */}
        <div className="space-y-4">
          <ManualSearch
            results={results}
            loading={loading}
            days={days}
            setDays={setDays}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            onCheckAppointments={checkAppointments}
          />
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
} 