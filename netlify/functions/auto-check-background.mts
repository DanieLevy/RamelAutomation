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

const isClosedDay = (dateStr: string): boolean => {
  const date = new Date(dateStr + 'T12:00:00')
  const dayOfWeek = date.getDay()
  return dayOfWeek === 1 || dayOfWeek === 6 // Monday = 1, Saturday = 6
}

const getOpenDays = (startDate: Date, maxDays: number): string[] => {
  const dates: string[] = []
  let currentDate = new Date(startDate)
  let daysAdded = 0
  
  while (daysAdded < maxDays) {
    const dateStr = formatDateIsrael(currentDate)
    if (!isClosedDay(dateStr)) {
      dates.push(dateStr)
      daysAdded++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
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
  const url = `https://mytor.co.il/home.php?i=cmFtZWwzMw%3D%3D&s=MjY1&mm=y&lang=he&datef=${dateStr}&signup=%D7%94%D7%A6%D7%92`
  
  try {
    // Get environment variables using Netlify.env
    const userId = Netlify.env.get('USER_ID') || '4481'
    const codeAuth = Netlify.env.get('CODE_AUTH') || 'Sa1W2GjL'
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Cache-Control': 'no-cache',
        'Cookie': `userID=${userId}; codeAuth=${codeAuth}`,
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      timeout: 15000,
      responseType: 'arraybuffer'
    })

    let htmlContent: string
    const contentEncoding = response.headers['content-encoding']
    
    if (contentEncoding === 'gzip') {
      try {
        // Use pako for gzip decompression
        const decompressed = inflate(new Uint8Array(response.data))
        htmlContent = Buffer.from(decompressed).toString('utf-8')
      } catch (decompressError) {
        htmlContent = Buffer.from(response.data).toString('utf-8')
      }
    } else {
      // For other encodings or no encoding, just convert buffer to string
      htmlContent = Buffer.from(response.data).toString('utf-8')
    }

    const $ = cheerio.load(htmlContent)
    const timeButtons = $('button.btn.btn-outline-dark.btn-block')
    const times: string[] = []
    
    timeButtons.each((_, element) => {
      const timeText = $(element).text().trim()
      if (timeText && /^\d{2}:\d{2}$/.test(timeText)) {
        times.push(timeText)
      }
    })

    return {
      date: dateStr,
      available: times.length > 0,
      message: times.length > 0 ? `נמצאו ${times.length} תורים פנויים` : 'אין תורים פנויים',
      times: times
    }
  } catch (error) {
    console.error(`Error checking date ${dateStr}:`, error)
    return {
      date: dateStr,
      available: null,
      message: 'שגיאה בבדיקת התאריך',
      times: []
    }
  }
}

async function findClosestAppointment(): Promise<any> {
  const currentDate = getCurrentDateIsrael()
  const maxDays = 30
  const openDates = getOpenDays(currentDate, maxDays)
  
  console.log(`Auto-check: Searching for closest appointment in ${openDates.length} open days`)
  
  // Check dates sequentially until we find an available appointment
  for (const dateStr of openDates) {
    console.log(`Auto-check: Checking ${dateStr}`)
    const result = await checkSingleDate(dateStr)
    
    if (result.available === true && result.times.length > 0) {
      console.log(`Auto-check: Found closest appointment on ${dateStr}`)
      return {
        results: [result],
        summary: {
          mode: 'closest',
          found: true,
          date: dateStr,
          times: result.times,
          totalChecked: openDates.indexOf(dateStr) + 1,
          message: `התור הקרוב ביותר נמצא ב-${dateStr}`
        }
      }
    }
    
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return {
    results: [],
    summary: {
      mode: 'closest',
      found: false,
      totalChecked: openDates.length,
      message: 'לא נמצאו תורים פנויים ב-30 הימים הקרובים'
    }
  }
}

// Modern Netlify Functions handler (NOT Lambda-style)
export default async (req: Request, context: Context) => {
  console.log('Auto-check background function started')
  
  try {
    // Perform the closest appointment search
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
      timestamp: new Date().toISOString()
    })
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Auto-check completed',
      result: result
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
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
        'Content-Type': 'application/json'
      }
    })
  }
} 