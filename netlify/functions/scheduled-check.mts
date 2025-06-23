import type { Context } from '@netlify/functions'

export default async (req: Request, context: Context) => {
  console.log('Scheduled check triggered at:', new Date().toISOString())
  
  try {
    // Get the site URL from environment
    const siteUrl = Netlify.env.get('URL') || 'https://your-site.netlify.app'
    
    // Trigger the background function
    const response = await fetch(`${siteUrl}/.netlify/functions/auto-check-background`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: 'scheduled',
        timestamp: Date.now()
      })
    })
    
    const result = await response.json()
    
    console.log('Background check triggered successfully:', result)
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Scheduled check completed',
      backgroundResult: result
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Scheduled check failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 