import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!token || typeof token !== 'string') {
    res.status(400).send(`
      <html><head><title>הסרה מהתראות</title></head><body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 12px #0001; padding: 2rem; text-align: center; max-width: 350px;">
          <h2 style="color: #e11d48;">קישור לא תקין</h2>
          <p>לא ניתן להסיר את ההתראה. נסה שוב או פנה לתמיכה.</p>
        </div>
      </body></html>
    `);
    return;
  }
  const { error, count } = await supabase.from('notifications').delete().eq('unsubscribe_token', token);
  if (error) {
    res.status(500).send(`
      <html><head><title>הסרה מהתראות</title></head><body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 12px #0001; padding: 2rem; text-align: center; max-width: 350px;">
          <h2 style="color: #e11d48;">שגיאה בהסרה</h2>
          <p>אירעה שגיאה. נסה שוב מאוחר יותר.</p>
        </div>
      </body></html>
    `);
    return;
  }
  if (count === 0) {
    res.status(404).send(`
      <html><head><title>הסרה מהתראות</title></head><body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 2px 12px #0001; padding: 2rem; text-align: center; max-width: 350px;">
          <h2 style="color: #eab308;">לא נמצא</h2>
          <p>לא נמצאה התראה מתאימה להסרה. ייתכן שכבר הוסרה.</p>
        </div>
      </body></html>
    `);
    return;
  }
  res.status(200).send(`
    <html><head><title>הוסרת מהתראות</title></head><body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc;">
      <div style="background: white; border-radius: 12px; box-shadow: 0 2px 12px #0001; padding: 2rem; text-align: center; max-width: 350px;">
        <h2 style="color: #10b981;">הוסרת בהצלחה</h2>
        <p>הוסרת מרשימת ההתראות. לא תקבל עוד מיילים עבור תור זה.</p>
      </div>
    </body></html>
  `);
} 