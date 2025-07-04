import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Clock, ExternalLink, RefreshCw, Loader2, Search } from 'lucide-react';

interface AppointmentResult {
  date: string;
  available: boolean;
  times: string[];
  message?: string;
}

interface CachedResult {
  found?: boolean;
  count?: number;
  preview?: AppointmentResult[];
  results?: AppointmentResult[];
  summary?: {
    found?: boolean;
    hasAvailable?: boolean;
    nearestDate?: string;
    nearestTimes?: string[];
    message?: string;
  };
  meta?: {
    updatedAt?: string;
    cacheAge?: number;
  };
}

interface OpportunityBannerProps {
  onRefresh?: () => void;
}

export default function OpportunityBanner({ onRefresh }: OpportunityBannerProps) {
  const [cachedResult, setCachedResult] = useState<CachedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCachedResults();
  }, []);

  const loadCachedResults = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cached-results');
      if (response.ok) {
        const data = await response.json();
        console.log('OpportunityBanner: Loaded cached data:', data);
        setCachedResult(data);
      }
    } catch (error) {
      console.error('Failed to load cached results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDateIsrael = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getDayNameHebrew = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      weekday: 'long'
    }).format(date);
  };

  const formatHebrewDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const generateBookingUrl = (dateStr: string): string => {
    const baseUrl = 'https://mytor.co.il/home.php';
    const params = new URLSearchParams({
      i: 'cmFtZWwzMw==',
      s: 'MjY1',
      mm: 'y',
      lang: 'he',
      datef: dateStr,
      signup: 'הצג'
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const refreshOpportunities = async () => {
    setIsRefreshing(true);
    console.log('🔄 Starting manual refresh...');
    try {
      const response = await fetch('/api/check-appointments', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          mode: 'range',
          days: 30
        })
      });
      
      const data = await response.json();
      console.log('📊 Manual refresh response:', data);
      
      // Small delay to ensure cache is written
      setTimeout(() => {
        console.log('🔄 Reloading page...');
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    );
  }

  if (!cachedResult) {
    return null;
  }

  // Extract appointment data based on response structure
  const appointments = cachedResult.results || cachedResult.preview || [];
  const hasAppointments = cachedResult.found || cachedResult.summary?.hasAvailable || appointments.length > 0;
  
  if (!hasAppointments) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800">
          לא נמצאו תורים זמינים ב-30 הימים הקרובים
        </p>
      </div>
    );
  }

  // Get the nearest appointment (first in sorted array)
  const nearestAppointment = appointments[0];
  const totalAvailable = cachedResult.count || appointments.length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6"
    >
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <Calendar className="ml-2" size={28} />
          תורים זמינים!
        </h2>
        
        {nearestAppointment && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
            <p className="text-white font-semibold text-lg mb-2">
              התור הקרוב ביותר:
            </p>
            <div className="flex items-center gap-3 text-white">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {getDayNameHebrew(nearestAppointment.date)}, {formatHebrewDate(nearestAppointment.date)}
              </span>
            </div>
            {nearestAppointment.times && nearestAppointment.times.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {nearestAppointment.times.slice(0, 4).map((time: string) => (
                  <span key={time} className="bg-white/30 px-3 py-1 rounded-full text-sm">
                    {time}
                  </span>
                ))}
                {nearestAppointment.times.length > 4 && (
                  <span className="bg-white/30 px-3 py-1 rounded-full text-sm">
                    +{nearestAppointment.times.length - 4}{' '}נוספים
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/90 text-sm">
              סה&quot;כ {totalAvailable} תורים זמינים ב-30 הימים הקרובים
            </p>
            {cachedResult.meta?.updatedAt && (
              <p className="text-white/70 text-xs mt-1">
                עודכן {new Date(cachedResult.meta.updatedAt).toLocaleTimeString('he-IL')}
              </p>
            )}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={refreshOpportunities}
              disabled={isRefreshing}
              className="flex-1 sm:flex-initial bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full transition duration-300 flex items-center justify-center backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="רענן תורים זמינים"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="animate-spin ml-2" size={18} />
                  מרענן...
                </>
              ) : (
                <>
                  <RefreshCw className="ml-2" size={18} />
                  רענן
                </>
              )}
            </button>
            
            <Link 
              href="/manual-search" 
              className="flex-1 sm:flex-initial bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-full transition duration-300 flex items-center justify-center"
            >
              <Search className="ml-2" size={18} />
              חיפוש מתקדם
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 