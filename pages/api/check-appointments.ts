import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Create persistent HTTP agents for connection reuse
const httpAgent = new HttpAgent({ keepAlive: true, maxSockets: 10 });
const httpsAgent = new HttpsAgent({ keepAlive: true, maxSockets: 10, rejectUnauthorized: false });

// Create axios instance with persistent connection
const axiosInstance = axios.create({
  httpAgent,
  httpsAgent,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  },
  timeout: 5000,
  responseType: 'arraybuffer'
});

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

// Cache for HTTP responses (in-memory)
const responseCache = new Map<string, {data: AppointmentResult, timestamp: number}>();
const CACHE_TTL = 60 * 1000; // 1 minute TTL for HTTP responses

// Use admin client for server-side operations
const supabase = supabaseAdmin;

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
  while (openDays.length < totalDays && daysChecked < 500) { // Increased limit to handle up to a year
    if (!isClosedDay(currentDate)) {
      openDays.push(new Date(currentDate));
    }
    currentDate = addDaysIsrael(currentDate, 1);
    daysChecked++;
  }
  return openDays;
};

// Optimized single date check with caching and connection reuse
const checkSingleDateOptimized = async (dateStr: string): Promise<AppointmentResult> => {
  // Check in-memory cache first
  const cacheKey = `appointment_${dateStr}`;
  const cachedResponse = responseCache.get(cacheKey);
  
  if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
    console.log(`Cache hit for date ${dateStr}`);
    return cachedResponse.data;
  }
  
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
    
    // Use the optimized axios instance
    const response = await axiosInstance.get('https://mytor.co.il/home.php', {
      params,
      headers: {
        'Cookie': `userID=${userId}; codeAuth=${codeAuth}`
      }
    });
    
    // Use cheerio to parse HTML
    const $ = cheerio.load(response.data);
    
    // Fast check for no appointments text
    const dangerText = $('h4.tx-danger').text();
    if (dangerText.includes('לא נשארו תורים פנויים')) {
      const result = {
        date: dateStr,
        available: false,
        message: 'No appointments available',
        times: []
      };
      
      // Cache the result
      responseCache.set(cacheKey, {data: result, timestamp: Date.now()});
      return result;
    }
    
    // Optimized time extraction
    const availableTimes: string[] = [];
    const timeButtons = $('button.btn.btn-outline-dark.btn-block');
    
    // Use for loop instead of .each() for better performance
    for (let i = 0; i < timeButtons.length; i++) {
      const timeText = $(timeButtons[i]).text().trim();
      if (/^\d{1,2}:\d{2}$/.test(timeText)) {
        availableTimes.push(timeText);
      }
    }
    
    const result = availableTimes.length > 0 
      ? {
          date: dateStr,
          available: true,
          message: `Found ${availableTimes.length} available appointments`,
          times: availableTimes
        }
      : {
          date: dateStr,
          available: false,
          message: 'No appointments available',
          times: []
        };
    
    // Cache the result
    responseCache.set(cacheKey, {data: result, timestamp: Date.now()});
    return result;
  } catch (error: any) {
    console.error(`Error checking date ${dateStr}:`, error.message);
    return {
      date: dateStr,
      available: null,
      message: `Error: ${error.message}`,
      times: []
    };
  }
};

// Optimized parallel batch processing with adaptive batch size
const processInBatches = async (dates: string[], initialBatchSize: number = 5): Promise<AppointmentResult[]> => {
  const results: AppointmentResult[] = [];
  let batchSize = initialBatchSize;
  const totalDates = dates.length;
  
  // Adaptive batch sizing based on number of dates
  if (totalDates > 20) {
    batchSize = 8; // Larger batch size for more dates
  } else if (totalDates <= 10) {
    batchSize = 3; // Smaller batch size for fewer dates
  }
  
  console.log(`Processing ${totalDates} dates with batch size ${batchSize}`);
  
  for (let i = 0; i < dates.length; i += batchSize) {
    const batch = dates.slice(i, i + batchSize);
    const batchPromises = batch.map(dateStr => checkSingleDateOptimized(dateStr));
    
    // Use Promise.allSettled to handle partial failures
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process results, including any that failed
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Add an error result for failed promises
        results.push({
          date: batch[index],
          available: null,
          message: `Error: ${result.reason?.message || 'Unknown error'}`,
          times: []
        });
      }
    });
    
    // Adaptive delay between batches
    if (i + batchSize < dates.length) {
      const delay = Math.min(50, Math.max(20, Math.floor(50 / batchSize))); 
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
};



