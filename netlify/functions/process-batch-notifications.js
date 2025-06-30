// Netlify scheduled function to process batched notifications
// Runs every 30 minutes to handle batched and scheduled emails

exports.handler = async (event, context) => {
  console.log('📦 Netlify function: process-batch-notifications triggered');
  
  try {
    // Call the Next.js API endpoint
    const response = await fetch(`${process.env.URL || 'https://tor-ramel.netlify.app'}/api/process-batch-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log('📦 Batch notifications processed successfully:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Batch notifications processed successfully',
        processed: data.batchesProcessed,
        emailsQueued: data.emailsQueued,
        emailsSent: data.emailsSent
      })
    };

  } catch (error) {
    console.error('📦 Failed to process batch notifications:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process batch notifications',
        details: error.message
      })
    };
  }
};

// Schedule configuration for Netlify
// Run every 30 minutes
exports.config = {
  schedule: "*/30 * * * *"
}; 