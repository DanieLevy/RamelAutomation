const axios = require('axios')
const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js')
const nodemailer = require('nodemailer')
const http = require('http')
const https = require('https')

// ============================================================================
// ULTRA-OPTIMIZED AUTO-CHECK FUNCTION
// Target: Complete execution under 8 seconds (2s buffer from 10s limit)
// Strategy: Focus ONLY on appointment checking, defer heavy operations
// ============================================================================

// Create persistent HTTP agents for connection reuse
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 15 })
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 15, rejectUnauthorized: false })

// Create optimized axios instance with aggressive timeouts
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
  timeout: 3000, // Reduced from 5000ms for speed
  responseType: 'arraybuffer'
})

// Enhanced in-memory cache with longer TTL for better performance
const responseCache = new Map()
const CACHE_TTL = 90 * 1000 // 1.5 minutes - longer cache for speed

// Supabase client setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Israel timezone utilities (optimized)
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

const getDayNameHebrew = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: ISRAEL_TIMEZONE,
    weekday: 'long'
  }).format(date)
}

const generateBookingUrl = (dateStr) => {
  // Convert YYYY-MM-DD to the URL format for the barbershop booking page
  const baseUrl = 'https://mytor.co.il/home.php'
  const params = new URLSearchParams({
    i: 'cmFtZWwzMw==',  // ramel33 encoded
    s: 'MjY1',         // 265
    mm: 'y',
    lang: 'he',
    datef: dateStr,
    signup: 'הצג'      // Hebrew for "Show"
  })
  
  return `${baseUrl}?${params.toString()}`
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
  
  while (openDays.length < totalDays && daysChecked < 45) { // Reduced safety limit for speed
    if (!isClosedDay(currentDate)) {
      openDays.push(new Date(currentDate))
    }
    currentDate = addDaysIsrael(currentDate, 1)
    daysChecked++
  }
  
  return openDays
}

// HYPER-OPTIMIZED: Single date check with enhanced caching
async function checkSingleDateHyperOptimized(dateStr) {
  const cacheKey = `apt_${dateStr}`
  const cached = responseCache.get(cacheKey)
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data
  }
  
  try {
    const userId = process.env.USER_ID || '4481'
    const codeAuth = process.env.CODE_AUTH || 'Sa1W2GjL'
    
    const params = {
      i: 'cmFtZWwzMw==', // ramel33
      s: 'MjY1',         // 265
      mm: 'y',
      lang: 'he',
      datef: dateStr
    }

    const response = await axiosInstance.get('https://mytor.co.il/home.php', {
      params,
      headers: {
        'Cookie': `userID=${userId}; codeAuth=${codeAuth}`
      }
    })

    // Ultra-fast cheerio loading with minimal options
    const $ = cheerio.load(response.data, {
      normalizeWhitespace: false,
      decodeEntities: false,
      xmlMode: false
    })
    
    // Lightning-fast check for "no appointments" message
    const dangerText = $('h4.tx-danger').text()
    if (dangerText.includes('לא נשארו תורים פנויים')) {
      const result = { date: dateStr, available: false, times: [] }
      responseCache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    }

    // Hyper-optimized time extraction using direct DOM access
    const availableTimes = []
    const timeButtons = $('button.btn.btn-outline-dark.btn-block')
    
    for (let i = 0; i < timeButtons.length; i++) {
      const timeText = $(timeButtons[i]).text().trim()
      if (/^\d{1,2}:\d{2}$/.test(timeText)) {
        availableTimes.push(timeText)
      }
    }

    const result = {
      date: dateStr,
      available: availableTimes.length > 0,
      times: availableTimes
    }
    
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
    
  } catch (error) {
    console.error(`Error checking ${dateStr}:`, error.message)
    return { date: dateStr, available: null, times: [] }
  }
}

