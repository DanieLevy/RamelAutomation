// Netlify scheduled function to process email queue
// Runs every 5 minutes to handle retries and new emails

exports.handler = async (event, context) => {
  console.log('📧 Netlify function: process-email-queue triggered');
  
  try {
    // Call the Next.js API endpoint
    const response = await fetch(`${process.env.URL || 'https://tor-ramel.netlify.app'}/api/process-email-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`
      },
      body: JSON.stringify({
        limit: 10 // Process up to 10 emails per run
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log('📧 Email queue processed successfully:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email queue processed successfully',
        processed: data.processed,
        errors: data.errors,
        queueStats: data.queueStats,
        circuitBreaker: data.circuitBreaker
      })
    };

  } catch (error) {
    console.error('📧 Failed to process email queue:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process email queue',
        details: error.message
      })
    };
  }
};

// Schedule configuration for Netlify
exports.config = {
  schedule: "*/5 * * * *" // Run every 5 minutes
}; 