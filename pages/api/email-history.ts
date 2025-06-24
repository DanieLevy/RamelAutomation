import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailHistoryEntry {
  notification_id: string;
  email_count: number;
  sent_at: string;
  appointment_data?: any;
  email_subject?: string;
  email_status: 'sent' | 'failed';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📧 EMAIL HISTORY API:', req.method, req.body);

  if (req.method === 'POST') {
    return handleCreateEntry(req, res);
  } else if (req.method === 'GET') {
    return handleGetHistory(req, res);
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleCreateEntry(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      notification_id, 
      email_count, 
      appointment_data, 
      email_subject,
      email_status = 'sent'
    }: EmailHistoryEntry = req.body;

    if (!notification_id || typeof email_count !== 'number') {
      return res.status(400).json({ 
        error: 'Missing required fields: notification_id, email_count' 
      });
    }

    // Create email history entry
    const historyEntry = {
      notification_id,
      email_count,
      sent_at: new Date().toISOString(),
      appointment_data: appointment_data || null,
      email_subject: email_subject || null,
      email_status,
      created_at: new Date().toISOString()
    };

    // Try to insert into email_history table
    // If table doesn't exist, we'll create it first
    try {
      const { data, error } = await supabase
        .from('email_history')
        .insert([historyEntry])
        .select()
        .single();

      if (error) {
        // If table doesn't exist, try to create it
        if (error.code === '42P01') {
          console.log('📧 Creating email_history table...');
          await createEmailHistoryTable();
          
          // Try insert again
          const { data: retryData, error: retryError } = await supabase
            .from('email_history')
            .insert([historyEntry])
            .select()
            .single();

          if (retryError) {
            throw retryError;
          }

          console.log('📧 ✅ Email history entry created:', retryData.id);
          return res.status(201).json({ 
            success: true, 
            data: retryData,
            message: 'Email history entry created (table was created)' 
          });
        } else {
          throw error;
        }
      }

      console.log('📧 ✅ Email history entry created:', data.id);
      return res.status(201).json({ 
        success: true, 
        data,
        message: 'Email history entry created' 
      });

    } catch (insertError) {
      console.error('📧 ❌ Failed to create email history entry:', insertError);
      
      // Still return success since the main email was sent
      // This is just for tracking purposes
      return res.status(201).json({ 
        success: true, 
        warning: 'Email sent but history tracking failed',
        error: insertError instanceof Error ? insertError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('📧 ❌ Email history API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetHistory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { notification_id, email } = req.query;

    let query = supabase.from('email_history').select(`
      *,
      notifications!inner(email, criteria, criteria_type, status)
    `);

    if (notification_id) {
      query = query.eq('notification_id', notification_id);
    } else if (email) {
      query = query.eq('notifications.email', email);
    } else {
      return res.status(400).json({ 
        error: 'Either notification_id or email parameter is required' 
      });
    }

    const { data, error } = await query
      .order('sent_at', { ascending: false })
      .limit(100);

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return res.status(200).json({ 
          success: true, 
          data: [],
          message: 'Email history table not created yet' 
        });
      }
      throw error;
    }

    return res.status(200).json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('📧 ❌ Get email history error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function createEmailHistoryTable() {
  try {
    // Create the email_history table using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
          email_count INTEGER NOT NULL,
          sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          appointment_data JSONB,
          email_subject TEXT,
          email_status TEXT DEFAULT 'sent' CHECK (email_status IN ('sent', 'failed')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_email_history_notification_id ON email_history(notification_id);
        CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);
        CREATE INDEX IF NOT EXISTS idx_email_history_email_count ON email_history(email_count);

        -- Enable RLS (Row Level Security)
        ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

        -- Create policy to allow public read access (for management page)
        CREATE POLICY "Allow public read access to email_history" ON email_history
          FOR SELECT USING (true);

        -- Create policy to allow service role to insert/update
        CREATE POLICY "Allow service role full access to email_history" ON email_history
          FOR ALL USING (auth.role() = 'service_role');
      `
    });

    if (error) {
      console.error('📧 ❌ Failed to create email_history table:', error);
      throw error;
    }

    console.log('📧 ✅ Email history table created successfully');
  } catch (error) {
    console.error('📧 ❌ Error creating email_history table:', error);
    throw error;
  }
} 