import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as http from 'http';
import * as https from 'https';

interface AppointmentResult {
  date: string;
  available: boolean | null;
  message: string;
  times: string[];
}

interface ApiResponse {
  success: boolean;
  totalDaysChecked: number;
  availableAppointments: number;
  results: AppointmentResult[];
  summary: {
    hasAvailableAppointments: boolean;
    earliestAvailable: AppointmentResult | null;
    totalSlots: number;
  };
  performance: {
    totalTimeMs: number;
    averageRequestTimeMs: number;
    requestsPerSecond: number;
  };
}

// Cache to store recent results (5 minutes TTL)
const cache = new Map<string, { data: AppointmentResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Controlled concurrency pool
class ConcurrencyPool {
  private running = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(private maxConcurrency: number) {}

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          this.running++;
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      if (this.running < this.maxConcurrency) {
        wrappedTask();
      } else {
        this.queue.push(wrappedTask);
      }
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const task = this.queue.shift()!;
      task();
    }
  }
}

// Smart delay based on success rate
let recentErrors = 0;
let totalRequests = 0;

function getSmartDelay(): number {
  const errorRate = totalRequests > 0 ? recentErrors / totalRequests : 0;
  
  if (errorRate > 0.3) return 2000; // High error rate, slow down
  if (errorRate > 0.1) return 1000; // Some errors, moderate delay
  return 200; // Low error rate, minimal delay
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkSingleDate(
  dateStr: string, 
  axiosInstance: any,
  baseParams: any
): Promise<AppointmentResult> {
  const startTime = Date.now();
  
  // Check cache first
  const cacheKey = dateStr;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    totalRequests++;
    
    const params = { ...baseParams, datef: dateStr };
    const response = await axiosInstance.get('https://mytor.co.il/home.php', {
      params,
      timeout: 10000,
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
          const result: AppointmentResult = {
            date: dateStr,
            available: false,
            message: 'No appointments available',
            times: []
          };
          
          // Cache the result
          cache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        }
      }
    }

    // Look for time buttons
    const timeButtons = $('button.btn.btn-outline-dark.btn-block');
    const availableTimes: string[] = [];
    
    timeButtons.each((_, element) => {
      const timeText = $(element).text().trim();
      if (/^\d{1,2}:\d{2}$/.test(timeText)) {
        availableTimes.push(timeText);
      }
    });

    const result: AppointmentResult = availableTimes.length > 0 ? {
      date: dateStr,
      available: true,
      message: `Found ${availableTimes.length} available appointments`,
      times: availableTimes
    } : {
      date: dateStr,
      available: null,
      message: 'Could not determine availability',
      times: []
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;

  } catch (error: any) {
    recentErrors++;
    console.error(`Error checking ${dateStr}:`, error.message);
    
    return {
      date: dateStr,
      available: null,
      message: `Error: ${error.message}`,
      times: []
    };
  }
}

// Batch processing with smart grouping
async function processBatch(
  dates: string[],
  axiosInstance: any,
  baseParams: any,
  concurrency: number = 5
): Promise<AppointmentResult[]> {
  const pool = new ConcurrencyPool(concurrency);
  const results: AppointmentResult[] = [];
  
  // Process in batches with smart delays
  for (let i = 0; i < dates.length; i += concurrency) {
    const batch = dates.slice(i, i + concurrency);
    
    const batchPromises = batch.map(date =>
      pool.add(() => checkSingleDate(date, axiosInstance, baseParams))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Smart delay between batches (but not after the last batch)
    if (i + concurrency < dates.length) {
      const delay = getSmartDelay();
      await sleep(delay);
    }
  }
  
  return results;
}

// Clean old cache entries
function cleanCache() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  cache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => cache.delete(key));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const startTime = Date.now();
  
  // Clean cache periodically
  cleanCache();
  
  // Reset error tracking for this session
  recentErrors = 0;
  totalRequests = 0;

  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 60);
    
    // Authentication check
    const userId = process.env.USER_ID;
    const codeAuth = process.env.CODE_AUTH;
    
    if (!userId || !codeAuth) {
      return res.status(500).json({
        success: false,
        totalDaysChecked: 0,
        availableAppointments: 0,
        results: [],
        summary: {
          hasAvailableAppointments: false,
          earliestAvailable: null,
          totalSlots: 0
        },
        performance: {
          totalTimeMs: 0,
          averageRequestTimeMs: 0,
          requestsPerSecond: 0
        }
      } as ApiResponse);
    }

    // Create axios instance with optimized settings
    const axiosInstance = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'he,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Cookie': `userID=${userId}; codeAuth=${codeAuth}`,
        'Connection': 'keep-alive',
      },
             timeout: 10000,
       maxRedirects: 3,
       // Enable HTTP keep-alive for connection reuse
       httpAgent: new http.Agent({ keepAlive: true }),
       httpsAgent: new https.Agent({ keepAlive: true }),
    });

    const baseParams = {
      i: 'cmFtZWwzMw==',
      s: 'MjY1',
      mm: 'y',
      lang: 'he'
    };

    // Generate dates to check
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      dates.push(checkDate.toISOString().split('T')[0]);
    }

    // Determine optimal concurrency based on number of days
    const concurrency = days <= 7 ? 3 : days <= 30 ? 5 : 8;
    
    console.log(`🚀 Starting parallel check for ${days} days with concurrency ${concurrency}`);

    // Process all dates with controlled concurrency
    const results = await processBatch(dates, axiosInstance, baseParams, concurrency);
    
    // Calculate performance metrics
    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    const averageRequestTimeMs = totalRequests > 0 ? totalTimeMs / totalRequests : 0;
    const requestsPerSecond = totalRequests > 0 ? (totalRequests / (totalTimeMs / 1000)) : 0;

    // Generate summary
    const availableResults = results.filter(r => r.available === true);
    const totalSlots = availableResults.reduce((sum, r) => sum + r.times.length, 0);
    const earliestAvailable = availableResults.length > 0 ? availableResults[0] : null;

    console.log(`✅ Completed in ${totalTimeMs}ms (${requestsPerSecond.toFixed(1)} req/s)`);

    const response: ApiResponse = {
      success: true,
      totalDaysChecked: days,
      availableAppointments: availableResults.length,
      results,
      summary: {
        hasAvailableAppointments: availableResults.length > 0,
        earliestAvailable,
        totalSlots
      },
      performance: {
        totalTimeMs,
        averageRequestTimeMs: Math.round(averageRequestTimeMs),
        requestsPerSecond: Math.round(requestsPerSecond * 10) / 10
      }
    };

    res.status(200).json(response);

  } catch (error: any) {
    console.error('API Error:', error);
    
    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    
    res.status(500).json({
      success: false,
      totalDaysChecked: 0,
      availableAppointments: 0,
      results: [],
      summary: {
        hasAvailableAppointments: false,
        earliestAvailable: null,
        totalSlots: 0
      },
      performance: {
        totalTimeMs,
        averageRequestTimeMs: 0,
        requestsPerSecond: 0
      }
    } as ApiResponse);
  }
} 