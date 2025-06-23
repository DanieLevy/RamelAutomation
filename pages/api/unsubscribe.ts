import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    res.status(400).send('<h2>קישור לא תקין</h2>');
    return;
  }
  const { error } = await supabase.from('notifications').delete().eq('unsubscribe_token', token);
  if (error) {
    res.status(500).send('<h2>שגיאה בהסרה. נסה שוב מאוחר יותר.</h2>');
    return;
  }
  res.status(200).send('<h2>הוסרת בהצלחה מרשימת ההתראות.</h2>');
} 