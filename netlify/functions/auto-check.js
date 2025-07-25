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
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY, // Use service role key if available
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
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
  
  // Enhanced safety limit to handle up to a year
  const maxDaysToCheck = Math.min(totalDays * 2, 500) // Allow checking up to 500 days
  
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
    console.log(`💾 Cache hit for ${dateStr}`)
    return cached.data
  }
  
  performanceMetrics.cacheMisses++
  console.log(`🔍 Checking ${dateStr} (attempt ${retryCount + 1})...`)
  
  try {
    const startTime = Date.now()
    
    const userId = process.env.USER_ID || '4481'
    const codeAuth = process.env.CODE_AUTH || 'Sa1W2GjL'
    
    console.log(`🔐 Using credentials: userId=${userId}, codeAuth=${codeAuth.substring(0, 4)}****`)
    
    const params = {
      i: 'cmFtZWwzMw==', // ramel33
      s: 'MjY1',         // 265
      mm: 'y',
      lang: 'he',
      datef: dateStr
    }

    const url = 'https://mytor.co.il/home.php'
    console.log(`🌐 Fetching: ${url}?${new URLSearchParams(params).toString()}`)

    const response = await axiosInstance.get(url, {
      params,
      headers: {
        'Cookie': `userID=${userId}; codeAuth=${codeAuth}`,
        'Referer': 'https://mytor.co.il'
      }
    })

    performanceMetrics.apiCalls++
    performanceMetrics.totalResponseTime += (Date.now() - startTime)
    
    console.log(`📡 Response received for ${dateStr}: status=${response.status}, size=${response.data.length} bytes`)

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
    
    // Log page title to verify we're on the right page
    const pageTitle = $('title').text()
    console.log(`📄 Page title for ${dateStr}: "${pageTitle}"`)
    
    // Enhanced appointment detection
    const dangerText = $('h4.tx-danger').text()
    const alertText = $('.alert-danger').text()
    
    console.log(`🔍 Danger text: "${dangerText}"`)
    console.log(`🔍 Alert text: "${alertText}"`)
    
    const noAppointmentsMessages = [
      'לא נשארו תורים פנויים',
      'אין תורים זמינים',
      'no appointments available'
    ]
    
    const hasNoAppointments = noAppointmentsMessages.some(msg => 
      dangerText.includes(msg) || alertText.includes(msg)
    )
    
    if (hasNoAppointments) {
      console.log(`❌ No appointments message found for ${dateStr}`)
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
    
    console.log(`🔍 Looking for time buttons with selectors...`)
    
    for (const selector of timeSelectors) {
      const timeButtons = $(selector)
      console.log(`   ${selector}: found ${timeButtons.length} elements`)
      
      if (timeButtons.length > 0) {
        for (let i = 0; i < timeButtons.length; i++) {
          const element = $(timeButtons[i])
          const timeText = element.text().trim()
          const elementHtml = element.html()
          console.log(`     Element ${i}: text="${timeText}", html="${elementHtml?.substring(0, 100)}..."`)
          
          if (/^\d{1,2}:\d{2}$/.test(timeText) && !availableTimes.includes(timeText)) {
            availableTimes.push(timeText)
            console.log(`     ✅ Valid time found: ${timeText}`)
          }
        }
        break // Use first successful selector
      }
    }
    
    // If no times found with selectors, let's check the raw HTML
    if (availableTimes.length === 0) {
      console.log(`🔍 No times found with selectors, checking raw HTML...`)
      const htmlContent = $.html()
      const timePattern = /\b([0-9]{1,2}:[0-9]{2})\b/g
      const matches = htmlContent.match(timePattern) || []
      console.log(`   Found ${matches.length} time patterns in HTML: ${matches.slice(0, 5).join(', ')}...`)
    }

    const result = {
      date: dateStr,
      available: availableTimes.length > 0,
      times: availableTimes.sort(), // Sort times for consistency
      message: availableTimes.length > 0 ? `Found ${availableTimes.length} appointments` : 'No appointments found'
    }
    
    console.log(`📊 Result for ${dateStr}: ${result.available ? '✅' : '❌'} ${result.message}`)
    
    // Cache successful results
    responseCache.set(cacheKey, { data: result, timestamp: Date.now() })
    cleanupCache()
    return result
    
  } catch (error) {
    performanceMetrics.errors++
    console.error(`❌ Error checking ${dateStr} (attempt ${retryCount + 1}):`, error.message)
    console.error(`   Error details:`, error.response?.status, error.response?.statusText)
    
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
  console.log(`📅 Current Israel time: ${new Date().toLocaleString('he-IL', { timeZone: ISRAEL_TIMEZONE })}`)
  const startTime = Date.now()
  
  // Reset performance metrics
  Object.keys(performanceMetrics).forEach(key => performanceMetrics[key] = 0)
  
  const currentDate = getCurrentDateIsrael()
  console.log(`📅 Starting from date: ${formatDateIsrael(currentDate)}`)
  
  // CHANGED: Check only 30 days instead of 365
  const maxDays = 30 // Check 30 days ahead as requested
  const openDates = getOpenDays(currentDate, maxDays)
  
  console.log(`📊 Will check ${openDates.length} open dates (30 days, excluding Monday/Saturday)`)
  console.log(`📊 First 5 dates to check: ${openDates.slice(0, 5).map(d => formatDateIsrael(d)).join(', ')}`)
  
  // INTELLIGENT CACHE CHECK: Look for recent cached results first
  const recentResults = []
  for (const date of openDates) { // Check ALL dates for cached results
    const dateStr = formatDateIsrael(date)
    const cached = responseCache.get(`apt_${dateStr}`)
    
    if (cached && 
        (Date.now() - cached.timestamp < CACHE_TTL) && 
        cached.data.available === true) {
      console.log(`⚡ Found cached available appointment for ${dateStr}`)
      recentResults.push(cached.data)
    }
  }
  
  // If we have ALL dates cached with recent data, return them
  if (recentResults.length === openDates.length) {
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.log(`🎯 FULL CACHE HIT: Found ${recentResults.length} dates from cache in ${elapsed}s`)
    
    // Sort by date to ensure nearest first
    recentResults.sort((a, b) => a.date.localeCompare(b.date))
    
    return {
      success: true,
      found: recentResults.some(r => r.available),
      appointments: recentResults.filter(r => r.available),
      summary: {
        totalChecked: recentResults.length,
        elapsed: elapsed,
        mode: 'full_cache_hit',
        hasAvailable: recentResults.some(r => r.available),
        completedAt: new Date().toISOString(),
        performance: performanceMetrics
      }
    }
  }
  
  // ADAPTIVE BATCHING: Optimize for 30 days within 10 seconds
  let BATCH_SIZE = 6 // Start with 6 parallel requests
  const results = []
  let checkedDates = new Set(recentResults.map(r => r.date))
  
  // Add cached results first
  results.push(...recentResults)
  
  for (let i = 0; i < openDates.length; i += BATCH_SIZE) {
    const batch = openDates.slice(i, i + BATCH_SIZE)
    const batchStartTime = Date.now()
    
    // Filter out already cached dates
    const datesToCheck = batch.filter(date => !checkedDates.has(formatDateIsrael(date)))
    
    if (datesToCheck.length === 0) {
      console.log(`📦 Batch ${Math.floor(i/BATCH_SIZE) + 1}: All dates cached, skipping`)
      continue
    }
    
    console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}: ${datesToCheck.map(d => formatDateIsrael(d)).join(', ')}`)
    
    const batchPromises = datesToCheck.map(date => {
      const dateStr = formatDateIsrael(date)
      checkedDates.add(dateStr)
      return checkSingleDateWithRetry(dateStr)
    })
    
    // Process batch with enhanced error handling
    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
        if (result.value.available) {
          console.log(`✅ Found available appointment on ${result.value.date}: ${result.value.times.length} slots [${result.value.times.join(', ')}]`)
        } else {
          console.log(`❌ No appointments on ${result.value.date}`)
        }
      } else {
        console.error(`🚨 Batch item failed:`, result.reason)
        results.push({
          date: formatDateIsrael(datesToCheck[idx]),
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
    if (batchTime < 600 && BATCH_SIZE < 10) {
      BATCH_SIZE = Math.min(BATCH_SIZE + 2, 10)
      console.log(`⚡ Performance good, increasing batch size to ${BATCH_SIZE}`)
    } else if (batchTime > 1500 && BATCH_SIZE > 4) {
      BATCH_SIZE = Math.max(BATCH_SIZE - 2, 4)
      console.log(`🐌 Performance slow, decreasing batch size to ${BATCH_SIZE}`)
    }
    
    // STRICT TIME LIMIT: Stop at 9 seconds to leave buffer
    if (elapsed > 9000) {
      console.log(`⏰ TIME LIMIT: Stopping at ${elapsed}ms to stay under 10 seconds`)
      break
    }
    
    // Smart delay between batches (reduced for 30 days)
    if (i + BATCH_SIZE < openDates.length && datesToCheck.length > 0) {
      const delay = Math.min(20, Math.max(10, batchTime / 20))
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  
  // Sort results by date to ensure nearest appointments first
  results.sort((a, b) => a.date.localeCompare(b.date))
  
  const availableResults = results.filter(r => r.available === true)
  const errorResults = results.filter(r => r.available === null)
  
  console.log(`✅ Enhanced check completed: ${results.length} checked, ${availableResults.length} available, ${errorResults.length} errors in ${elapsed}s`)
  console.log(`📊 Performance: ${performanceMetrics.cacheHits} cache hits, ${performanceMetrics.apiCalls} API calls, avg response: ${Math.round(performanceMetrics.totalResponseTime / Math.max(performanceMetrics.apiCalls, 1))}ms`)
  
  if (availableResults.length > 0) {
    console.log(`🎯 Available appointments found:`, JSON.stringify(availableResults.slice(0, 3), null, 2))
  } else {
    console.log(`❌ No available appointments found in the next 30 days`)
  }
  
  return {
    success: true,
    found: availableResults.length > 0,
    appointments: availableResults,
    summary: {
      totalChecked: results.length,
      elapsed: elapsed,
      mode: '30_day_scan',
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
    // Update expired single day subscriptions
    const { error: singleError } = await supabase
      .from('notifications_simple')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active')
      .eq('subscription_type', 'single')
      .lt('target_date', currentDateStr)
    
    if (singleError) {
      console.error('Error updating expired single subscriptions:', singleError)
    }
    
    // Update expired range subscriptions
    const { error: rangeError } = await supabase
      .from('notifications_simple')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active')
      .eq('subscription_type', 'range')
      .lt('date_end', currentDateStr)
    
    if (rangeError) {
      console.error('Error updating expired range subscriptions:', rangeError)
    }
    
    console.log('Updated expired subscriptions')
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
    console.log(`🔧 Environment: URL=${process.env.URL}, DEPLOY_URL=${process.env.DEPLOY_URL}`)
    const functionStart = Date.now()
    
    // PARALLEL EXECUTION: Start both operations simultaneously
    const [appointmentResults, _] = await Promise.all([
      findAppointmentsEnhanced(),
      updateExpiredSubscriptions() // Run in parallel, don't wait for result
    ])
    
    if (!appointmentResults.success) {
      throw new Error('Failed to check appointments')
    }
    
    console.log(`📊 Appointment results summary:`, {
      success: appointmentResults.success,
      found: appointmentResults.found,
      appointmentCount: appointmentResults.appointments.length,
      firstAppointment: appointmentResults.appointments[0] || null
    })
    
    // ENHANCED DATABASE WRITE: Store full appointment data for email processing
    const cacheData = {
      timestamp: Date.now(),
      found: appointmentResults.found,
      count: appointmentResults.appointments.length,
      summary: appointmentResults.summary,
      // Store ALL appointments for email processing
      appointments: appointmentResults.appointments,
      // Flag to indicate emails need processing
      emailsProcessed: false,
      lastChecked: new Date().toISOString()
    }
    
    console.log(`💾 Saving to cache: ${appointmentResults.appointments.length} appointments`)
    
    // Non-blocking cache write with better error handling
    const cachePromise = supabase
      .from('cache')
      .upsert([{ 
        key: 'auto-check-results', 
        value: cacheData,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'key'
      })
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Cache write error:', error)
          return false
        } else {
          console.log('✅ Cache updated successfully')
          return true
        }
      })
      .catch(err => {
        console.error('❌ Cache error:', err)
        return false
      })
    
    // Wait for cache write to complete (but with timeout)
    const cacheWriteResult = await Promise.race([
      cachePromise,
      new Promise(resolve => setTimeout(() => resolve(false), 2000)) // 2 second timeout
    ])
    
    // INTEGRATED EMAIL PROCESSING - Process emails directly if appointments found
    let emailResult = { processed: false, message: 'No appointments to notify' }
    
    if (appointmentResults.found && appointmentResults.appointments.length > 0) {
      console.log('📧 Processing email notifications directly...')
      
      try {
        // Get active subscriptions
        const { data: subscriptions, error: subError } = await supabase
          .from('notifications_simple')
          .select('*')
          .eq('status', 'active')
        
        if (subError) {
          console.error('📧 ❌ Error fetching subscriptions:', subError)
          emailResult = {
            processed: false,
            message: `Database error: ${subError.message}`,
            error: subError
          }
        } else if (!subscriptions || subscriptions.length === 0) {
          console.log('📧 ℹ️ No active subscriptions found')
          emailResult = {
            processed: true,
            message: 'No active subscriptions',
            emailsQueued: 0,
            emailsSkipped: 0
          }
        } else {
          console.log(`📧 Found ${subscriptions.length} active subscriptions`)
          
          // Process each subscription (simplified version)
          let emailsQueued = 0
          let emailsSkipped = 0
          let errors = []
          
          for (const subscription of subscriptions) {
            try {
              console.log(`📧 Processing subscription ${subscription.id} for ${subscription.email}`)
              
              // Check if we've already sent these appointments
              const appointmentIds = appointmentResults.appointments.map(a => `${a.date}_${a.times.join('_')}`)
              console.log(`📧 Checking ${appointmentIds.length} appointment IDs for duplicates`)
              
              const { data: sentAppointments, error: sentError } = await supabase
                .from('sent_appointments')
                .select('appointment_date, appointment_times')
                .eq('notification_id', subscription.id)
              
              if (sentError) {
                console.error(`📧 ❌ Error checking sent appointments:`, sentError)
                errors.push(`Sent check error for ${subscription.email}: ${sentError.message}`)
                continue
              }
              
              // Create a set of already sent appointment combinations
              const sentIds = new Set()
              if (sentAppointments && sentAppointments.length > 0) {
                sentAppointments.forEach(sent => {
                  const id = `${sent.appointment_date}_${sent.appointment_times.join('_')}`
                  sentIds.add(id)
                })
              }
              
              const newAppointments = appointmentResults.appointments.filter(a => 
                !sentIds.has(`${a.date}_${a.times.join('_')}`)
              )
              
              console.log(`📧 Found ${newAppointments.length} new appointments for ${subscription.email} (${sentIds.size} already sent)`)
              
              if (newAppointments.length > 0) {
                console.log(`📧 Queueing email for ${subscription.email} with ${newAppointments.length} new appointments`)
                
                // Queue email
                const { data: queueData, error: queueError } = await supabase
                  .from('email_queue')
                  .insert({
                    email_to: subscription.email,
                    email_subject: `${newAppointments.length} New Appointments Available - Tor Ramel`,
                    email_html: 'Will be generated by email processor',
                    email_text: 'Will be generated by email processor',
                    appointment_data: {
                      appointments: newAppointments,
                      notificationId: subscription.id,
                      subscriptionEmail: subscription.email
                    },
                    status: 'pending',
                    attempts: 0,
                    max_attempts: 3,
                    priority: 1,
                    created_at: new Date().toISOString()
                  })
                
                if (queueError) {
                  console.error(`📧 ❌ Error queueing email:`, queueError)
                  errors.push(`Queue error for ${subscription.email}: ${queueError.message}`)
                } else {
                  console.log(`📧 ✅ Email queued successfully for ${subscription.email}`)
                  emailsQueued++
                  
                  // Mark appointments as sent
                  const sentRecords = newAppointments.map(apt => ({
                    notification_id: subscription.id,
                    appointment_date: apt.date,
                    appointment_times: apt.times,
                    sent_at: new Date().toISOString()
                  }))
                  
                  const { error: markError } = await supabase
                    .from('sent_appointments')
                    .insert(sentRecords)
                  
                  if (markError) {
                    console.error(`📧 ⚠️ Warning: Failed to mark appointments as sent:`, markError)
                  }
                }
              } else {
                console.log(`📧 ⏭️ Skipping ${subscription.email} - no new appointments`)
                emailsSkipped++
              }
            } catch (subError) {
              console.error(`📧 ❌ Error processing subscription ${subscription.id}:`, subError)
              errors.push(`Processing error for ${subscription.email}: ${subError.message}`)
            }
          }
          
          emailResult = {
            processed: true,
            message: `Processed ${subscriptions.length} subscriptions`,
            emailsQueued,
            emailsSkipped,
            errors: errors.length > 0 ? errors : undefined
          }
          
          console.log(`📧 Email processing complete: ${emailsQueued} queued, ${emailsSkipped} skipped, ${errors.length} errors`)
        }
      } catch (emailError) {
        console.error('📧 ❌ Fatal email processing error:', emailError)
        console.error('📧 ❌ Error stack:', emailError.stack)
        emailResult = {
          processed: false,
          message: `Email error: ${emailError.message}`,
          error: emailError.message
        }
      }
    } else {
      console.log('📧 ℹ️ No appointments found, skipping email processing')
    }
    
    const totalTime = Math.round((Date.now() - functionStart) / 1000)
    console.log(`⚡ FUNCTION COMPLETED in ${totalTime}s (target: <8s)`)
    
    const responseBody = {
      success: true,
      executionTime: totalTime,
      data: {
        found: appointmentResults.found,
        appointmentCount: appointmentResults.appointments.length,
        summary: appointmentResults.summary,
        appointments: appointmentResults.appointments,
        cacheUpdated: cacheWriteResult,
        emailProcessing: emailResult
      },
      meta: {
        cacheKey: 'auto-check-results',
        nextCheckIn: '5 minutes',
        optimizedFor: 'speed',
        executionTarget: '<8 seconds',
        emailProcessing: 'integrated'
      }
    }
    
    console.log(`📤 Returning response with ${appointmentResults.appointments.length} appointments`)
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30' // Shorter cache for real-time updates
      },
      body: JSON.stringify(responseBody)
    }
    
  } catch (error) {
    const totalTime = Math.round((Date.now() - functionStart) / 1000)
    console.error(`❌ FUNCTION FAILED in ${totalTime}s:`, error.message)
    console.error(`❌ Stack trace:`, error.stack)
    
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

// Schedule configuration for Netlify
exports.config = {
  schedule: "@every 5m"  // Run every 5 minutes
} 