const fetch = require('node-fetch')
const { createClient } = require('@supabase/supabase-js')

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
)

// ============================================================================
// PROCESS CACHED NOTIFICATIONS - Runs after auto-check to process emails
// ============================================================================
exports.handler = async (event, context) => {
  try {
    console.log('📧 PROCESS-CACHED-NOTIFICATIONS: Starting email processing')
    const functionStart = Date.now()
    
    // Fetch cached appointment results
    const { data: cacheData, error: cacheError } = await supabase
      .from('cache')
      .select('value')
      .eq('key', 'auto-check-results')
      .single()
    
    if (cacheError) {
      console.error('❌ Failed to fetch cache:', cacheError)
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch cached results'
        })
      }
    }
    
    if (!cacheData || !cacheData.value) {
      console.log('⚠️ No cached data found')
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No cached data to process'
        })
      }
    }
    
    const cachedResults = cacheData.value
    
    // Check if emails were already processed for this cache entry
    if (cachedResults.emailsProcessed) {
      console.log('✅ Emails already processed for this cache entry')
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Emails already processed',
          cacheTimestamp: cachedResults.timestamp
        })
      }
    }
    
    // Check if there are appointments to process
    if (!cachedResults.found || !cachedResults.appointments || cachedResults.appointments.length === 0) {
      console.log('ℹ️ No appointments found in cache - no emails to send')
      
      // Mark as processed
      await supabase
        .from('cache')
        .update({ 
          value: { ...cachedResults, emailsProcessed: true },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'auto-check-results')
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No appointments to notify about'
        })
      }
    }
    
    console.log(`📧 Found ${cachedResults.appointments.length} appointments to process`)
    
    try {
      // Call the email processing API
      const emailApiUrl = process.env.DEPLOY_URL || process.env.URL || 'https://tor-ramel.netlify.app'
      console.log(`📧 Calling email API at: ${emailApiUrl}/api/process-notifications`)
      
      const response = await fetch(`${emailApiUrl}/api/process-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`
        },
        body: JSON.stringify({
          appointments: cachedResults.appointments
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Email API failed with status ${response.status}: ${errorText}`)
      }
      
      const emailResult = await response.json()
      console.log(`📧 ✅ Email processing completed: ${emailResult.emailsQueued} queued, ${emailResult.emailsSent} sent, ${emailResult.emailsSkipped} skipped`)
      
      // Mark cache as processed
      await supabase
        .from('cache')
        .update({ 
          value: { 
            ...cachedResults, 
            emailsProcessed: true,
            emailProcessingResult: emailResult,
            emailProcessedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'auto-check-results')
      
      const totalTime = Math.round((Date.now() - functionStart) / 1000)
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          executionTime: totalTime,
          emailsQueued: emailResult.emailsQueued,
          emailsSent: emailResult.emailsSent,
          emailsSkipped: emailResult.emailsSkipped,
          cacheTimestamp: cachedResults.timestamp,
          appointmentsProcessed: cachedResults.appointments.length
        })
      }
      
    } catch (emailError) {
      console.error(`📧 ❌ Email processing error:`, emailError.message)
      
      // Mark cache as processed (even if failed, to avoid repeated failures)
      await supabase
        .from('cache')
        .update({ 
          value: { 
            ...cachedResults, 
            emailsProcessed: true,
            emailProcessingError: emailError.message,
            emailProcessedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'auto-check-results')
      
      const totalTime = Math.round((Date.now() - functionStart) / 1000)
      
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: emailError.message,
          executionTime: totalTime
        })
      }
    }
    
  } catch (error) {
    console.error(`❌ FUNCTION FAILED:`, error.message)
    console.error(`❌ Stack trace:`, error.stack)
    
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