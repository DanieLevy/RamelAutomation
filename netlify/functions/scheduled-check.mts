import type { Context } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  console.log('Scheduled check triggered at:', new Date().toISOString())
  
  try {
    // Get the site URL from environment
    const siteUrl = Netlify.env.get('URL') || 'https://your-site.netlify.app'
    
    // Set up timeout for the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000) // 10 minute timeout
    
    // Trigger the auto-check function (GET request, not POST)
    const response = await fetch(`${siteUrl}/.netlify/functions/auto-check`, {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    const result = await response.json()
    
    if (response.ok) {
      if (result.skipped) {
        console.log('Scheduled auto-check skipped (already running or locked)')
      } else {
        console.log('Scheduled auto-check completed successfully:', result.result?.summary)
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Scheduled check completed',
        result: result
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } else if (response.status === 429) {
      console.log('Scheduled auto-check rate limited - this is normal')
      return new Response(JSON.stringify({
        success: true,
        message: 'Rate limited (normal)',
        skipped: true
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } else {
      console.error('Scheduled auto-check failed with status:', response.status)
      return new Response(JSON.stringify({
        success: false,
        error: `HTTP ${response.status}`,
        result: result
      }), {
        status: 200, // Don't fail the scheduled function
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Scheduled check timed out after 10 minutes')
      return new Response(JSON.stringify({
        success: false,
        error: 'Function timeout'
      }), {
        status: 200, // Don't fail the scheduled function
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    
    console.error('Scheduled check failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200, // Don't fail the scheduled function
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 