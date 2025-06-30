import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ManualSearch from '@/components/ManualSearch';
import { useAuth } from '@/contexts/AuthContext';

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
  const { userEmail } = useAuth();

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
    <Layout title="חיפוש ידני | תורים לרם-אל" description="חפש תורים פנויים במספרת רם-אל">
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
    </Layout>
  );
} 