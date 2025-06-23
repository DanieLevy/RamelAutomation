import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

interface AppointmentResult {
  date: string;
  available: boolean | null;
  message: string;
  times: string[];
}

interface ApiResponse {
  results: AppointmentResult[];
  summary: {
    mode: string;
    found?: boolean;
    date?: string;
    times?: string[];
    message?: string;
    totalChecked?: number;
    availableCount?: number;
    hasAvailable?: boolean;
    hasAvailableAppointments?: boolean;
    earliestAvailable?: AppointmentResult | null;
    totalSlots?: number;
  };
  success?: boolean;
  totalDaysChecked?: number;
  availableAppointments?: number;
  performance?: {
    totalTimeMs: number;
    averageRequestTimeMs: number;
    requestsPerSecond: number;
  };
}

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

const getCurrentDateIsrael = (): Date => {
  return new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()) + 'T00:00:00');
};

const formatDateForUrl = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const addDaysIsrael = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isClosedDay = (date: Date): boolean => {
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date);
  return dayOfWeek === 'Monday' || dayOfWeek === 'Saturday';
};

const getOpenDays = (startDate: Date, totalDays: number): Date[] => {
  const openDays: Date[] = [];
  let currentDate = new Date(startDate);
  let daysChecked = 0;
  while (openDays.length < totalDays && daysChecked < 60) {
    if (!isClosedDay(currentDate)) {
      openDays.push(new Date(currentDate));
    }
    currentDate = addDaysIsrael(currentDate, 1);
    daysChecked++;
  }
  return openDays;
};

// Ultra-fast, parallelized single date check
const checkSingleDateOptimized = async (dateStr: string): Promise<AppointmentResult> => {
  try {
    const userId = process.env.USER_ID || '4481';
    const codeAuth = process.env.CODE_AUTH || 'Sa1W2GjL';
    const params = {
      i: 'cmFtZWwzMw==',
      s: 'MjY1',
      mm: 'y',
      lang: 'he',
      datef: dateStr
    };
    const response = await axios.get('https://mytor.co.il/home.php', {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cookie': `userID=${userId}; codeAuth=${codeAuth}`
      },
      timeout: 5000,
      responseType: 'arraybuffer'
    });
    const $ = cheerio.load(response.data);
    const dangerText = $('h4.tx-danger').text();
    if (dangerText.includes('לא נשארו תורים פנויים')) {
      return {
        date: dateStr,
        available: false,
        message: 'No appointments available',
        times: []
      };
    }
    const availableTimes: string[] = [];
    $('button.btn.btn-outline-dark.btn-block').each((_, element) => {
      const timeText = $(element).text().trim();
      if (/^\d{1,2}:\d{2}$/.test(timeText)) {
        availableTimes.push(timeText);
      }
    });
    if (availableTimes.length > 0) {
      return {
        date: dateStr,
        available: true,
        message: `Found ${availableTimes.length} available appointments`,
        times: availableTimes
      };
    } else {
      return {
        date: dateStr,
        available: false,
        message: 'No appointments available',
        times: []
      };
    }
  } catch (error: any) {
    return {
      date: dateStr,
      available: null,
      message: `Error: ${error.message}`,
      times: []
    };
  }
};

// Parallel batch processing
const processInBatches = async (dates: string[], batchSize: number = 5): Promise<AppointmentResult[]> => {
  const results: AppointmentResult[] = [];
  for (let i = 0; i < dates.length; i += batchSize) {
    const batch = dates.slice(i, i + batchSize);
    const batchPromises = batch.map(dateStr => checkSingleDateOptimized(dateStr));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    if (i + batchSize < dates.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  return results;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse | { error: string }>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { startDate, days = 7, mode = 'range' } = req.body;
    const baseDate = startDate ? new Date(startDate + 'T00:00:00') : getCurrentDateIsrael();
    let datesToCheck: string[];
    if (mode === 'closest') {
      datesToCheck = getOpenDays(baseDate, 30).map(d => formatDateForUrl(d));
    } else {
      const maxDays = Math.min(days, 30);
      datesToCheck = getOpenDays(baseDate, maxDays).map(d => formatDateForUrl(d));
    }
    const startTime = Date.now();
    let results: AppointmentResult[] = [];
    if (mode === 'closest') {
      // Check all dates in parallel, but only return the first available
      const batchResults = await processInBatches(datesToCheck, 5);
      const found = batchResults.find(r => r.available === true && r.times.length > 0);
      if (found) {
        results = [found];
      } else {
        results = [];
      }
    } else {
      // Range mode: return all results
      results = await processInBatches(datesToCheck, 5);
    }
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const availableResults = results.filter(r => r.available === true);
    const earliestAvailable = availableResults.length > 0 ? availableResults[0] : null;
    const totalSlots = availableResults.reduce((sum, r) => sum + r.times.length, 0);
    const response: ApiResponse = {
      results: results,
      summary: {
        mode,
        found: mode === 'closest' && availableResults.length > 0 ? true : false,
        date: mode === 'closest' && availableResults.length > 0 ? availableResults[0].date : undefined,
        times: mode === 'closest' && availableResults.length > 0 ? availableResults[0].times : undefined,
        message: availableResults.length > 0 ? undefined : 'לא נמצאו תורים פנויים',
        totalChecked: results.length,
        availableCount: availableResults.length,
        hasAvailable: availableResults.length > 0,
        hasAvailableAppointments: availableResults.length > 0,
        earliestAvailable: earliestAvailable,
        totalSlots: totalSlots
      },
      success: true,
      totalDaysChecked: results.length,
      availableAppointments: availableResults.length,
      performance: {
        totalTimeMs: totalTime,
        averageRequestTimeMs: results.length > 0 ? totalTime / results.length : 0,
        requestsPerSecond: results.length > 0 ? (results.length / totalTime) * 1000 : 0
      }
    };
    // Write result to Supabase cache
    await supabase
      .from('cache')
      .upsert([{ key: 'auto-check', value: { timestamp: Date.now(), result: response } }]);
    return res.status(200).json(response);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'שגיאה בבדיקת התורים' });
  }
} 