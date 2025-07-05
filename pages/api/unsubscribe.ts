import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const supabase = supabaseAdmin;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ 
      error: 'Missing or invalid unsubscribe token' 
    });
  }

  try {
    // Find subscription by stop_token
    const { data: subscription, error: findError } = await supabase
      .from('notifications_simple')
      .select('*')
      .eq('stop_token', token)
      .single();

    if (findError || !subscription) {
      return res.status(404).json({ 
        error: 'Invalid or expired unsubscribe token' 
      });
    }

    // Check if already unsubscribed
    if (subscription.status === 'stopped') {
      return res.status(200).json({ 
        success: true,
        message: 'ההרשמה כבר בוטלה',
        alreadyUnsubscribed: true 
      });
    }

    // Update subscription status to stopped
    const { error: updateError } = await supabase
      .from('notifications_simple')
      .update({ 
        status: 'stopped',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return res.status(500).json({ 
        error: 'Failed to unsubscribe' 
      });
    }

    console.log(`✅ Unsubscribed: ${subscription.email}`);

    // Send unsubscribe confirmation email
    try {
      const { emailService } = await import('@/lib/emailService');
      
      const emailContent = {
        subject: 'ביטול הרשמה להתראות - תורים לרם-אל',
        html: `
          <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>ההרשמה שלך בוטלה בהצלחה ✅</h2>
            <p>שלום,</p>
            <p>ביטלת את ההרשמה לקבלת התראות על תורים פנויים במספרת רם-אל.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;">לא תקבל יותר התראות למייל זה.</p>
            </div>
            
            <p>אם תרצה להירשם שוב בעתיד, תוכל לעשות זאת בכל עת דרך האתר.</p>
            
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              מערכת התראות אוטומטית למספרת רם-אל
            </p>
          </div>
        `,
        text: `ההרשמה שלך בוטלה בהצלחה!\n\nלא תקבל יותר התראות למייל זה.\n\nאם תרצה להירשם שוב בעתיד, תוכל לעשות זאת בכל עת דרך האתר.`
      };

      await emailService.queueEmail({
        to: subscription.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        priority: 5
      });
    } catch (emailError) {
      console.error('Failed to send unsubscribe confirmation:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({ 
      success: true,
      message: 'ההרשמה בוטלה בהצלחה'
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 