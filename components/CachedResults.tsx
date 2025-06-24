import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppointmentResult {
  date: string;
  available: boolean | null;
  message: string;
  times: string[];
}

interface CachedResultsProps {
  loading: boolean;
  cachedResult: any;
  onCheckAppointments: () => void;
  formatDisplayDateIsrael: (dateStr: string) => string;
  getDayNameHebrew: (dateStr: string) => string;
  formatTimeIsrael: (time: string) => string;
  generateBookingUrl: (dateStr: string) => string;
}

// Helper function to format Hebrew time ago
const formatHebrewTimeAgo = (minutes: number): string => {
  if (minutes < 1) return 'עכשיו';
  if (minutes === 1) return 'לפני דקה';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'לפני שעה';
  if (hours < 24) return `לפני ${hours} שעות`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'לפני יום';
  return `לפני ${days} ימים`;
};

// Helper function to get proper timestamp
const getLastUpdateInfo = (cachedResult: any) => {
  let lastUpdateTime: Date | null = null;
  let exactTimeStr = 'לא ידוע';
  
  // Try to get timestamp from the data structure
  if (cachedResult.timestamp) {
    // Direct timestamp from the processed result
    lastUpdateTime = new Date(cachedResult.timestamp);
  } else if (cachedResult.updated_at) {
    // Try to parse from updated_at (from database)
    lastUpdateTime = new Date(cachedResult.updated_at);
  } else if (cachedResult.summary?.completedAt) {
    // Try to get from completedAt in summary
    lastUpdateTime = new Date(cachedResult.summary.completedAt);
  }
  
  if (lastUpdateTime && !isNaN(lastUpdateTime.getTime())) {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    const timeAgo = formatHebrewTimeAgo(diffMinutes);
    exactTimeStr = lastUpdateTime.toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { timeAgo, exactTimeStr };
  }
  
  // If all else fails, use the updatedTimeAgo field directly if it exists
  if (cachedResult.updatedTimeAgo) {
    return { timeAgo: cachedResult.updatedTimeAgo, exactTimeStr: 'עודכן לאחרונה' };
  }
  
  return { timeAgo: 'לא ידוע', exactTimeStr };
};

export default function CachedResults({
  loading,
  cachedResult,
  onCheckAppointments,
  formatDisplayDateIsrael,
  getDayNameHebrew,
  formatTimeIsrael,
  generateBookingUrl
}: CachedResultsProps) {
  if (loading) {
    return (
      <Card className="mb-6 border border-border rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm bg-card">
        <CardContent className="p-0">
          <div>
            <div className="px-5 pt-4 pb-3 flex justify-between items-center">
              <div className="w-32 h-4 animate-pulse bg-muted rounded-full"></div>
              <div className="w-20 h-4 animate-pulse bg-muted rounded-full"></div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
            
            <div className="px-5 py-4">
              <div className="flex justify-center mb-4">
                <div className="w-40 h-6 animate-pulse bg-muted rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 animate-pulse bg-muted rounded-xl"></div>
                ))}
              </div>
              
              <div className="w-full h-12 animate-pulse bg-muted rounded-xl"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cachedResult && cachedResult.summary?.hasAvailable) {
    // Find the closest available appointment (first one chronologically)
    const availableAppts = cachedResult.results
      .filter((r: any) => r.available === true)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (!availableAppts || availableAppts.length === 0) return null;
    
    const closestAvailable = availableAppts[0];
    const { timeAgo, exactTimeStr } = getLastUpdateInfo(cachedResult);
    
    return (
      <Card className="mb-6 border border-border rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm bg-card">
        <CardContent className="p-0">
          <div>
            <div className="px-5 pt-4 pb-3 flex justify-between items-center">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  עדכון אחרון: {timeAgo}
                </div>
                <div className="text-[10px] text-muted-foreground/70">
                  {exactTimeStr}
                </div>
              </div>
              <span className="inline-flex items-center text-[10px] text-foreground font-medium bg-secondary/5 px-2 py-1 rounded-full border border-secondary/10">
                <span className="w-1 h-1 rounded-full bg-secondary ml-1 animate-pulse"></span>
                תור זמין
              </span>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
            
            <div className="px-5 py-4 text-center">
              <div className="mb-4">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatDisplayDateIsrael(closestAvailable.date)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getDayNameHebrew(closestAvailable.date)} • התור הקרוב ביותר
                </div>
              </div>
              
              <div className="px-5 py-4">
                <h3 className="text-md font-medium mb-4 text-center">
                  תור פנוי ב{getDayNameHebrew(closestAvailable.date)} {formatDisplayDateIsrael(closestAvailable.date)}
                </h3>
                
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {closestAvailable.times.slice(0, 6).map((time: string, timeIdx: number) => (
                    <div key={timeIdx} className="px-1.5 py-1 rounded-lg bg-secondary/10 border border-secondary/10 text-center text-[10px] font-medium hover:bg-secondary/15 transition-colors text-secondary-foreground">
                      {formatTimeIsrael(time)}
                    </div>
                  ))}
                  {closestAvailable.times.length > 6 && (
                    <div className="px-1.5 py-1 rounded-lg bg-muted/20 border border-muted/20 text-center text-[10px] text-muted-foreground flex items-center justify-center">
                      +{closestAvailable.times.length - 6}
                    </div>
                  )}
                </div>
                
                <a 
                  href={generateBookingUrl(closestAvailable.date)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                  קבע תור
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cachedResult) {
    const { timeAgo, exactTimeStr } = getLastUpdateInfo(cachedResult);

    return (
      <Card className="mb-6 border border-border rounded-2xl overflow-hidden shadow-md backdrop-blur-sm bg-card">
        <CardContent className="p-0">
          <div>
            <div className="px-5 pt-4 pb-3 flex justify-between items-center">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  עדכון אחרון: {timeAgo}
                </div>
                <div className="text-[10px] text-muted-foreground/70">
                  {exactTimeStr}
                </div>
              </div>
              <span className="inline-flex items-center text-[10px] text-muted-foreground font-medium bg-muted/70 px-2 py-1 rounded-full border border-border/50">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 ml-1"></span>
                אין תורים
              </span>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
            
            <div className="px-5 py-4 text-center">
              <div className="py-4 flex flex-col items-center">
                <CalendarIcon className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-lg font-medium text-muted-foreground mb-2">לא נמצאו תורים זמינים</p>
                <p className="text-sm text-muted-foreground mb-4">נסה שוב מאוחר יותר או השתמש בחיפוש ידני</p>
              </div>
              
              <Button
                onClick={onCheckAppointments}
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-muted"
              >
                בדוק שוב
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
} 