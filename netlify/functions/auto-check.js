const axios = require('axios')
const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js')
const nodemailer = require('nodemailer')

// Supabase client setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

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

// OPTIMIZED: Ultra-fast single date check with reduced timeout
async function checkSingleDateOptimized(dateStr) {
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

    // SPEED OPTIMIZATION: Reduced timeout from 15s to 5s
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
      timeout: 5000, // REDUCED from 15000ms to 5000ms
      responseType: 'arraybuffer'
    })

    // SPEED OPTIMIZATION: Faster parsing
    const $ = cheerio.load(response.data)
    
    // Quick check for "no appointments" message
    const dangerText = $('h4.tx-danger').text()
    if (dangerText.includes('לא נשארו תורים פנויים')) {
      return {
        date: dateStr,
        available: false,
        message: 'No appointments available',
        times: []
      }
    }

    // Quick check for appointment time buttons
    const availableTimes = []
    $('button.btn.btn-outline-dark.btn-block').each((_, element) => {
      const timeText = $(element).text().trim()
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
        available: false,
        message: 'No appointments available',
        times: []
      }
    }
  } catch (error) {
    return {
      date: dateStr,
      available: null,
      message: `Error: ${error.message}`,
      times: []
    }
  }
}

// ULTRA-OPTIMIZED: Parallel processing with batches
async function findClosestAppointmentOptimized() {
  console.log('auto-check: 🚀 ULTRA-SPEED MODE - Checking all dates in parallel!')
  const startTime = Date.now()
  
  const currentDate = getCurrentDateIsrael()
  const maxDays = 30
  const openDates = getOpenDays(currentDate, maxDays)
  
  console.log(`auto-check: Will check ${openDates.length} dates in PARALLEL for maximum speed`)
  
  // PARALLEL OPTIMIZATION: Process dates in batches of 5 simultaneously
  const BATCH_SIZE = 5
  const results = []
  
  for (let i = 0; i < openDates.length; i += BATCH_SIZE) {
    const batch = openDates.slice(i, i + BATCH_SIZE)
    const batchPromises = batch.map(date => {
      const dateStr = formatDateIsrael(date)
      return checkSingleDateOptimized(dateStr)
    })
    
    // Process batch in parallel
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    const elapsed = Date.now() - startTime
    console.log(`auto-check: Batch ${Math.floor(i/BATCH_SIZE) + 1} completed - ${results.length}/${openDates.length} dates checked in ${elapsed}ms`)
    
    // Check if we found an appointment (early exit for speed)
    const foundAppointment = batchResults.find(r => r.available === true && r.times.length > 0)
    if (foundAppointment) {
      console.log(`auto-check: 🎉 Found appointment on ${foundAppointment.date} - EARLY EXIT after ${results.length} checks`)
      return {
        results: [foundAppointment],
        summary: {
          mode: 'closest',
          found: true,
          date: foundAppointment.date,
          times: foundAppointment.times,
          totalChecked: results.length,
          message: `התור הקרוב ביותר נמצא ב-${foundAppointment.date}`,
          elapsed: Math.round((Date.now() - startTime) / 1000)
        }
      }
    }
    
    // Small delay between batches to avoid overwhelming server
    if (i + BATCH_SIZE < openDates.length) {
      await new Promise(resolve => setTimeout(resolve, 50)) // Minimal 50ms delay
    }
  }
  
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`auto-check: ✅ Completed all ${results.length} checks in ${elapsed}s`)
  
  return {
    results: results,
    summary: {
      mode: 'closest',
      found: false,
      totalChecked: results.length,
      message: `לא נמצאו תורים פנויים (נבדקו ${results.length} תאריכים ב-${elapsed} שניות)`,
      elapsed: elapsed,
      completedAt: new Date().toISOString()
    }
  }
}

// Netlify Functions handler - OPTIMIZED FOR SPEED
exports.handler = async (event, context) => {
  try {
    console.log('auto-check: 🚀 SPEED-OPTIMIZED function starting (target: <10 seconds)')
    const startTime = Date.now()
    
    const result = await findClosestAppointmentOptimized()
    
    // Store result with timestamp in Supabase
    const cacheData = {
      timestamp: Date.now(),
      result: result
    }
    const { error } = await supabase
      .from('cache')
      .upsert([{ key: 'auto-check', value: cacheData }])
    if (error) {
      console.error('auto-check: Failed to write cache to Supabase:', error)
    } else {
      console.log('auto-check: Cache written to Supabase')
    }
    
    // 1. Fetch notification requests from Supabase
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
    if (notifError) {
      console.error('Error fetching notifications:', notifError)
    } else if (notifications && notifications.length > 0 && result.summary.found && result.summary.date) {
      for (const notif of notifications) {
        let match = false;
        if (notif.criteria_type === 'single' && notif.criteria && notif.criteria.date === result.summary.date) {
          match = true;
        } else if (notif.criteria_type === 'range' && notif.criteria && notif.criteria.start && notif.criteria.end) {
          if (result.summary.date >= notif.criteria.start && result.summary.date <= notif.criteria.end) {
            match = true;
          }
        }
        if (match) {
          // 2. Send email
          const unsubscribeUrl = `https://tor-ramel.netlify.app/api/unsubscribe?token=${notif.unsubscribe_token}`
          const availableTimes = Array.isArray(result.summary.times) && result.summary.times.length > 0
            ? result.summary.times.join(', ')
            : 'לא צוינו זמנים';
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_SENDER,
              pass: process.env.EMAIL_APP_PASSWORD,
            },
          })
          const mailOptions = {
            from: `"Barber Alert" <${process.env.EMAIL_SENDER}>`,
            to: notif.email,
            subject: 'תור פנוי במספרת רם-אל!',
            text: `נמצא תור פנוי לתאריך ${result.summary.date}.
זמנים פנויים: ${availableTimes}
להסרה מההתראות: ${unsubscribeUrl}`,
            html: `<p>נמצא תור פנוי לתאריך <b>${result.summary.date}</b>.</p><p>זמנים פנויים: <b>${availableTimes}</b></p><p><a href="${unsubscribeUrl}">להסרה מההתראות</a></p>`
          }
          try {
            await transporter.sendMail(mailOptions)
            // 3. Delete notification after sending (one-time)
            await supabase.from('notifications').delete().eq('id', notif.id)
          } catch (err) {
            console.error('Error sending notification email:', err)
          }
        }
      }
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000)
    console.log(`auto-check: ✅ Function completed in ${totalTime}s`)
    console.log('auto-check: Final result:', JSON.stringify(result.summary, null, 2))
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: `Auto-check completed in ${totalTime}s`,
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