import type { Context } from '@netlify/functions'
import * as fs from 'fs'
import * as path from 'path'

const CACHE_FILE_PATH = process.env.NETLIFY ? '/tmp/cache.json' : path.join(process.cwd(), 'cache.json')

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

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export default async (req: Request, context: Context) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    })
  }
  
  try {
    // Try to read from file cache first
    const fileCache = readCacheFromFile()
    if (fileCache) {
      const now = Date.now()
      const age = now - fileCache.timestamp
      if (age <= CACHE_DURATION) {
        return new Response(JSON.stringify({
          ...fileCache.result,
          cached: true,
          cacheAge: Math.floor(age / 1000 / 60), // Age in minutes
          lastCheck: new Date(fileCache.timestamp).toLocaleString('he-IL', {
            timeZone: 'Asia/Jerusalem'
          })
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
          }
        })
      }
    }
    
    // No cached result or cache expired or file missing
    return new Response(JSON.stringify({
      cached: false,
      message: 'אין תוצאות זמינות - בדיקה אוטומטית לא הושלמה עדיין',
      suggestion: 'לחץ על "חפש תור קרוב" לבדיקה ידנית'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    })
  } catch (error) {
    // Defensive: never throw 500 for missing cache, only for true server errors
    console.error('Error getting cached result:', error)
    return new Response(JSON.stringify({
      cached: false,
      message: 'אין תוצאות זמינות - שגיאה בגישה לקובץ המטמון',
      suggestion: 'לחץ על "חפש תור קרוב" לבדיקה ידנית',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    })
  }
} 