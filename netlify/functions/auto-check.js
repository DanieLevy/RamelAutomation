const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

// Israel timezone utilities
const ISRAEL_TIMEZONE = 'Asia/Jerusalem'

const formatDateIsrael = (date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const getCurrentDateIsrael = () => {
  return new Date(new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()) + 'T00:00:00')
}

const addDaysIsrael = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const isClosedDay = (date) => {
  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date)
  
  return dayOfWeek === 'Monday' || dayOfWeek === 'Saturday'
}

const getOpenDays = (startDate, totalDays) => {
  const openDays = []
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
// Check multiple environment indicators for Netlify
const isNetlify = process.env.NETLIFY || process.env.NETLIFY_BUILD_BASE || process.env.AWS_LAMBDA_FUNCTION_NAME
const CACHE_FILE_PATH = isNetlify ? '/tmp/cache.json' : path.join(process.cwd(), 'cache.json')

// Helper to write cache to file
function writeCacheToFile(data) {
  try {
    console.log(`auto-check: Attempting to write cache to: ${CACHE_FILE_PATH}`)
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
    console.log('auto-check: Cache successfully written to file')
  } catch (err) {
    console.error('auto-check: Failed to write cache file:', err)
    console.error('auto-check: Cache file path was:', CACHE_FILE_PATH)
    console.error('auto-check: Environment check - NETLIFY:', process.env.NETLIFY)
    console.error('auto-check: Environment check - AWS_LAMBDA:', process.env.AWS_LAMBDA_FUNCTION_NAME)
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

async function checkSingleDate(dateStr) {
  try {
    // Get environment variables - use process.env in Node.js
    const userId = process.env.USER_ID || '4481'
    const codeAuth = process.env.CODE_AUTH || 'Sa1W2GjL'
    
    console.log(`auto-check: Checking date ${dateStr}`)
    
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

    // Use cheerio directly on the response data
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
          console.log(`auto-check: No appointments available for ${dateStr}`)
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
    const availableTimes = []
    
    timeButtons.each((_, element) => {
      const timeText = $(element).text().trim()
      // Use frontend regex pattern: /^\d{1,2}:\d{2}$/ (allows single digit hours)
      if (/^\d{1,2}:\d{2}$/.test(timeText)) {
        availableTimes.push(timeText)
      }
    })

    if (availableTimes.length > 0) {
      console.log(`auto-check: Found ${availableTimes.length} appointments for ${dateStr}:`, availableTimes)
      return {
        date: dateStr,
        available: true,
        message: `Found ${availableTimes.length} available appointments`,
        times: availableTimes
      }
    } else {
      console.log(`auto-check: Could not determine availability for ${dateStr}`)
      return {
        date: dateStr,
        available: null,
        message: 'Could not determine availability',
        times: []
      }
    }
  } catch (error) {
    console.error(`auto-check: Error checking date ${dateStr}:`, error.message)
    return {
      date: dateStr,
      available: null,
      message: `Error: ${error.message}`,
      times: []
    }
  }
}

async function findClosestAppointment() {
  console.log('auto-check: Starting findClosestAppointment')
  const currentDate = getCurrentDateIsrael()
  const maxDays = 30
  const openDates = getOpenDays(currentDate, maxDays)
  
  let checkedCount = 0
  
  console.log(`auto-check: Will check ${openDates.length} open dates`)
  
  // Check dates sequentially until we find the FIRST available appointment
  for (const date of openDates) {
    checkedCount++
    const dateStr = formatDateIsrael(date)
    
    const result = await checkSingleDate(dateStr)
    
    if (result.available === true && result.times.length > 0) {
      console.log(`auto-check: Found appointment on ${dateStr} after checking ${checkedCount} days`)
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
    
    // Save progress every 5 checks to handle timeouts
    if (checkedCount % 5 === 0) {
      console.log(`auto-check: Progress: checked ${checkedCount}/${openDates.length}`)
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
    }
    
    // Add delay between requests to be respectful and avoid rate limiting
    const delay = process.env.NETLIFY_DEV ? 300 : 1000 // 300ms for dev, 1000ms for prod
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  console.log(`auto-check: No appointments found after checking ${checkedCount} days`)
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

// Netlify Functions handler
exports.handler = async (event, context) => {
  try {
    console.log('auto-check: Function called')
    const result = await findClosestAppointment()
    
    // Store result with timestamp
    const cacheData = {
      timestamp: Date.now(),
      result: result
    }
    
    // Write to file cache
    writeCacheToFile(cacheData)
    
    console.log('auto-check: Function completed successfully')
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Auto-check completed',
        result: result
      })
    }
  } catch (error) {
    console.error('auto-check: Function failed:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
} 