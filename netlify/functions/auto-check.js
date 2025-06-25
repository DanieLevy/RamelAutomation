const axios = require('axios')
const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js')
const nodemailer = require('nodemailer')
const http = require('http')
const https = require('https')

// For Node.js environments that don't have fetch built-in
const fetch = global.fetch || require('node-fetch')

// ============================================================================
// ULTRA-OPTIMIZED AUTO-CHECK FUNCTION WITH ENHANCED ROBUSTNESS
// Target: Complete execution under 8 seconds with maximum reliability
// Strategy: Focus on appointment checking with smart error recovery
// ============================================================================

// Create persistent HTTP agents for connection reuse with enhanced settings
const httpAgent = new http.Agent({ 
  keepAlive: true, 
  maxSockets: 20, // Increased for better concurrency
  timeout: 5000,
  keepAliveMsecs: 1000 
})
const httpsAgent = new https.Agent({ 
  keepAlive: true, 
  maxSockets: 20, 
  rejectUnauthorized: false,
  timeout: 5000,
  keepAliveMsecs: 1000
})

// Create optimized axios instance with enhanced reliability
const axiosInstance = axios.create({
  httpAgent,
  httpsAgent,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  },
  timeout: 4000, // Slightly increased for reliability
  responseType: 'arraybuffer',
  maxRedirects: 3,
  validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
})

// Enhanced caching system with performance metrics
const responseCache = new Map()
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  apiCalls: 0,
  errors: 0,
  totalResponseTime: 0
}
const CACHE_TTL = 120 * 1000 // 2 minutes for better reliability
const MAX_CACHE_SIZE = 100 // Prevent memory issues

// Supabase client setup with enhanced error handling
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'auto-check-function'
      }
    }
  }
)

// Israel timezone utilities (enhanced)
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
  
  // Enhanced safety limit with better logic
  const maxDaysToCheck = Math.min(totalDays * 2, 60) // More flexible
  
  while (openDays.length < totalDays && daysChecked < maxDaysToCheck) {
    if (!isClosedDay(currentDate)) {
      openDays.push(new Date(currentDate))
    }
    currentDate = addDaysIsrael(currentDate, 1)
    daysChecked++
  }
  
  return openDays
}

// Cache management functions
const cleanupCache = () => {
  if (responseCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(responseCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2)
    for (let i = 0; i < toRemove; i++) {
      responseCache.delete(entries[i][0])
    }
    
    console.log(`🧹 Cache cleanup: removed ${toRemove} old entries`)
  }
}

// ENHANCED: Single date check with retry logic and better error handling
async function checkSingleDateWithRetry(dateStr, retryCount = 0) {
  const maxRetries = 2
  const cacheKey = `apt_${dateStr}`
  const cached = responseCache.get(cacheKey)
  
  // Check cache first
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    performanceMetrics.cacheHits++
    return cached.data
  }
  
  performanceMetrics.cacheMisses++
  
  try {
    const startTime = Date.now()
    
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
        'Cookie': `userID=${userId}; codeAuth=${codeAuth}`,
        'Referer': 'https://mytor.co.il'
      }
    })

    performanceMetrics.apiCalls++
    performanceMetrics.totalResponseTime += (Date.now() - startTime)

    // Enhanced cheerio loading with error handling
    let $
    try {
      $ = cheerio.load(response.data, {
        normalizeWhitespace: false,
        decodeEntities: false,
        xmlMode: false
      })
    } catch (parseError) {
      console.error(`📄 HTML parsing error for ${dateStr}:`, parseError.message)
      throw new Error('Failed to parse HTML response')
    }
    
    // Enhanced appointment detection
    const dangerText = $('h4.tx-danger').text()
    const alertText = $('.alert-danger').text()
    const noAppointmentsMessages = [
      'לא נשארו תורים פנויים',
      'אין תורים זמינים',
      'no appointments available'
    ]
    
    const hasNoAppointments = noAppointmentsMessages.some(msg => 
      dangerText.includes(msg) || alertText.includes(msg)
    )
    
    if (hasNoAppointments) {
      const result = { date: dateStr, available: false, times: [], message: 'No appointments available' }
      responseCache.set(cacheKey, { data: result, timestamp: Date.now() })
      cleanupCache()
      return result
    }

    // Enhanced time extraction with multiple selectors
    const availableTimes = []
    const timeSelectors = [
      'button.btn.btn-outline-dark.btn-block',
      'button[data-time]',
      '.time-slot',
      '.appointment-time'
    ]
    
    for (const selector of timeSelectors) {
      const timeButtons = $(selector)
      if (timeButtons.length > 0) {
        for (let i = 0; i < timeButtons.length; i++) {
          const timeText = $(timeButtons[i]).text().trim()
          if (/^\d{1,2}:\d{2}$/.test(timeText) && !availableTimes.includes(timeText)) {
            availableTimes.push(timeText)
          }
        }
        break // Use first successful selector
      }
    }

    const result = {
      date: dateStr,
      available: availableTimes.length > 0,
      times: availableTimes.sort(), // Sort times for consistency
      message: availableTimes.length > 0 ? `Found ${availableTimes.length} appointments` : 'No appointments found'
    }
    
    // Cache successful results
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() })
    cleanupCache()
    return result
    
  } catch (error) {
    performanceMetrics.errors++
    console.error(`❌ Error checking ${dateStr} (attempt ${retryCount + 1}):`, error.message)
    
    // Retry logic for transient errors
    if (retryCount < maxRetries && isRetryableError(error)) {
      console.log(`🔄 Retrying ${dateStr} in ${(retryCount + 1) * 100}ms...`)
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 100))
      return checkSingleDateWithRetry(dateStr, retryCount + 1)
    }
    
    // Return error result
    return { 
      date: dateStr, 
      available: null, 
      times: [], 
      error: error.message,
      message: `Error: ${error.message}`
    }
  }
}

