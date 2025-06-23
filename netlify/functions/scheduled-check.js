const fetch = require('node-fetch')

// Netlify Functions handler
exports.handler = async (event, context) => {
  try {
    console.log('scheduled-check: Function called')
    
    // Get the site URL from environment
    const siteUrl = process.env.URL || 'https://your-site.netlify.app'
    
    console.log(`scheduled-check: Triggering auto-check at ${siteUrl}`)
    
    // Set up timeout for the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000) // 10 minute timeout
    
    // Trigger the auto-check function
    const response = await fetch(`${siteUrl}/.netlify/functions/auto-check`, {
      method: 'GET',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    const result = await response.json()
    
    if (response.ok) {
      if (result.skipped) {
        console.log('scheduled-check: Auto-check skipped (already running or locked)')
      } else if (result.result?.summary?.found) {
        console.log(`scheduled-check: Found appointment on ${result.result.summary.date}`)
      } else {
        console.log('scheduled-check: No appointments found')
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Scheduled check completed',
          result: result
        })
      }
    } else if (response.status === 429) {
      console.log('scheduled-check: Rate limited (normal)')
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Rate limited (normal)',
          skipped: true
        })
      }
    } else {
      console.error('scheduled-check: Auto-check failed with status:', response.status)
      return {
        statusCode: 200, // Don't fail the scheduled function
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: `HTTP ${response.status}`,
          result: result
        })
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('scheduled-check: Function timed out after 10 minutes')
      return {
        statusCode: 200, // Don't fail the scheduled function
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Function timeout'
        })
      }
    }
    
    console.error('scheduled-check: Function failed:', error)
    return {
      statusCode: 200, // Don't fail the scheduled function
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
} 