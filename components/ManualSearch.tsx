import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Share2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface AppointmentResult {
  date: string;
  available: boolean | null;
  message: string;
  times: string[];
}

interface ManualSearchProps {
  searchMode: 'range' | 'closest';
  setSearchMode: (mode: 'range' | 'closest') => void;
  days: number;
  setDays: (days: number) => void;
  loading: boolean;
  results: AppointmentResult[];
  onCheckAppointments: () => void;
  onShare: () => void;
  formatDisplayDateIsrael: (dateStr: string) => string;
  getDayNameHebrew: (dateStr: string) => string;
  formatTimeIsrael: (time: string) => string;
  generateBookingUrl: (dateStr: string) => string;
}

export default function ManualSearch({
  searchMode,
  setSearchMode,
  days,
  setDays,
  loading,
  results,
  onCheckAppointments,
  onShare,
  formatDisplayDateIsrael,
  getDayNameHebrew,
  formatTimeIsrael,
  generateBookingUrl
}: ManualSearchProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  return (
    <>
      {/* Search Controls */}
      <Card className="mb-6 overflow-hidden shadow-xl rounded-2xl border-0 backdrop-blur-sm bg-gradient-to-br from-background via-muted/5 to-secondary/5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent"></div>
        <CardHeader className="pt-6">
          <CardTitle className="text-right text-xl font-bold">
            🔍 חיפוש תורים זמינים
          </CardTitle>
          <CardDescription className="text-right">
            מצא תור פנוי בזמן אמת 🎯
          </CardDescription>
        </CardHeader>
        <CardContent className="stack-sm">
          <div className="flex gap-2">
            <Button
              variant={searchMode === 'closest' ? 'default' : 'outline'}
              onClick={() => setSearchMode('closest')}
              className={`flex-1 rounded-xl ${searchMode === 'closest' ? 'bg-primary text-primary-foreground' : 'border-primary/30 text-primary hover:text-primary hover:bg-primary/10'}`}
            >
              הקרוב ביותר
            </Button>
            <Button
              variant={searchMode === 'range' ? 'default' : 'outline'}
              onClick={() => setSearchMode('range')}
              className={`flex-1 rounded-xl ${searchMode === 'range' ? 'bg-primary text-primary-foreground' : 'border-primary/30 text-primary hover:text-primary hover:bg-primary/10'}`}
            >
              טווח ימים
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center mt-2 px-3 py-1 rounded-full bg-muted/20">
            {searchMode === 'range' 
              ? `נבדק ${days} ימים קדימה (כולל חגים וסופי השבוע)`
              : 'מחפש את התור הזמין הקרוב ביותר'}
          </div>
          
          {searchMode === 'range' && (
            <Select value={days.toString()} onValueChange={value => setDays(parseInt(value))}>
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder="בחר מספר ימים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 ימים</SelectItem>
                <SelectItem value="7">7 ימים</SelectItem>
                <SelectItem value="14">14 ימים</SelectItem>
                <SelectItem value="21">21 ימים</SelectItem>
                <SelectItem value="30">30 ימים</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={onCheckAppointments}
            disabled={loading}
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{searchMode === 'closest' ? 'מחפש תור...' : 'בודק תורים...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 ml-2" />
                <span>{searchMode === 'closest' ? 'חפש תור קרוב' : 'בדוק תורים'}</span>
              </div>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Search Results */}
      {results.length > 0 && (
        <Card className="mb-6 overflow-hidden shadow-xl rounded-2xl border-0 backdrop-blur-sm bg-gradient-to-br from-background to-primary/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-accent/80"></div>
          <CardHeader className="pb-2 pt-6">
            <div className="flex items-center justify-between">
              {results.filter(r => r.available === true).length > 0 && (
                <Button 
                  onClick={onShare}
                  size="sm"
                  variant="outline"
                  className="border-primary/30 text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
                >
                  <Share2 className="h-4 w-4 ml-1" />
                  שתף
                </Button>
              )}
              <CardTitle className="text-right text-lg font-bold">תוצאות חיפוש</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {results.filter(r => r.available === true).length > 0 ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 text-foreground border border-secondary/20 text-sm font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                  נמצאו {results.filter(r => r.available === true).length} תורים זמינים
                </div>
                
                {searchMode === 'closest' && results.filter(r => r.available === true).length > 0 ? (
                  // Closest mode - show only the first available appointment
                  <div className="flex flex-col items-center text-center gap-4 py-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="text-2xl font-bold text-primary leading-tight">
                      {formatDisplayDateIsrael(results[0].date)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {getDayNameHebrew(results[0].date)}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {results[0].times.map((time, timeIdx) => (
                        <Badge key={timeIdx} variant="outline" className="bg-secondary/10 text-secondary-foreground border border-secondary/10 px-2 py-0.5 text-[10px]">
                          {formatTimeIsrael(time)}
                        </Badge>
                      ))}
                    </div>
                    <button
                      onClick={() => window.open(generateBookingUrl(results[0].date), '_blank')}
                      className="w-full mt-2 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors shadow-lg"
                    >
                      🎯 קבע תור עכשיו
                    </button>
                  </div>
                ) : (
                  // Range mode - show collapsible days with minimal design
                  <div className="space-y-2">
                    {results.filter(r => r.available === true).map((result, idx) => {
                      const isExpanded = expandedDays.has(result.date);
                      return (
                        <div key={idx} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all duration-200">
                          {/* Collapsed View - Minimal Design */}
                          <div className="p-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => toggleDay(result.date)}
                                  className="p-1 rounded-lg hover:bg-muted/60 transition-colors"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </button>
                                <span className="text-[10px] bg-secondary/10 text-secondary-foreground px-1.5 py-0.5 rounded-full font-medium">
                                  {result.times.length}
                                </span>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-medium text-sm text-foreground flex items-center gap-1">
                                  {formatDisplayDateIsrael(result.date)}
                                  <button
                                    onClick={() => window.open(generateBookingUrl(result.date), '_blank')}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-[9px] font-medium transition-colors"
                                    title="קבע תור ישירות"
                                  >
                                    <ExternalLink className="w-2 h-2" />
                                    קבע
                                  </button>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {getDayNameHebrew(result.date)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Show all times when collapsed - minimal design */}
                            {!isExpanded && (
                              <div className="flex flex-wrap gap-1 justify-end mt-1.5 mb-0.5">
                                {result.times.map((time, timeIdx) => (
                                  <span key={timeIdx} className="px-1.5 py-0.5 rounded-sm bg-muted/40 text-muted-foreground text-[9px]">
                                    {formatTimeIsrael(time)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Expanded View */}
                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-border">
                              <div className="mt-3 mb-3">
                                <div className="grid grid-cols-4 gap-1">
                                  {result.times.map((time, timeIdx) => (
                                    <span key={timeIdx} className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary-foreground text-center text-[10px] font-medium hover:bg-secondary/20 transition-colors">
                                      {formatTimeIsrael(time)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <Button
                                onClick={() => window.open(generateBookingUrl(result.date), '_blank')}
                                size="sm"
                                className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                              >
                                קבע תור
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : results.some(r => r.available === null) ? (
              <div className="text-center py-8">
                <div className="text-destructive mb-2 text-lg font-medium">שגיאה בבדיקת התורים</div>
                <div className="text-sm text-muted-foreground">אנא נסה שוב מאוחר יותר</div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-primary mb-2 text-lg font-medium">לא נמצאו תורים פנויים</div>
                <div className="text-sm text-muted-foreground">נסה תאריכים אחרים או בדוק מאוחר יותר</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
} 