export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse | { error: string }>) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Set cache control headers
  res.setHeader('Cache-Control', 'public, max-age=60');
  
  try {
    console.log('Manual check: Starting appointment search');
    const { startDate, days = 365, mode = 'range' } = req.body;
    console.log(`Manual check: Mode=${mode}, Days=${days}, StartDate=${startDate}`);
    
    const baseDate = startDate ? new Date(startDate + 'T00:00:00') : getCurrentDateIsrael();
    let datesToCheck: string[];
    
    if (mode === 'closest') {
      datesToCheck = getOpenDays(baseDate, 365).map(d => formatDateForUrl(d));
      console.log(`Manual check: Closest mode - will check up to 365 open days for first available`);
    } else {
      const maxDays = Math.min(days, 365);
      datesToCheck = getOpenDays(baseDate, maxDays).map(d => formatDateForUrl(d));
      console.log(`Manual check: Range mode - will check ${datesToCheck.length} days`);
    }
    
    const startTime = Date.now();
    console.log(`Manual check: Will search ${datesToCheck.length} dates in batches`);
    
    let results: AppointmentResult[] = [];
    
    if (mode === 'closest') {
      // Early exit optimization for closest mode
      // Check all dates in parallel with early exit
      for (let i = 0; i < datesToCheck.length; i += 5) {
        const batch = datesToCheck.slice(i, i + 5);
        const batchResults = await Promise.all(batch.map(dateStr => checkSingleDateOptimized(dateStr)));
        
        // Add all results first
        results.push(...batchResults);
        
        // Check if any appointment is available in this batch
        const found = batchResults.find(r => r.available === true && r.times.length > 0);
        if (found) {
          console.log(`Manual check: Found first available appointment on ${found.date} with ${found.times.length} slots`);
          break; // Early exit once we find the first available appointment
        }
        
        // Small delay between batches
        if (i + 5 < datesToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }
      
      // If no appointments found, results will be empty
      if (results.length === 0) {
        console.log(`Manual check: No appointments found in closest mode`);
        results = [{
          date: formatDateForUrl(baseDate),
          available: false,
          message: 'לא נמצאו תורים פנויים',
          times: []
        }];
      }
    } else {
      // Range mode: return all results with optimized batch processing
      results = await processInBatches(datesToCheck);
      console.log(`Manual check: Processed ${results.length} dates in range mode`);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    console.log(`Manual check: Search completed in ${totalTime}ms`);
    
    const availableResults = results.filter(r => r.available === true);
    console.log(`Manual check: Found ${availableResults.length} dates with available appointments`);
    
    const earliestAvailable = availableResults.length > 0 ? availableResults[0] : null;
    const totalSlots = availableResults.reduce((sum, r) => sum + r.times.length, 0);
    console.log(`Manual check: Total available slots: ${totalSlots}`);
    console.log(`Manual check: Available results:`, JSON.stringify(availableResults, null, 2));
    
    // Match auto-check response structure
    const response: ApiResponse = {
      results: results,
      summary: {
        mode,
        found: availableResults.length > 0,
        date: earliestAvailable?.date,
        times: earliestAvailable?.times,
        message: availableResults.length > 0 ? 
          `נמצאו ${availableResults.length} תורים זמינים` : 
          'לא נמצאו תורים פנויים',
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
    
    // Save to Supabase cache - use the same format as auto-check.js
    console.log('Manual check: Writing results to auto-check cache');
    
    // Convert to the EXACT format used by auto-check.js
    const essentialData = {
      timestamp: Date.now(),
      found: availableResults.length > 0,
      count: availableResults.length,
      summary: {
        totalChecked: results.length,
        elapsed: Math.round(totalTime / 1000),
        mode: mode,
        hasAvailable: availableResults.length > 0,
        completedAt: new Date().toISOString(),
        performance: {
          totalTimeMs: totalTime
        }
      },
      // Store only first 5 appointments - use the exact same format as auto-check
      preview: availableResults.slice(0, 5)
    };
    
    console.log('Manual check: Essential data:', JSON.stringify(essentialData, null, 2));
    
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache')
      .upsert([{ 
        key: 'auto-check-minimal', 
        value: essentialData,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'key'
      });
      
          if (cacheError) {
        console.error('Manual check: Failed to update cache:', cacheError);
      } else {
        console.log('Manual check: Cache updated successfully');
        console.log('Manual check: Cache data written:', cacheData);
      }
    
    // Wait a bit to ensure cache is written
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return JSON response
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Manual check API error:', error);
    
    // Return a structured error that can be handled by the frontend
    res.status(500).json({ 
      error: 'שגיאה בבדיקת התורים',
      results: [{
        date: req.body.startDate || formatDateForUrl(getCurrentDateIsrael()),
        available: null,
        message: `Error: ${error.message || 'Unknown error'}`,
        times: []
      }],
      summary: {
        mode: req.body.mode || 'range',
        found: false,
        message: 'שגיאה בבדיקת התורים'
      }
    });
  }
} 