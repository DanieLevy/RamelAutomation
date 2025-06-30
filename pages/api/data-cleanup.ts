import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate request
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { operation } = req.body;
  const startTime = Date.now();
  let cleanupLogId: string | undefined;

  try {
    let result: any = {};

    // Create cleanup log entry
    const { data: logEntry, error: logError } = await supabase
      .from('cleanup_log')
      .insert({
        operation: operation || 'all',
        table_name: 'multiple',
        status: 'running',
        metadata: { startTime: new Date().toISOString() }
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to create cleanup log:', logError);
      throw logError;
    }

    cleanupLogId = logEntry.id;

    switch (operation) {
      case 'expired-tokens':
        // Soft delete expired tokens
        console.log('🧹 Starting expired tokens cleanup...');
        
        const { data: tokenResults, error: tokenError } = await supabase
          .rpc('soft_delete_expired_tokens');

        if (tokenError) throw tokenError;

        result.expiredTokens = {
          userOtpTokens: tokenResults.otp_tokens_deleted,
          managementOtps: tokenResults.management_otps_deleted,
          verificationCodes: tokenResults.verification_codes_deleted,
          userSessions: tokenResults.user_sessions_deleted,
          managementTokens: tokenResults.management_tokens_deleted,
          total: tokenResults.otp_tokens_deleted + 
                 tokenResults.management_otps_deleted + 
                 tokenResults.verification_codes_deleted + 
                 tokenResults.user_sessions_deleted + 
                 tokenResults.management_tokens_deleted
        };

        console.log(`✅ Soft deleted ${result.expiredTokens.total} expired tokens`);
        break;

      case 'archive-email-history':
        // Archive old email history
        console.log('📦 Starting email history archival...');
        
        const daysToKeep = req.body.daysToKeep || 90;
        const { data: archiveCount, error: archiveError } = await supabase
          .rpc('archive_old_email_history', { days_to_keep: daysToKeep });

        if (archiveError) throw archiveError;

        result.emailHistoryArchived = {
          count: archiveCount,
          daysKept: daysToKeep,
          message: `Archived ${archiveCount} email history records older than ${daysToKeep} days`
        };

        console.log(`✅ Archived ${archiveCount} email history records`);
        break;

      case 'purge-soft-deleted':
        // Permanently delete soft-deleted records older than 30 days
        console.log('🗑️ Starting permanent deletion of old soft-deleted records...');
        
        const tables = [
          'user_otp_tokens',
          'management_otps',
          'verification_codes',
          'user_sessions',
          'management_tokens'
        ];
        
        result.purged = {};
        let totalPurged = 0;

        for (const table of tables) {
          // First count the records to be deleted
          const { count: toDelete, error: countError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .lt('deleted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          if (!countError && toDelete && toDelete > 0) {
            // Then delete them
            const { error: deleteError } = await supabase
              .from(table)
              .delete()
              .lt('deleted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

            if (!deleteError) {
              result.purged[table] = toDelete;
              totalPurged += toDelete;
            } else {
              console.error(`Error purging ${table}:`, deleteError);
              result.purged[table] = 0;
            }
          } else {
            result.purged[table] = 0;
          }
        }

        result.purged.total = totalPurged;
        console.log(`✅ Permanently deleted ${totalPurged} old soft-deleted records`);
        break;

      case 'cleanup-email-queue':
        // Clean up old email queue entries
        console.log('📧 Starting email queue cleanup...');
        
        // First count the records to be deleted
        const { count: queueCount, error: countError } = await supabase
          .from('email_queue')
          .select('*', { count: 'exact', head: true })
          .in('status', ['sent', 'abandoned'])
          .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        let queueDeleted = 0;
        if (!countError && queueCount && queueCount > 0) {
          // Then delete them
          const { error: queueError } = await supabase
            .from('email_queue')
            .delete()
            .in('status', ['sent', 'abandoned'])
            .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          if (!queueError) {
            queueDeleted = queueCount;
          } else {
            throw queueError;
          }
        }

        result.emailQueueCleaned = {
          count: queueDeleted || 0,
          message: `Deleted ${queueDeleted || 0} old email queue entries`
        };

        console.log(`✅ Cleaned ${queueDeleted || 0} email queue entries`);
        break;

      case 'all':
      default:
        // Run all cleanup operations
        console.log('🧹 Running all cleanup operations...');
        
        // Execute all cleanup operations
        const allResults = await Promise.allSettled([
          supabase.rpc('soft_delete_expired_tokens'),
          supabase.rpc('archive_old_email_history', { days_to_keep: 90 }),
          // First count, then delete email queue records
          (async () => {
            const { count } = await supabase.from('email_queue')
              .select('*', { count: 'exact', head: true })
              .in('status', ['sent', 'abandoned'])
              .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            
            if (count && count > 0) {
              await supabase.from('email_queue')
                .delete()
                .in('status', ['sent', 'abandoned'])
                .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            }
            
            return { count };
          })()
        ]);

        // Process results
        if (allResults[0].status === 'fulfilled') {
          const tokenData = allResults[0].value.data;
          result.expiredTokens = {
            userOtpTokens: tokenData.otp_tokens_deleted,
            managementOtps: tokenData.management_otps_deleted,
            verificationCodes: tokenData.verification_codes_deleted,
            userSessions: tokenData.user_sessions_deleted,
            managementTokens: tokenData.management_tokens_deleted,
            total: tokenData.otp_tokens_deleted + 
                   tokenData.management_otps_deleted + 
                   tokenData.verification_codes_deleted + 
                   tokenData.user_sessions_deleted + 
                   tokenData.management_tokens_deleted
          };
        }

        if (allResults[1].status === 'fulfilled') {
          result.emailHistoryArchived = {
            count: allResults[1].value.data,
            message: `Archived ${allResults[1].value.data} email history records`
          };
        }

        if (allResults[2].status === 'fulfilled') {
          result.emailQueueCleaned = {
            count: allResults[2].value.count || 0,
            message: `Deleted ${allResults[2].value.count || 0} old email queue entries`
          };
        }

        console.log('✅ All cleanup operations completed');
        break;
    }

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Update cleanup log with results
    await supabase
      .from('cleanup_log')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_affected: getRecordsAffected(result),
        metadata: {
          ...result,
          processingTime,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', cleanupLogId);

    return res.status(200).json({
      success: true,
      operation: operation || 'all',
      results: result,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup operation failed:', error);

    // Update cleanup log with error
    if (cleanupLogId) {
      await supabase
        .from('cleanup_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', cleanupLogId);
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup operation failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to calculate total records affected
function getRecordsAffected(result: any): number {
  let total = 0;
  
  if (result.expiredTokens?.total) {
    total += result.expiredTokens.total;
  }
  
  if (result.emailHistoryArchived?.count) {
    total += result.emailHistoryArchived.count;
  }
  
  if (result.purged?.total) {
    total += result.purged.total;
  }
  
  if (result.emailQueueCleaned?.count) {
    total += result.emailQueueCleaned.count;
  }
  
  return total;
} 