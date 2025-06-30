// Netlify scheduled function for data cleanup and maintenance
// Runs daily at 3 AM to clean up expired tokens, archive old data, etc.

exports.handler = async (event, context) => {
  console.log('🧹 Netlify function: data-cleanup triggered');
  
  try {
    // Call the Next.js API endpoint
    const response = await fetch(`${process.env.URL || 'https://tor-ramel.netlify.app'}/api/data-cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`
      },
      body: JSON.stringify({
        operation: 'all' // Run all cleanup operations
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log('🧹 Data cleanup completed successfully:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data cleanup completed successfully',
        results: data.results,
        processingTime: data.processingTime
      })
    };

  } catch (error) {
    console.error('🧹 Failed to run data cleanup:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to run data cleanup',
        details: error.message
      })
    };
  }
};

// Schedule configuration for Netlify
// Run daily at 3 AM
exports.config = {
  schedule: "0 3 * * *"
}; 