import { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  console.log('Scheduled check triggered at:', new Date().toISOString())
  
  try {
    // Trigger the background function
    const response = await fetch(`${process.env.URL}/.netlify/functions/auto-check-background`, {
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
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Scheduled check completed',
        backgroundResult: result
      })
    }
  } catch (error) {
    console.error('Scheduled check failed:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
} 