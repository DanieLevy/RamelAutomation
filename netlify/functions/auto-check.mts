import type { Context } from '@netlify/functions'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { inflate } from 'pako'
import * as fs from 'fs'
import * as path from 'path'

// Israel timezone utilities
const ISRAEL_TIMEZONE = 'Asia/Jerusalem'

const formatDateIsrael = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const getCurrentDateIsrael = (): Date => {
  return new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()) + 'T00:00:00')
}

const addDaysIsrael = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const isClosedDay = (date: Date): boolean => {
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date)
  
  return dayOfWeek === 'Monday' || dayOfWeek === 'Saturday'
}

const getOpenDays = (startDate: Date, totalDays: number): Date[] => {
  const openDays: Date[] = []
  let currentDate = new Date(startDate)
  let daysChecked = 0
  
  while (openDays.length < totalDays && daysChecked < 60) { // Safety limit
    if (!isClosedDay(currentDate)) {
      openDays.push(new Date(currentDate))
    }
    currentDate = addDaysIsrael(currentDate, 1)
    daysChecked++
  }
  
  return openDays
}

// Path to cache file: use /tmp in Netlify, local dir in dev
const CACHE_FILE_PATH = process.env.NETLIFY ? '/tmp/cache.json' : path.join(process.cwd(), 'cache.json')

// Helper to write cache to file
function writeCacheToFile(data: any) {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to write cache file:', err)
  }
}

// Helper to read cache from file
function readCacheFromFile() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('Failed to read cache file:', err)
  }
  return null
}

async function checkSingleDate(dateStr: string): Promise<any> {
  try {
    // Get environment variables using Netlify.env
    const userId = Netlify.env.get('USER_ID') || '4481'
    const codeAuth = Netlify.env.get('CODE_AUTH') || 'Sa1W2GjL'
    
    // Use the EXACT same approach as frontend API
    const params = {
      i: 'cmFtZWwzMw==', // ramel33
      s: 'MjY1',         // 265
      mm: 'y',
      lang: 'he',
      datef: dateStr
    }

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
        'Cookie': `userID=${userId}; codeAuth=${codeAuth}`
      },
      timeout: 15000,
      responseType: 'arraybuffer'
    })

    // Use cheerio directly on the response data (no manual gzip decompression)
    const $ = cheerio.load(response.data)
    
    // Check for "no appointments" message first (same as frontend)
    const noAppointmentsMessages = [
      'מצטערים, לא נשארו תורים פנויים ליום זה',
      'לא נשארו תורים פנויים'
    ]
    
    const dangerElements = $('h4.tx-danger')
    for (let i = 0; i < dangerElements.length; i++) {
      const elementText = $(dangerElements[i]).text().trim()
      for (const msg of noAppointmentsMessages) {
        if (elementText.includes(msg)) {
          return {
            date: dateStr,
            available: false,
            message: 'No appointments available',
            times: []
          }
        }
      }
    }

    // Look for appointment time buttons (same as frontend)
    const timeButtons = $('button.btn.btn-outline-dark.btn-block')
    const availableTimes: string[] = []
    
    timeButtons.each((_, element) => {
      const timeText = $(element).text().trim()
      // Use frontend regex pattern: /^\d{1,2}:\d{2}$/ (allows single digit hours)
      if (/^\d{1,2}:\d{2}$/.test(timeText)) {
        availableTimes.push(timeText)
      }
    })

    if (availableTimes.length > 0) {
      return {
        date: dateStr,
        available: true,
        message: `Found ${availableTimes.length} available appointments`,
        times: availableTimes
      }
    } else {
      return {
        date: dateStr,
        available: null,
        message: 'Could not determine availability',
        times: []
      }
    }
  } catch (error) {
    console.error(`Error checking date ${dateStr}:`, error)
    return {
      date: dateStr,
      available: null,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      times: []
    }
  }
}

async function findClosestAppointment(): Promise<any> {
  const currentDate = getCurrentDateIsrael()
  // Use 30 days in both dev and production to properly test appointment detection
  const maxDays = 30
  const openDates = getOpenDays(currentDate, maxDays)
  
  console.log(`Auto-check: Searching for closest appointment in ${openDates.length} open days`)
  
  let checkedCount = 0
  
  // Check dates sequentially until we find the FIRST available appointment
  for (const date of openDates) {
    checkedCount++
    const dateStr = formatDateIsrael(date)
    console.log(`Auto-check: Checking ${dateStr} (${checkedCount}/${openDates.length})`)
    
    const result = await checkSingleDate(dateStr)
    
    if (result.available === true && result.times.length > 0) {
      console.log(`Auto-check: ✅ FOUND closest appointment on ${dateStr} - STOPPING search`)
      return {
        results: [result],
        summary: {
          mode: 'closest',
          found: true,
          date: dateStr,
          times: result.times,
          totalChecked: checkedCount,
          message: `התור הקרוב ביותר נמצא ב-${dateStr}`
        }
      }
    }
    
    // Save progress every 5 checks in development to handle timeouts
    if (process.env.NETLIFY_DEV && checkedCount % 5 === 0) {
      const progressData = {
        timestamp: Date.now(),
        result: {
          results: [],
          summary: {
            mode: 'closest',
            found: false,
            totalChecked: checkedCount,
            message: `בדקתי ${checkedCount} מתוך ${openDates.length} תאריכים - עדיין מחפש...`
          }
        }
      }
      writeCacheToFile(progressData)
      console.log(`Auto-check: Progress saved - ${checkedCount}/${openDates.length} checked`)
    }
    
    // Add delay between requests to be respectful and avoid rate limiting (reduced for dev)
    const delay = process.env.NETLIFY_DEV ? 300 : 1000 // 300ms for dev, 1000ms for prod
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  console.log(`Auto-check: ❌ No appointments found after checking ${checkedCount} days`)
  return {
    results: [],
    summary: {
      mode: 'closest',
      found: false,
      totalChecked: checkedCount,
      message: 'לא נמצאו תורים פנויים ב-30 הימים הקרובים'
    }
  }
}

// Modern Netlify Functions handler (NOT background - regular function)
export default async (req: Request, context: Context) => {
  console.log('Auto-check function started - NO LOCKS')
  
  try {
    // Just run the function without internal timeout
    const result = await findClosestAppointment()
    
    // Store result with timestamp
    const cacheData = {
      timestamp: Date.now(),
      result: result
    }
    
    // Write to file cache
    writeCacheToFile(cacheData)
    
    console.log('Auto-check completed successfully:', {
      found: result.summary.found,
      date: result.summary.date,
      totalChecked: result.summary.totalChecked,
      timestamp: new Date().toISOString()
    })
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Auto-check completed',
      result: result
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Auto-check failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } finally {
    console.log('Auto-check function completed')
  }
} 