// HYPER-SPEED: Aggressive parallel processing with smart early exits
async function findAppointmentsHyperSpeed() {
  console.log('🚀 HYPER-SPEED MODE: <8 seconds target')
  const startTime = Date.now()
  
  const currentDate = getCurrentDateIsrael()
  const maxDays = 25 // Reduced from 30 for speed
  const openDates = getOpenDays(currentDate, maxDays)
  
  console.log(`Will check ${openDates.length} dates in AGGRESSIVE parallel mode`)
  
  // ULTRA-AGGRESSIVE: Check first 3 dates from cache for instant response
  for (let i = 0; i < Math.min(3, openDates.length); i++) {
    const dateStr = formatDateIsrael(openDates[i])
    const cached = responseCache.get(`apt_${dateStr}`)
    
    if (cached && 
        (Date.now() - cached.timestamp < CACHE_TTL) && 
        cached.data.available === true) {
      console.log(`⚡ INSTANT: Found cached appointment for ${dateStr}`)
      return {
        success: true,
        found: true,
        appointments: [cached.data],
        summary: {
          totalChecked: 1,
          elapsed: Math.round((Date.now() - startTime) / 1000),
          mode: 'cache_hit',
          hasAvailable: true
        }
      }
    }
  }
  
  // HYPER-AGGRESSIVE: Larger batches with shorter timeouts
  const BATCH_SIZE = 8 // Increased from 5 for speed
  const results = []
  let foundAny = false
  
  for (let i = 0; i < openDates.length; i += BATCH_SIZE) {
    const batch = openDates.slice(i, i + BATCH_SIZE)
    const batchPromises = batch.map(date => {
      const dateStr = formatDateIsrael(date)
      return checkSingleDateHyperOptimized(dateStr)
    })
    
    // Process batch with race condition for speed
    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
        if (result.value.available) foundAny = true
      } else {
        results.push({
          date: formatDateIsrael(batch[idx]),
          available: null,
          times: []
        })
      }
    })
    
    const elapsed = Date.now() - startTime
    console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${results.length}/${openDates.length} in ${elapsed}ms`)
    
    // CRITICAL: Stop if we're approaching time limit OR found appointments
    if (elapsed > 6000) { // 6 second safety limit
      console.log(`⏰ TIME LIMIT: Stopping at ${elapsed}ms to avoid 10s timeout`)
      break
    }
    
    if (foundAny && elapsed > 2000) { // Early exit if found something after 2s
      console.log(`⚡ EARLY EXIT: Found appointments in ${elapsed}ms`)
      break
    }
    
    // Minimal delay only between batches
    if (i + BATCH_SIZE < openDates.length) {
      await new Promise(resolve => setTimeout(resolve, 25)) // Reduced to 25ms
    }
  }
  
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  const availableResults = results.filter(r => r.available === true)
  
  console.log(`✅ Completed ${results.length} checks in ${elapsed}s, found ${availableResults.length} available`)
  
  return {
    success: true,
    found: availableResults.length > 0,
    appointments: availableResults,
    summary: {
      totalChecked: results.length,
      elapsed: elapsed,
      mode: 'parallel_scan',
      hasAvailable: availableResults.length > 0,
      completedAt: new Date().toISOString()
    }
  }
}

// ULTRA-FAST: Minimal database operations
async function updateExpiredSubscriptions() {
  const currentDateStr = formatDateIsrael(getCurrentDateIsrael())
  
  // Single query to update all expired subscriptions
  const { error } = await supabase
    .from('notifications')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('status', 'active')
    .or(`criteria->date.lt.${currentDateStr},criteria->end.lt.${currentDateStr}`)
  
  if (error) {
    console.error('Error updating expired subscriptions:', error)
  } else {
    console.log('Updated expired subscriptions')
  }
}

// ============================================================================
// MAIN NETLIFY FUNCTION - HYPER-OPTIMIZED FOR <8 SECONDS
// ============================================================================
exports.handler = async (event, context) => {
  try {
    console.log('🚀 AUTO-CHECK: Starting hyper-optimized execution')
    const functionStart = Date.now()
    
    // PARALLEL EXECUTION: Start both operations simultaneously
    const [appointmentResults, _] = await Promise.all([
      findAppointmentsHyperSpeed(),
      updateExpiredSubscriptions() // Run in parallel, don't wait for result
    ])
    
    if (!appointmentResults.success) {
      throw new Error('Failed to check appointments')
    }
    
    // MINIMAL DATABASE WRITE: Only store essential data
    const essentialData = {
      timestamp: Date.now(),
      found: appointmentResults.found,
      count: appointmentResults.appointments.length,
      summary: appointmentResults.summary,
      // Store only first 5 appointments to reduce payload size
      preview: appointmentResults.appointments.slice(0, 5)
    }
    
    // Non-blocking cache write
    supabase
      .from('cache')
      .upsert([{ key: 'auto-check-minimal', value: essentialData }])
      .then(() => console.log('Cache updated'))
      .catch(err => console.error('Cache error:', err))
    
    const totalTime = Math.round((Date.now() - functionStart) / 1000)
    console.log(`⚡ FUNCTION COMPLETED in ${totalTime}s (target: <8s)`)
    
    // TRIGGER EMAIL PROCESSING: Signal frontend to handle emails
    const shouldTriggerEmails = appointmentResults.found && appointmentResults.appointments.length > 0
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30' // Shorter cache for real-time updates
      },
      body: JSON.stringify({
        success: true,
        executionTime: totalTime,
        data: {
          found: appointmentResults.found,
          appointmentCount: appointmentResults.appointments.length,
          summary: appointmentResults.summary,
          // Return trigger signal for frontend email processing
          triggerEmails: shouldTriggerEmails,
          appointments: appointmentResults.appointments
        },
        meta: {
          cacheKey: 'auto-check-minimal',
          nextCheckIn: '5 minutes',
          optimizedFor: 'speed',
          executionTarget: '<8 seconds'
        }
      })
    }
    
  } catch (error) {
    const totalTime = Math.round((Date.now() - functionStart) / 1000)
    console.error(`❌ FUNCTION FAILED in ${totalTime}s:`, error.message)
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        executionTime: totalTime
      })
    }
  }
} 