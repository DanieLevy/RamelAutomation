import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Subscription ID is required' });
  }

  try {
    // Use soft delete to preserve history
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        status: 'cancelled',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null) // Only update if not already deleted
      .select()
      .single();

    if (error) {
      console.error('Failed to cancel subscription:', error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Subscription not found',
          details: 'No subscription exists with the provided ID'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to cancel subscription',
        details: error.message 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        error: 'Subscription not found',
        details: 'No subscription exists with the provided ID'
      });
    }

    console.log(`Cancelled subscription ${id}`);

    return res.status(200).json({ 
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Delete subscription API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 