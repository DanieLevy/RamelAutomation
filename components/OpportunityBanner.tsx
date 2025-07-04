import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ExternalLink } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
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
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
          לא נמצאו תורים זמינים ב-30 הימים הקרובים
        </p>
      </div>
    );
  }

  // Get the nearest appointment (first in sorted array)
  const nearestAppointment = appointments[0];
  
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {getDayNameHebrew(nearestAppointment.date)}, {formatHebrewDate(nearestAppointment.date)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex flex-wrap gap-1">
                {nearestAppointment.times.slice(0, 3).map((time: string) => (
                  <span key={time} className="bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium">
                    {time}
                  </span>
                ))}
                {nearestAppointment.times.length > 3 && (
                  <span className="text-green-600 dark:text-green-400 text-xs">
                    +{nearestAppointment.times.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <a
          href={generateBookingUrl(nearestAppointment.date)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          קבע תור
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
} 