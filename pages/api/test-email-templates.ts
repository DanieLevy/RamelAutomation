// API endpoint to test all redesigned email templates
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { 
  generateAppointmentNotificationEmail,
  generateWelcomeEmailTemplate,
  generateUnsubscribeEmailTemplate,
  generateReminderEmailTemplate,
  generateConfirmationEmailTemplate
} from '@/lib/emailTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add authentication
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Create email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const TEST_EMAIL = req.body.email || 'daniellofficial@gmail.com';
  const results: any[] = [];

  async function sendTestEmail(name: string, emailContent: { subject: string; html: string; text: string }) {
    try {
      console.log(`📧 Sending ${name}...`);
      
      const info = await transporter.sendMail({
        from: `"Tor-RamEl Test" <${process.env.EMAIL_SENDER}>`,
        to: TEST_EMAIL,
        subject: `[TEST] ${emailContent.subject}`,
        html: emailContent.html,
        text: emailContent.text,
      });
      
      results.push({
        name,
        success: true,
        messageId: info.messageId
      });
      
      return true;
    } catch (error) {
      results.push({
        name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  try {
    // Test 1: Appointment Notification Email
    const appointmentEmail = generateAppointmentNotificationEmail(
      [
        { date: '2025-01-25', times: ['10:00', '11:30', '14:15'] },
        { date: '2025-01-26', times: ['09:00', '15:30'] },
        { date: '2025-01-24', times: ['16:00'] } // Today's appointment (urgent)
      ],
      { '2025-01-25': 'test-token-123' },
      2,
      6,
      TEST_EMAIL,
      'unsubscribe-token-456'
    );
    
    await sendTestEmail('Appointment Notification', appointmentEmail);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Welcome Email
    const welcomeEmail = generateWelcomeEmailTemplate({
      userEmail: TEST_EMAIL,
      unsubscribeUrl: 'https://tor-ramel.netlify.app/unsubscribe?token=test-123',
      manageUrl: 'https://tor-ramel.netlify.app/manage?token=test-456'
    });
    
    await sendTestEmail('Welcome Email', welcomeEmail);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Unsubscribe Email
    const unsubscribeEmail = generateUnsubscribeEmailTemplate({
      userEmail: TEST_EMAIL,
      resubscribeUrl: 'https://tor-ramel.netlify.app/notifications'
    });
    
    await sendTestEmail('Unsubscribe Email', unsubscribeEmail);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Reminder Email
    const reminderEmail = generateReminderEmailTemplate({
      userEmail: TEST_EMAIL,
      appointmentDate: '2025-01-26',
      appointmentTime: '14:30',
      unsubscribeUrl: 'https://tor-ramel.netlify.app/unsubscribe?token=test-789'
    });
    
    await sendTestEmail('Reminder Email', reminderEmail);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 5A: Confirmation Email (Taken)
    const confirmationTakenEmail = generateConfirmationEmailTemplate({
      userEmail: TEST_EMAIL,
      appointmentDate: '2025-01-25',
      appointmentTime: '11:30',
      action: 'taken'
    });
    
    await sendTestEmail('Confirmation Email (Taken)', confirmationTakenEmail);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 5B: Confirmation Email (Cancelled)
    const confirmationCancelledEmail = generateConfirmationEmailTemplate({
      userEmail: TEST_EMAIL,
      appointmentDate: '2025-01-25',
      appointmentTime: '11:30',
      action: 'cancelled'
    });
    
    await sendTestEmail('Confirmation Email (Cancelled)', confirmationCancelledEmail);

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      message: `Test emails sent to ${TEST_EMAIL}`,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount
      },
      results,
      tips: [
        'Check your inbox for the test emails',
        'Test on mobile device for responsiveness',
        'Verify RTL rendering in Hebrew',
        'Check action button functionality'
      ]
    });

  } catch (error) {
    console.error('Test email API failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    });
  }
} 