// Helper function to determine if error is retryable
const isRetryableError = (error) => {
  const retryableErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'timeout',
    'socket hang up'
  ]
  
  return retryableErrors.some(errType => 
    error.message.toLowerCase().includes(errType.toLowerCase()) ||
    error.code === errType
  )
}

// ENHANCED: Appointment finding with intelligent batching and recovery
async function findAppointmentsEnhanced() {
  console.log('🚀 ENHANCED AUTO-CHECK: Starting robust appointment search')
  const startTime = Date.now()
  
  // Reset performance metrics
  Object.keys(performanceMetrics).forEach(key => performanceMetrics[key] = 0)
  
  const currentDate = getCurrentDateIsrael()
  const maxDays = 30 // Restored to 30 for better coverage
  const openDates = getOpenDays(currentDate, maxDays)
  
  console.log(`📊 Will check ${openDates.length} dates with enhanced reliability`)
  
  // INTELLIGENT CACHE CHECK: Look for recent cached results first
  const recentResults = []
  for (const date of openDates.slice(0, 10)) { // Check first 10 dates
    const dateStr = formatDateIsrael(date)
    const cached = responseCache.get(`apt_${dateStr}`)
    
    if (cached && 
        (Date.now() - cached.timestamp < CACHE_TTL) && 
        cached.data.available === true) {
      console.log(`⚡ Found cached available appointment for ${dateStr}`)
      recentResults.push(cached.data)
    }
  }
  
  // If we have recent cached results, return them quickly
  if (recentResults.length > 0) {
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.log(`🎯 CACHE HIT: Found ${recentResults.length} appointments in ${elapsed}s`)
    
    return {
      success: true,
      found: true,
      appointments: recentResults,
      summary: {
        totalChecked: recentResults.length,
        elapsed: elapsed,
        mode: 'cache_hit',
        hasAvailable: true,
        completedAt: new Date().toISOString(),
        performance: performanceMetrics
      }
    }
  }
  
  // ADAPTIVE BATCHING: Start with smaller batches, increase if performance is good
  let BATCH_SIZE = 5
  const results = []
  let foundAny = false
  
  for (let i = 0; i < openDates.length; i += BATCH_SIZE) {
    const batch = openDates.slice(i, i + BATCH_SIZE)
    const batchStartTime = Date.now()
    
    const batchPromises = batch.map(date => {
      const dateStr = formatDateIsrael(date)
      return checkSingleDateWithRetry(dateStr)
    })
    
    // Process batch with enhanced error handling
    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
        if (result.value.available) foundAny = true
      } else {
        console.error(`🚨 Batch item failed:`, result.reason)
        results.push({
          date: formatDateIsrael(batch[idx]),
          available: null,
          times: [],
          error: result.reason?.message || 'Unknown error'
        })
      }
    })
    
    const elapsed = Date.now() - startTime
    const batchTime = Date.now() - batchStartTime
    
    console.log(`📦 Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${results.length}/${openDates.length} in ${batchTime}ms (total: ${elapsed}ms)`)
    
    // ADAPTIVE PERFORMANCE: Adjust batch size based on performance
    if (batchTime < 500 && BATCH_SIZE < 8) {
      BATCH_SIZE = Math.min(BATCH_SIZE + 1, 8)
      console.log(`⚡ Performance good, increasing batch size to ${BATCH_SIZE}`)
    } else if (batchTime > 1500 && BATCH_SIZE > 3) {
      BATCH_SIZE = Math.max(BATCH_SIZE - 1, 3)
      console.log(`🐌 Performance slow, decreasing batch size to ${BATCH_SIZE}`)
    }
    
    // INTELLIGENT EARLY EXIT
    if (elapsed > 6500) { // 6.5 second safety limit
      console.log(`⏰ TIME LIMIT: Stopping at ${elapsed}ms to avoid timeout`)
      break
    }
    
    // If we found appointments and have checked enough, consider early exit
    if (foundAny && elapsed > 2000 && results.length >= 15) {
      console.log(`🎯 EARLY EXIT: Found appointments after checking ${results.length} dates in ${elapsed}ms`)
      break
    }
    
    // Smart delay between batches
    if (i + BATCH_SIZE < openDates.length) {
      const delay = Math.max(10, Math.min(50, batchTime / 10)) // Adaptive delay
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  const availableResults = results.filter(r => r.available === true)
  const errorResults = results.filter(r => r.available === null)
  
  console.log(`✅ Enhanced check completed: ${results.length} checked, ${availableResults.length} available, ${errorResults.length} errors in ${elapsed}s`)
  console.log(`📊 Performance: ${performanceMetrics.cacheHits} cache hits, ${performanceMetrics.apiCalls} API calls, avg response: ${Math.round(performanceMetrics.totalResponseTime / Math.max(performanceMetrics.apiCalls, 1))}ms`)
  
  return {
    success: true,
    found: availableResults.length > 0,
    appointments: availableResults,
    summary: {
      totalChecked: results.length,
      elapsed: elapsed,
      mode: 'enhanced_parallel',
      hasAvailable: availableResults.length > 0,
      completedAt: new Date().toISOString(),
      performance: performanceMetrics,
      errors: errorResults.length
    }
  }
}

