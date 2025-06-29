import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Clock, ExternalLink, RefreshCw } from 'lucide-react';

interface AppointmentResult {
  date: string;
  available: boolean;
  times: string[];
  message: string;
}

interface OpportunityBannerProps {
  onRefresh?: () => void;
}

export default function OpportunityBanner({ onRefresh }: OpportunityBannerProps) {
  const [cachedResult, setCachedResult] = useState<any>(null);
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
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-xl p-4 mb-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-muted-foreground/20 rounded"></div>
              <div className="w-20 h-3 bg-muted-foreground/20 rounded"></div>
            </div>
          </div>
          <div className="w-16 h-8 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!cachedResult?.found || !cachedResult.preview?.length) {
    return (
      <div className="bg-muted/30 border border-border/30 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted-foreground/30 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                אין תורים זמינים כרגע
              </p>
              <p className="text-xs text-muted-foreground/70">
                עדכון אחרון: {cachedResult?.summary?.completedAt ? 
                  new Date(cachedResult.summary.completedAt).toLocaleTimeString('he-IL') : 'לא ידוע'}
              </p>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 px-3"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  const nextAppointment = cachedResult.preview[0];

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                {formatDisplayDateIsrael(nextAppointment.date)}
              </p>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                {nextAppointment.times.length} תורים
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
              <p className="text-xs text-green-600 dark:text-green-400 truncate">
                {nextAppointment.times.slice(0, 3).join(', ')}
                {nextAppointment.times.length > 3 && ` +${nextAppointment.times.length - 3}`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 px-2 text-green-700 hover:text-green-800 dark:text-green-300"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => window.open(generateBookingUrl(nextAppointment.date), '_blank')}
            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            <span className="text-xs">קבע</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 