import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from './ui/button';

interface InlineDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  mode?: 'single' | 'range';
  startDate?: Date;
  endDate?: Date;
  onRangeChange?: (start: Date, end: Date) => void;
  className?: string;
}

export default function InlineDatePicker({ 
  value, 
  onChange, 
  mode = 'single',
  startDate,
  endDate,
  onRangeChange,
  className = ''
}: InlineDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null, end: Date | null }>({
    start: startDate || null,
    end: endDate || null
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (mode === 'single') {
      onChange(date);
    } else {
      // Range mode
      if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
        // Start new range
        setSelectedRange({ start: date, end: null });
      } else if (selectedRange.start && !selectedRange.end) {
        // Complete range
        const start = selectedRange.start;
        const end = date;
        if (start <= end) {
          setSelectedRange({ start, end });
          onRangeChange?.(start, end);
        } else {
          setSelectedRange({ start: end, end: start });
          onRangeChange?.(end, start);
        }
      }
    }
  };

  const isDateSelected = (date: Date) => {
    if (mode === 'single') {
      return value && date.toDateString() === value.toDateString();
    } else {
      if (!selectedRange.start) return false;
      if (selectedRange.start && !selectedRange.end) {
        return date.toDateString() === selectedRange.start.toDateString();
      }
      if (selectedRange.start && selectedRange.end) {
        return date >= selectedRange.start && date <= selectedRange.end;
      }
    }
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (mode !== 'range' || !selectedRange.start || !selectedRange.end) return false;
    return date > selectedRange.start && date < selectedRange.end;
  };

  const isDateRangeStart = (date: Date) => {
    return mode === 'range' && selectedRange.start && date.toDateString() === selectedRange.start.toDateString();
  };

  const isDateRangeEnd = (date: Date) => {
    return mode === 'range' && selectedRange.end && date.toDateString() === selectedRange.end.toDateString();
  };

  const isPastDate = (date: Date) => {
    return date < today;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={`bg-background border border-border rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-8"></div>;
          }

          const selected = isDateSelected(date);
          const inRange = isDateInRange(date);
          const rangeStart = isDateRangeStart(date);
          const rangeEnd = isDateRangeEnd(date);
          const past = isPastDate(date);

          return (
            <button
              key={index}
              onClick={() => !past && handleDateClick(date)}
              disabled={past}
              className={`
                h-8 text-xs font-medium rounded-md transition-colors relative
                ${past 
                  ? 'text-muted-foreground/50 cursor-not-allowed' 
                  : 'hover:bg-muted/60 cursor-pointer'
                }
                ${selected && mode === 'single' 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : ''
                }
                ${rangeStart || rangeEnd
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : ''
                }
                ${inRange 
                  ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                  : ''
                }
              `}
            >
              {date.getDate()}
              {date.toDateString() === today.toDateString() && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full opacity-60"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Range info */}
      {mode === 'range' && selectedRange.start && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {selectedRange.end ? (
              <>
                נבחר: {selectedRange.start.toLocaleDateString('he-IL')} - {selectedRange.end.toLocaleDateString('he-IL')}
                <div className="text-[10px] mt-1">
                  {Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} ימים
                </div>
              </>
            ) : (
              <>בחר תאריך סיום</>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 