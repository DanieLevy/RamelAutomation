import type { NextApiRequest, NextApiResponse } from 'next';
import { emailService } from '@/lib/emailService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get queue status
    try {
      const stats = await emailService.getQueueStats();
      
      // Get recent failed emails
      const { data: recentFailed } = await supabase
        .from('email_queue')
        .select('id, email_to, email_subject, attempts, last_error, created_at, next_retry_at')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get circuit breaker status
      const { data: circuitBreaker } = await supabase
        .from('smtp_circuit_breaker')
        .select('*')
        .eq('id', 'default')
        .single();

      return res.status(200).json({
        success: true,
        queueStats: stats,
        recentFailed: recentFailed || [],
        circuitBreaker: circuitBreaker || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to get queue status:', error);
      return res.status(500).json({
        error: 'Failed to get queue status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } 
  
  else if (req.method === 'POST') {
    // Admin actions
    const { action, emailId } = req.body;

    // TODO: Add proper authentication here
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      switch (action) {
        case 'retry':
          // Retry a specific email immediately
          if (!emailId) {
            return res.status(400).json({ error: 'Email ID required for retry' });
          }

          const { error: retryError } = await supabase
            .from('email_queue')
            .update({
              status: 'pending',
              next_retry_at: new Date().toISOString(),
              attempts: 0 // Reset attempts
            })
            .eq('id', emailId);

          if (retryError) {
            throw retryError;
          }

          return res.status(200).json({
            success: true,
            message: 'Email queued for immediate retry'
          });

        case 'reset-circuit-breaker':
          // Reset circuit breaker to closed state
          const { error: resetError } = await supabase
            .from('smtp_circuit_breaker')
            .update({
              state: 'closed',
              consecutive_failures: 0,
              failure_count: 0,
              next_retry_at: null
            })
            .eq('id', 'default');

          if (resetError) {
            throw resetError;
          }

          return res.status(200).json({
            success: true,
            message: 'Circuit breaker reset to closed state'
          });

        case 'abandon-all-failed':
          // Abandon all failed emails
          const { error: abandonError } = await supabase
            .from('email_queue')
            .update({
              status: 'abandoned',
              updated_at: new Date().toISOString()
            })
            .eq('status', 'failed');

          if (abandonError) {
            throw abandonError;
          }

          return res.status(200).json({
            success: true,
            message: 'All failed emails marked as abandoned'
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      console.error('Failed to perform admin action:', error);
      return res.status(500).json({
        error: 'Failed to perform action',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } 
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 