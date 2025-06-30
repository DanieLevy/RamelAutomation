import type { NextApiRequest, NextApiResponse } from 'next';
import { emailService } from '@/lib/emailService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add authentication for manual triggers
  const authHeader = req.headers.authorization;
  const isManualTrigger = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  try {
    console.log('📧 Starting email queue processing...');
    const startTime = Date.now();

    // Get queue statistics before processing
    const statsBefore = await emailService.getQueueStats();
    console.log('📧 Queue stats before:', statsBefore);

    // Process queued emails (max 20 at a time)
    const limit = req.body?.limit || 20;
    const { processed, errors } = await emailService.processEmailQueue(limit);

    // Get queue statistics after processing
    const statsAfter = await emailService.getQueueStats();
    console.log('📧 Queue stats after:', statsAfter);

    // Clean up old emails (older than 30 days)
    const cleaned = await emailService.cleanupQueue(30);

    // Get circuit breaker status
    const { data: circuitBreaker } = await supabase
      .from('smtp_circuit_breaker')
      .select('state, consecutive_failures, last_failure_at, next_retry_at')
      .eq('id', 'default')
      .single();

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    const response = {
      success: true,
      processed,
      errors,
      cleaned,
      processingTime,
      queueStats: {
        before: statsBefore,
        after: statsAfter
      },
      circuitBreaker: circuitBreaker || {
        state: 'unknown',
        message: 'Circuit breaker status unavailable'
      },
      timestamp: new Date().toISOString()
    };

    console.log('📧 Email queue processing complete:', response);

    return res.status(200).json(response);

  } catch (error) {
    console.error('📧 Email queue processing failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
} 