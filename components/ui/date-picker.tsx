"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

export function DatePicker({
  date,
  onDateChange,
  className,
  disabled,
  placeholder = "בחר תאריך",
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-right font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {date ? (
            <span>{format(date, "dd/MM/yyyy", { locale: he })}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          locale={he}
          weekStartsOn={0} // Sunday
          showOutsideDays={false}
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  dateRange: { from?: Date; to?: Date }
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  disabled,
  placeholder = "בחר טווח תאריכים",
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-right font-normal",
            !dateRange?.from && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {dateRange?.from ? (
            dateRange.to ? (
              <span dir="rtl">
                {format(dateRange.from, "dd/MM/yyyy", { locale: he })} - {format(dateRange.to, "dd/MM/yyyy", { locale: he })}
              </span>
            ) : (
              <span>{format(dateRange.from, "dd/MM/yyyy", { locale: he })}</span>
            )
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange as DateRange}
          onSelect={(range) => {
            if (range) onDateRangeChange(range);
          }}
          numberOfMonths={2}
          locale={he}
          weekStartsOn={0}
          showOutsideDays={false}
          className="mobile-full-width"
        />
      </PopoverContent>
    </Popover>
  )
} 