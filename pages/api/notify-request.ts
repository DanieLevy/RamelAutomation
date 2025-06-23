import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format, isValid, parse, parseISO } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

// Israel timezone utilities
const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

const formatDateIsrael = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const getCurrentDateIsrael = (): Date => {
  return new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()) + 'T00:00:00');
};

const isValidDateFormat = (dateStr: string): boolean => {
  // Check if date is in YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  
  // Parse and validate the date
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(parsed);
};

const isClosedDay = (dateStr: string): boolean => {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date);
  
  return dayOfWeek === 'Monday' || dayOfWeek === 'Saturday';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, date, start, end, smartSelection } = req.body;
  
  // Validate required fields
  if (!email || (!date && (!start || !end))) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Validate email format
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Handle the date selection based on the request
  let criteria: any;
  let criteria_type: string;
  const maxRangeDays = 30; // Maximum allowed range in days
  
  const currentDate = getCurrentDateIsrael();
  
  if (date) {
    // Single date selection
    if (!isValidDateFormat(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Ensure date is not in the past
    const selectedDate = new Date(date);
    if (selectedDate < currentDate) {
      return res.status(400).json({ error: 'Cannot select a date in the past' });
    }
    
    // Handle closed days
    if (isClosedDay(date)) {
      return res.status(400).json({ error: 'The selected date is a closed day (Monday or Saturday)' });
    }
    
    criteria = { date };
    criteria_type = 'single';
  } else {
    // Date range selection
    if (!isValidDateFormat(start) || !isValidDateFormat(end)) {
      return res.status(400).json({ error: 'Invalid date format in range' });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Validate date range
    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    if (startDate < currentDate) {
      return res.status(400).json({ error: 'Cannot select start date in the past' });
    }
    
    // Smart date selection - limit range if it's too long
    let adjustedEnd = endDate;
    
    if (smartSelection === true) {
      const dayDifference = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDifference > maxRangeDays) {
        adjustedEnd = addDays(startDate, maxRangeDays);
        // Format the adjusted end date
        const adjustedEndStr = format(adjustedEnd, 'yyyy-MM-dd');
        criteria = { 
          start,
          end: adjustedEndStr,
          original_end: end,
          adjusted: true
        };
      } else {
        criteria = { start, end };
      }
    } else {
      criteria = { start, end };
    }
    
    criteria_type = 'range';
  }
  
  // Create a unique unsubscribe token
  const unsubscribe_token = uuidv4();
  
  // Insert into Supabase
  const { error } = await supabase.from('notifications').insert([
    {
      email,
      criteria,
      criteria_type,
      unsubscribe_token,
      notification_count: 0,
      last_notified: null,
    },
  ]);
  
  if (error) {
    console.error('Failed to save notification request:', error);
    return res.status(500).json({ error: 'Failed to save notification request' });
  }
  
  return res.status(200).json({ 
    success: true,
    message: criteria.adjusted 
      ? `נרשמת בהצלחה להתראה! שים לב: טווח התאריכים הוגבל ל-${maxRangeDays} ימים`
      : 'נרשמת בהצלחה להתראה!'
  });
} 