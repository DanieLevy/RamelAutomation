import nodemailer from 'nodemailer';
import { supabaseAdmin } from './supabaseAdmin';

const supabase = supabaseAdmin;

// Configuration constants
const CIRCUIT_BREAKER_THRESHOLD = 5; // Open circuit after 5 consecutive failures
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds before trying half-open
const CIRCUIT_BREAKER_HALF_OPEN_REQUESTS = 3; // Number of test requests in half-open state

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  notificationId?: string;
  appointmentData?: any;
  priority?: number;
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureAt: Date | null;
  lastSuccessAt: Date | null;
  nextRetryAt: Date | null;
  consecutiveFailures: number;
  totalRequests: number;
  totalFailures: number;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private circuitBreakerCache: CircuitBreakerState | null = null;
  private lastCircuitBreakerCheck: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      pool: true,
      maxConnections: 10,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }

  // Calculate exponential backoff delay
  private calculateBackoffDelay(attempt: number): number {
    // Base delay: 1 minute, max delay: 30 minutes
    const baseDelay = 60000; // 1 minute
    const maxDelay = 1800000; // 30 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  // Get circuit breaker state with caching
  private async getCircuitBreakerState(): Promise<CircuitBreakerState> {
    // Use cached value if recent
    if (this.circuitBreakerCache && Date.now() - this.lastCircuitBreakerCheck < this.CACHE_DURATION) {
      return this.circuitBreakerCache;
    }

    const { data, error } = await supabase
      .from('smtp_circuit_breaker')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error || !data) {
      console.error('Failed to get circuit breaker state:', error);
      // Return default closed state
      return {
        state: 'closed',
        failureCount: 0,
        lastFailureAt: null,
        lastSuccessAt: null,
        nextRetryAt: null,
        consecutiveFailures: 0,
        totalRequests: 0,
        totalFailures: 0,
      };
    }

    this.circuitBreakerCache = {
      state: data.state as 'closed' | 'open' | 'half_open',
      failureCount: data.failure_count,
      lastFailureAt: data.last_failure_at ? new Date(data.last_failure_at) : null,
      lastSuccessAt: data.last_success_at ? new Date(data.last_success_at) : null,
      nextRetryAt: data.next_retry_at ? new Date(data.next_retry_at) : null,
      consecutiveFailures: data.consecutive_failures,
      totalRequests: data.total_requests,
      totalFailures: data.total_failures,
    };
    this.lastCircuitBreakerCheck = Date.now();

    return this.circuitBreakerCache;
  }

  // Update circuit breaker state
  private async updateCircuitBreakerState(success: boolean, error?: Error): Promise<void> {
    const now = new Date();
    const state = await this.getCircuitBreakerState();

    let newState = state.state;
    let consecutiveFailures = state.consecutiveFailures;
    let nextRetryAt = state.nextRetryAt;

    if (success) {
      // Success - reset consecutive failures
      consecutiveFailures = 0;
      
      if (state.state === 'half_open') {
        // Successful request in half-open state - close the circuit
        newState = 'closed';
        console.log('🔌 Circuit breaker: HALF_OPEN → CLOSED (success)');
      }
    } else {
      // Failure
      consecutiveFailures++;
      
      if (state.state === 'closed' && consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        // Too many failures - open the circuit
        newState = 'open';
        nextRetryAt = new Date(now.getTime() + CIRCUIT_BREAKER_TIMEOUT);
        console.log(`🔌 Circuit breaker: CLOSED → OPEN (${consecutiveFailures} failures)`);
      } else if (state.state === 'half_open') {
        // Failed in half-open state - reopen the circuit
        newState = 'open';
        nextRetryAt = new Date(now.getTime() + CIRCUIT_BREAKER_TIMEOUT);
        console.log('🔌 Circuit breaker: HALF_OPEN → OPEN (test failed)');
      }
    }

    // Update database
    const { error: updateError } = await supabase
      .from('smtp_circuit_breaker')
      .update({
        state: newState,
        failure_count: state.failureCount + (success ? 0 : 1),
        consecutive_failures: consecutiveFailures,
        last_failure_at: success ? state.lastFailureAt : now.toISOString(),
        last_success_at: success ? now.toISOString() : state.lastSuccessAt,
        next_retry_at: nextRetryAt?.toISOString() || null,
        total_requests: state.totalRequests + 1,
        total_failures: state.totalFailures + (success ? 0 : 1),
      })
      .eq('id', 'default');

    if (updateError) {
      console.error('Failed to update circuit breaker state:', updateError);
    }

    // Clear cache to force refresh
    this.circuitBreakerCache = null;
  }

  // Check if circuit allows request
  private async canSendEmail(): Promise<{ canSend: boolean; reason?: string }> {
    const state = await this.getCircuitBreakerState();
    const now = new Date();

    switch (state.state) {
      case 'closed':
        return { canSend: true };
        
      case 'open':
        // Check if it's time to try half-open
        if (state.nextRetryAt && now >= state.nextRetryAt) {
          // Transition to half-open
          await supabase
            .from('smtp_circuit_breaker')
            .update({ state: 'half_open' })
            .eq('id', 'default');
          
          console.log('🔌 Circuit breaker: OPEN → HALF_OPEN (timeout expired)');
          this.circuitBreakerCache = null;
          return { canSend: true };
        }
        return { 
          canSend: false, 
          reason: `Circuit breaker is OPEN. Next retry at ${state.nextRetryAt?.toISOString()}` 
        };
        
      case 'half_open':
        // Allow limited requests in half-open state
        return { canSend: true };
        
      default:
        return { canSend: true };
    }
  }

  // Queue email for sending
  async queueEmail(options: EmailOptions): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          notification_id: options.notificationId,
          email_to: options.to,
          email_subject: options.subject,
          email_html: options.html,
          email_text: options.text,
          appointment_data: options.appointmentData,
          priority: options.priority || 0,
          status: 'pending',
          next_retry_at: new Date().toISOString(), // Send immediately
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to queue email:', error);
        return { success: false, error: error.message };
      }

      console.log(`📧 Email queued: ${data.id}`);
      return { success: true, queueId: data.id };

    } catch (error) {
      console.error('Error queuing email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Send email with circuit breaker protection
  private async sendEmailWithCircuitBreaker(mailOptions: any): Promise<{ success: boolean; messageId?: string; error?: Error }> {
    // Check circuit breaker
    const { canSend, reason } = await this.canSendEmail();
    if (!canSend) {
      return { 
        success: false, 
        error: new Error(reason || 'Circuit breaker is open') 
      };
    }

    try {
      // Attempt to send email
      const result = await this.transporter!.sendMail(mailOptions);
      
      // Update circuit breaker - success
      await this.updateCircuitBreakerState(true);
      
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      // Update circuit breaker - failure
      await this.updateCircuitBreakerState(false, error as Error);
      
      return { 
        success: false, 
        error: error as Error 
      };
    }
  }

  // Process single email from queue
  async processQueuedEmail(queueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get email from queue
      const { data: email, error: fetchError } = await supabase
        .from('email_queue')
        .select('*')
        .eq('id', queueId)
        .single();

      if (fetchError || !email) {
        return { success: false, error: 'Email not found in queue' };
      }

      // Check if already sent or abandoned
      if (email.status === 'sent' || email.status === 'abandoned') {
        return { success: true }; // Already processed
      }

      // Update status to processing
      await supabase
        .from('email_queue')
        .update({ status: 'processing' })
        .eq('id', queueId);

      // Prepare mail options
      const mailOptions = {
        from: `"תורים לרם-אל" <${process.env.EMAIL_SENDER}>`,
        to: email.email_to,
        subject: email.email_subject,
        html: email.email_html,
        text: email.email_text,
      };

      // Send email with circuit breaker
      const { success, messageId, error } = await this.sendEmailWithCircuitBreaker(mailOptions);

      if (success) {
        // Mark as sent
        await supabase
          .from('email_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', queueId);

        console.log(`✅ Email sent successfully: ${messageId}`);
        return { success: true };

      } else {
        // Handle failure
        const attempts = email.attempts + 1;
        const maxAttempts = email.max_attempts || 3;

        if (attempts >= maxAttempts) {
          // Max attempts reached - abandon
          await supabase
            .from('email_queue')
            .update({ 
              status: 'abandoned',
              attempts,
              last_error: error?.message || 'Unknown error',
            })
            .eq('id', queueId);

          console.error(`❌ Email abandoned after ${attempts} attempts: ${error?.message}`);
          return { success: false, error: `Abandoned after ${attempts} attempts` };

        } else {
          // Schedule retry with exponential backoff
          const nextRetryDelay = this.calculateBackoffDelay(attempts);
          const nextRetryAt = new Date(Date.now() + nextRetryDelay);

          await supabase
            .from('email_queue')
            .update({ 
              status: 'failed',
              attempts,
              next_retry_at: nextRetryAt.toISOString(),
              last_error: error?.message || 'Unknown error',
            })
            .eq('id', queueId);

          console.log(`⏰ Email will retry in ${Math.round(nextRetryDelay / 1000)}s (attempt ${attempts}/${maxAttempts})`);
          return { success: false, error: error?.message };
        }
      }

    } catch (error) {
      console.error('Error processing queued email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Process email queue (called by cron or manual trigger)
  async processEmailQueue(limit: number = 10): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      // Get pending/failed emails ready for processing
      const { data: emails, error: fetchError } = await supabase
        .from('email_queue')
        .select('id')
        .in('status', ['pending', 'failed'])
        .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (fetchError) {
        console.error('Failed to fetch email queue:', fetchError);
        return { processed, errors };
      }

      if (!emails || emails.length === 0) {
        return { processed, errors };
      }

      console.log(`📧 Processing ${emails.length} queued emails...`);

      // Process emails sequentially to respect rate limits
      for (const email of emails) {
        const result = await this.processQueuedEmail(email.id);
        
        if (result.success) {
          processed++;
        } else {
          errors++;
        }

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`📧 Queue processing complete: ${processed} sent, ${errors} errors`);

    } catch (error) {
      console.error('Error processing email queue:', error);
    }

    return { processed, errors };
  }

  // Get queue statistics
  async getQueueStats(): Promise<any> {
    const { data, error } = await supabase
      .from('email_queue')
      .select('status')
      .then(result => {
        if (result.error) return { data: null, error: result.error };
        
        const stats = {
          pending: 0,
          processing: 0,
          sent: 0,
          failed: 0,
          abandoned: 0,
          total: result.data?.length || 0,
        };

        result.data?.forEach(email => {
          stats[email.status as keyof typeof stats]++;
        });

        return { data: stats, error: null };
      });

    if (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }

    return data;
  }

  // Clean up old sent/abandoned emails
  async cleanupQueue(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('email_queue')
      .delete()
      .in('status', ['sent', 'abandoned'])
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Failed to cleanup queue:', error);
      return 0;
    }

    const deleted = data?.length || 0;
    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} old emails from queue`);
    }

    return deleted;
  }
}

// Export singleton instance
export const emailService = new EmailService(); 