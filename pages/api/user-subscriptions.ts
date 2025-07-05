import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.query

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const { data, error } = await supabase
      .from('notifications_simple')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to fetch subscriptions' })
    }

    // Transform data to match expected format
    const transformedData = data?.map(sub => ({
      id: sub.id,
      email: sub.email,
      subscription_type: sub.subscription_type,
      target_date: sub.target_date,
      date_start: sub.date_start,
      date_end: sub.date_end,
      status: sub.status,
      created_at: sub.created_at,
      // Add display fields for UI
      dateDisplay: sub.subscription_type === 'single' 
        ? sub.target_date 
        : `${sub.date_start} - ${sub.date_end}`,
      typeDisplay: sub.subscription_type === 'single' ? 'יום בודד' : 'טווח תאריכים'
    })) || []

    return res.status(200).json({ subscriptions: transformedData })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Failed to fetch subscriptions' })
  }
} 