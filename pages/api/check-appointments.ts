import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as http from 'http';
import * as https from 'https';
import { inflate } from 'pako';

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

// Cache for storing results
const cache = new Map<string, { data: ApiResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Performance tracking
let activeRequests = 0;
let errorCount = 0;
let lastErrorTime = 0;

// Israel timezone constant
const ISRAEL_TIMEZONE = 'Asia/Jerusalem';

// Israel timezone utility functions
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
  
  while (openDays.length < totalDays && daysChecked < 60) { // Safety limit
    if (!isClosedDay(currentDate)) {
      openDays.push(new Date(currentDate));
    }
    currentDate = addDaysIsrael(currentDate, 1);
    daysChecked++;
  }
  
  return openDays;
};

const checkAppointmentForDate = async (date: Date): Promise<AppointmentResult> => {
  const dateStr = formatDateForUrl(date);
  
  // Skip closed days
  if (isClosedDay(date)) {
    return {
      date: dateStr,
      available: false,
      message: 'המספרה סגורה (יום שני/שבת)',
      times: []
    };
  }

  try {
    activeRequests++;
    
    const params = {
      i: 'cmFtZWwzMw==', // ramel33
      s: 'MjY1',         // 265
      mm: 'y',
      lang: 'he',
      datef: dateStr
    };

    const response = await axios.get('https://mytor.co.il/home.php', {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cookie': `userID=${process.env.USER_ID || '4481'}; codeAuth=${process.env.CODE_AUTH || 'Sa1W2GjL'}`
      },
      timeout: 15000,
      responseType: 'arraybuffer'
    });

    const $ = cheerio.load(response.data);
    
    // Check for "no appointments" message
    const noAppointmentsMessages = [
      'מצטערים, לא נשארו תורים פנויים ליום זה',
      'לא נשארו תורים פנויים'
    ];
    
    const dangerElements = $('h4.tx-danger');
    for (let i = 0; i < dangerElements.length; i++) {
      const elementText = $(dangerElements[i]).text().trim();
      for (const msg of noAppointmentsMessages) {
        if (elementText.includes(msg)) {
          return {
            date: dateStr,
            available: false,
            message: 'No appointments available',
            times: []
          };
        }
      }
    }

    // Look for appointment time buttons
    const timeButtons = $('button.btn.btn-outline-dark.btn-block');
    const availableTimes: string[] = [];
    
    timeButtons.each((_, element) => {
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
        available: null,
        message: 'Could not determine availability',
        times: []
      };
    }

  } catch (error: any) {
    errorCount++;
    lastErrorTime = Date.now();
    
    return {
      date: dateStr,
      available: null,
      message: `Error: ${error.message}`,
      times: []
    };
  } finally {
    activeRequests--;
  }
};

// Concurrent request pool manager
const processInBatches = async (
  dates: Date[], 
  batchSize: number = 5
): Promise<AppointmentResult[]> => {
  const results: AppointmentResult[] = [];
  
  for (let i = 0; i < dates.length; i += batchSize) {
    const batch = dates.slice(i, i + batchSize);
    const batchPromises = batch.map(async (date) => {
      const delay = getDelay();
      if (delay > 200) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * delay));
      }
      return checkAppointmentForDate(date);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to be respectful
    if (i + batchSize < dates.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
};

// Dynamic delay based on error rate
const getDelay = (): number => {
  const now = Date.now();
  const timeSinceLastError = now - lastErrorTime;
  
  if (errorCount > 3 && timeSinceLastError < 30000) {
    return 2000; // 2 seconds if many recent errors
  } else if (errorCount > 1 && timeSinceLastError < 10000) {
    return 1000; // 1 second if some recent errors
  }
  return 200; // Default 200ms
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate, days = 7, mode = 'range' } = req.body;

    // Use Israel timezone for date operations
    const baseDate = startDate ? new Date(startDate + 'T00:00:00') : getCurrentDateIsrael();
    
    let datesToCheck: Date[];
    
    if (mode === 'closest') {
      // For closest mode, check up to 30 days but only open days
      datesToCheck = getOpenDays(baseDate, 30);
    } else {
      // For range mode, get the requested number of open days
      const maxDays = Math.min(days, 30); // Limit to 30 days maximum
      datesToCheck = getOpenDays(baseDate, maxDays);
    }

    // Check cache first
    const cacheKey = `${datesToCheck.length}-${mode}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json(cached.data);
    }

    const startTime = Date.now();

    let results: AppointmentResult[];
    let totalDaysToCheck = datesToCheck.length;

    if (mode === 'closest') {
      // For closest mode, check up to 30 days but stop at first available
      totalDaysToCheck = 30;
      const openDays = getOpenDays(baseDate, totalDaysToCheck);
      
      // Check days one by one until we find availability
      results = [];
      let foundAvailable = false;
      
      for (const date of openDays) {
        const result = await checkAppointmentForDate(date);
        results.push(result);
        
        if (result.available === true) {
          foundAvailable = true;
          // Continue checking for a few more days to show more options
          let additionalChecks = 0;
          const maxAdditional = 5;
          
          for (let i = openDays.indexOf(date) + 1; i < openDays.length && additionalChecks < maxAdditional; i++) {
            const additionalResult = await checkAppointmentForDate(openDays[i]);
            results.push(additionalResult);
            additionalChecks++;
            
            // Add small delay between requests
            await new Promise(resolve => setTimeout(resolve, getDelay()));
          }
          break;
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, getDelay()));
      }
    } else {
      // For range mode, check all requested days (excluding closed days)
      results = await processInBatches(datesToCheck, 5);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Calculate summary
    const availableResults = results.filter(r => r.available === true);
    const earliestAvailable = availableResults.length > 0 ? availableResults[0] : null;
    const totalSlots = availableResults.reduce((sum, r) => sum + r.times.length, 0);

    const response: ApiResponse = {
      results: results,
      summary: {
        mode,
        hasAvailableAppointments: availableResults.length > 0,
        earliestAvailable,
        totalSlots,
        found: mode === 'closest' && availableResults.length > 0 ? true : undefined,
        date: mode === 'closest' && availableResults.length > 0 ? formatDateForUrl(new Date(availableResults[0].date)) : undefined,
        times: mode === 'closest' && availableResults.length > 0 ? availableResults[0].times : undefined
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

    // Cache the result
    cache.set(cacheKey, { data: response, timestamp: Date.now() });

    // Clean old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }

    // Process results based on mode
    if (mode === 'closest') {
      // Find the first available appointment
      const firstAvailable = results.find(r => r.available === true);
      if (firstAvailable) {
        return res.status(200).json({
          results: [firstAvailable],
          summary: {
            mode: 'closest',
            found: true,
            date: firstAvailable.date,
            times: firstAvailable.times,
            hasAvailableAppointments: true,
            earliestAvailable: firstAvailable,
            totalSlots: firstAvailable.times.length
          }
        });
      } else {
        return res.status(200).json({
          results: [],
          summary: {
            mode: 'closest',
            found: false,
            message: 'לא נמצאו תורים פנויים ב-30 הימים הקרובים',
            hasAvailableAppointments: false,
            earliestAvailable: null,
            totalSlots: 0
          }
        });
      }
    } else {
      // Return all results for range mode
      return res.status(200).json({
        results: results,
        summary: {
          mode: 'range',
          totalChecked: results.length,
          availableCount: availableResults.length,
          hasAvailable: availableResults.length > 0,
          hasAvailableAppointments: availableResults.length > 0,
          earliestAvailable: earliestAvailable,
          totalSlots: totalSlots
        }
      });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'שגיאה בבדיקת התורים'
    });
  }
} 