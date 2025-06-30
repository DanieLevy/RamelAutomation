import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, updates } = req.body;

  // Validate inputs
  if (!id) {
    return res.status(400).json({ error: 'Subscription ID is required' });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Updates object is required' });
  }

  // Validate specific update fields if provided
  if ('max_notifications' in updates) {
    const max = parseInt(updates.max_notifications);
    if (isNaN(max) || max < 1 || max > 10) {
      return res.status(400).json({ 
        error: 'Invalid max_notifications value. Must be between 1 and 10' 
      });
    }
  }

  if ('interval_minutes' in updates) {
    const interval = parseInt(updates.interval_minutes);
    if (isNaN(interval) || interval < 0 || interval > 1440) {
      return res.status(400).json({ 
        error: 'Invalid interval_minutes value. Must be between 0 and 1440' 
      });
    }
  }

  try {
    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update subscription:', error);
      
      // Handle specific error cases
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Subscription not found',
          details: 'No subscription exists with the provided ID'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to update subscription',
        details: error.message 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        error: 'Subscription not found',
        details: 'No subscription exists with the provided ID'
      });
    }

    console.log(`Updated subscription ${id}:`, updateData);

    return res.status(200).json({ 
      success: true,
      subscription: data,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('Update subscription API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 