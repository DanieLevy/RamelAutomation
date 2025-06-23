import { Handler } from '@netlify/functions'

// Simple in-memory cache (in production, use a database)
let cachedResult: {
  timestamp: number
  result: any
} | null = null

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }
  
  try {
    // Check if we have a cached result
    if (cachedResult) {
      const now = Date.now()
      const age = now - cachedResult.timestamp
      
      if (age <= CACHE_DURATION) {
        // Return cached result with metadata
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ...cachedResult.result,
            cached: true,
            cacheAge: Math.floor(age / 1000 / 60), // Age in minutes
            lastCheck: new Date(cachedResult.timestamp).toLocaleString('he-IL', {
              timeZone: 'Asia/Jerusalem'
            })
          })
        }
      } else {
        // Cache expired, clear it
        cachedResult = null
      }
    }
    
    // No cached result or cache expired
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        cached: false,
        message: 'אין תוצאות זמינות - בדיקה אוטומטית לא הושלמה עדיין',
        suggestion: 'לחץ על "חפש תור קרוב" לבדיקה ידנית'
      })
    }
  } catch (error) {
    console.error('Error getting cached result:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'שגיאה בקבלת תוצאות',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

// Function to update cache (called by background function)
export function updateCache(result: any) {
  cachedResult = {
    timestamp: Date.now(),
    result: result
  }
} 