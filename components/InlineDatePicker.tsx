import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from './ui/button';

interface InlineDatePickerProps {
  // Legacy props (for backwards compatibility)
  value?: Date;
  onChange?: (date: Date) => void;
  startDate?: Date;
  endDate?: Date;
  onRangeChange?: (start: Date, end: Date) => void;
  
  // New props
  mode?: 'single' | 'range';
  onDateSelect?: (date: Date | null) => void;
  onRangeSelect?: (start: Date, end: Date) => void;
  selectedDate?: Date | null;
  selectedRange?: { from: Date | null; to: Date | null };
  disablePast?: boolean;
  disableDays?: string[]; // Array of day names to disable (e.g., ['Monday', 'Saturday'])
  maxRange?: number; // Maximum number of days for range selection
  className?: string;
}

export default function InlineDatePicker({ 
  // Legacy props
  value, 
  onChange,
  startDate,
  endDate,
  onRangeChange,
  
  // New props
  mode = 'single',
  onDateSelect,
  onRangeSelect,
  selectedDate,
  selectedRange,
  disablePast = false,
  disableDays = [],
  maxRange,
  className = ''
}: InlineDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [internalSelectedRange, setInternalSelectedRange] = useState<{ start: Date | null, end: Date | null }>({
    start: selectedRange?.from || startDate || null,
    end: selectedRange?.to || endDate || null
  });

  // Update internal range when props change
  useEffect(() => {
    if (selectedRange) {
      setInternalSelectedRange({
        start: selectedRange.from,
        end: selectedRange.to
      });
    }
  }, [selectedRange]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const englishDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  const isDateDisabled = (date: Date) => {
    // Check if date is in the past
    if (disablePast && date < today) {
      return true;
    }
    
    // Check if day of week is disabled
    if (disableDays.length > 0) {
      const dayName = englishDayNames[date.getDay()];
      if (disableDays.includes(dayName)) {
        return true;
      }
    }
    
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (mode === 'single') {
      // Use new callback if available, otherwise fallback to legacy
      if (onDateSelect) {
        onDateSelect(date);
      } else if (onChange) {
        onChange(date);
      }
    } else {
      // Range mode
      if (!internalSelectedRange.start || (internalSelectedRange.start && internalSelectedRange.end)) {
        // Start new range
        setInternalSelectedRange({ start: date, end: null });
      } else if (internalSelectedRange.start && !internalSelectedRange.end) {
        // Complete range
        const start = internalSelectedRange.start;
        const end = date;
        
        // Check max range if specified
        if (maxRange) {
          const daysDiff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > maxRange) {
            // Reset selection if exceeds max range
            setInternalSelectedRange({ start: date, end: null });
            return;
          }
        }
        
        if (start <= end) {
          setInternalSelectedRange({ start, end });
          // Use new callback if available, otherwise fallback to legacy
          if (onRangeSelect) {
            onRangeSelect(start, end);
          } else if (onRangeChange) {
            onRangeChange(start, end);
          }
        } else {
          setInternalSelectedRange({ start: end, end: start });
          if (onRangeSelect) {
            onRangeSelect(end, start);
          } else if (onRangeChange) {
            onRangeChange(end, start);
          }
        }
      }
    }
  };

  const isDateSelected = (date: Date) => {
    if (mode === 'single') {
      const compareDate = selectedDate || value;
      return compareDate && date.toDateString() === compareDate.toDateString();
    } else {
      if (!internalSelectedRange.start) return false;
      if (internalSelectedRange.start && !internalSelectedRange.end) {
        return date.toDateString() === internalSelectedRange.start.toDateString();
      }
      if (internalSelectedRange.start && internalSelectedRange.end) {
        return date >= internalSelectedRange.start && date <= internalSelectedRange.end;
      }
    }
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (mode !== 'range' || !internalSelectedRange.start || !internalSelectedRange.end) return false;
    return date > internalSelectedRange.start && date < internalSelectedRange.end;
  };

  const isDateRangeStart = (date: Date) => {
    return mode === 'range' && internalSelectedRange.start && date.toDateString() === internalSelectedRange.start.toDateString();
  };

  const isDateRangeEnd = (date: Date) => {
    return mode === 'range' && internalSelectedRange.end && date.toDateString() === internalSelectedRange.end.toDateString();
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
          const disabled = isDateDisabled(date);

          return (
            <button
              key={index}
              onClick={() => !disabled && handleDateClick(date)}
              disabled={disabled}
              className={`
                h-8 text-xs font-medium rounded-md transition-colors relative
                ${disabled 
                  ? 'text-muted-foreground/50 cursor-not-allowed line-through' 
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
      {mode === 'range' && internalSelectedRange.start && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {internalSelectedRange.end ? (
              <>
                נבחר: {internalSelectedRange.start.toLocaleDateString('he-IL')} - {internalSelectedRange.end.toLocaleDateString('he-IL')}
                <div className="text-[10px] mt-1">
                  {Math.ceil((internalSelectedRange.end.getTime() - internalSelectedRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} ימים
                </div>
              </>
            ) : (
              <>
                בחר תאריך סיום
                {maxRange && <div className="text-[10px] mt-1">(מקסימום {maxRange} ימים)</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 