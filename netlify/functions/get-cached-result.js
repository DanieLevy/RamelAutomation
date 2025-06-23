const fs = require('fs')
const path = require('path')

// Check multiple environment indicators for Netlify
const isNetlify = process.env.NETLIFY || process.env.NETLIFY_BUILD_BASE || process.env.AWS_LAMBDA_FUNCTION_NAME
const CACHE_FILE_PATH = isNetlify ? '/tmp/cache.json' : path.join(process.cwd(), 'cache.json')

function readCacheFromFile() {
  try {
    console.log(`get-cached-result: Checking cache file at: ${CACHE_FILE_PATH}`)
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8')
      const data = JSON.parse(raw)
      console.log(`get-cached-result: Cache file found, timestamp: ${data.timestamp}`)
      return data
    } else {
      console.log('get-cached-result: Cache file does not exist')
    }
  } catch (err) {
    console.error('get-cached-result: Failed to read cache file:', err)
  }
  return null
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

exports.handler = async (event, context) => {
  console.log('get-cached-result: Function called')
  console.log('get-cached-result: HTTP Method:', event.httpMethod)
  console.log('get-cached-result: Headers:', JSON.stringify(event.headers, null, 2))
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('get-cached-result: Handling CORS preflight')
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    }
  }
  
  try {
    
    // Try to read from file cache first
    const fileCache = readCacheFromFile()
    if (fileCache) {
      const now = Date.now()
      const age = now - fileCache.timestamp
      if (age <= CACHE_DURATION) {
        console.log('get-cached-result: Returning cached result, age:', Math.floor(age / 1000 / 60), 'minutes')
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
          },
          body: JSON.stringify({
            ...fileCache.result,
            cached: true,
            cacheAge: Math.floor(age / 1000 / 60), // Age in minutes
            lastCheck: new Date(fileCache.timestamp).toLocaleString('he-IL', {
              timeZone: 'Asia/Jerusalem'
            })
          })
        }
      }
    }
    
    console.log('get-cached-result: No valid cache found')
    // No cached result or cache expired or file missing
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        cached: false,
        message: 'אין תוצאות זמינות - בדיקה אוטומטית לא הושלמה עדיין',
        suggestion: 'לחץ על "חפש תור קרוב" לבדיקה ידנית'
      })
    }
  } catch (error) {
    // Defensive: never throw 500 for missing cache, only for true server errors
    console.error('Error getting cached result:', error)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        cached: false,
        message: 'אין תוצאות זמינות - שגיאה בגישה לקובץ המטמון',
        suggestion: 'לחץ על "חפש תור קרוב" לבדיקה ידנית',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
} 