// ULTRA-FAST: Minimal database operations
async function updateExpiredSubscriptions() {
  const currentDateStr = formatDateIsrael(getCurrentDateIsrael())
  
  try {
    // Fix JSON query syntax - use proper PostgreSQL JSON operators
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active')
      .or(`criteria->>date.lt.${currentDateStr},criteria->>end.lt.${currentDateStr}`)
    
    if (error) {
      console.error('Error updating expired subscriptions:', error)
    } else {
      console.log('Updated expired subscriptions')
    }
  } catch (error) {
    console.error('Failed to update expired subscriptions:', error)
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
      findAppointmentsEnhanced(),
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
    
    // TRIGGER EMAIL PROCESSING: Actually process emails if appointments found
    let emailProcessingResult = null;
    const shouldTriggerEmails = appointmentResults.found && appointmentResults.appointments.length > 0;
    
    if (shouldTriggerEmails) {
      console.log(`📧 Found ${appointmentResults.appointments.length} appointments - triggering email processing`);
      
      try {
        // Call the email processing API directly
        const emailApiUrl = process.env.DEPLOY_URL || 'https://tor-ramel.netlify.app';
        const response = await fetch(`${emailApiUrl}/api/process-notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointments: appointmentResults.appointments
          })
        });

        if (response.ok) {
          emailProcessingResult = await response.json();
          console.log(`📧 ✅ Email processing completed: ${emailProcessingResult.emailsSent} sent, ${emailProcessingResult.emailsSkipped} skipped`);
        } else {
          console.error(`📧 ❌ Email processing failed with status: ${response.status}`);
          emailProcessingResult = { error: `HTTP ${response.status}` };
        }
      } catch (emailError) {
        console.error(`📧 ❌ Email processing error:`, emailError.message);
        emailProcessingResult = { error: emailError.message };
      }
    } else {
      console.log('📧 No appointments found - skipping email processing');
    }
    
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
          appointments: appointmentResults.appointments,
          emailProcessing: emailProcessingResult
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