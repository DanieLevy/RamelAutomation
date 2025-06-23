import { NextApiRequest, NextApiResponse } from 'next'
import * as fs from 'fs'
import * as path from 'path'

const CACHE_FILE_PATH = path.join(process.cwd(), 'cache.json')
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  try {
    // Try to read from file cache
    const fileCache = readCacheFromFile()
    
    if (fileCache) {
      const now = Date.now()
      const age = now - fileCache.timestamp
      
      if (age <= CACHE_DURATION) {
        return res.status(200).json({
          ...fileCache.result,
          cached: true,
          cacheAge: Math.floor(age / 1000 / 60), // Age in minutes
          lastCheck: new Date(fileCache.timestamp).toLocaleString('he-IL', {
            timeZone: 'Asia/Jerusalem'
          })
        })
      }
    }
    
    // No cached result or cache expired
    return res.status(200).json({
      cached: false,
      message: 'אין תוצאות זמינות - בדיקה אוטומטית לא הושלמה עדיין',
      suggestion: 'לחץ על "חפש תור קרוב" לבדיקה ידנית'
    })
  } catch (error) {
    console.error('Error getting cached result:', error)
    return res.status(200).json({
      cached: false,
      message: 'אין תוצאות זמינות - שגיאה בגישה לקובץ המטמון',
      suggestion: 'לחץ על "חפש תור קרוב" לבדיקה ידנית',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 