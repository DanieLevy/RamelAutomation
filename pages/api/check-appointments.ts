import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ungzip, unzlib } from 'fflate';

interface AppointmentResult {
  date: string;
  available: boolean | null;
  message: string;
  times: string[];
}

// ZSTD decompression using fflate (limited support)
async function decompressResponse(data: Buffer, encoding: string): Promise<string> {
  try {
    if (encoding === 'gzip') {
      return new Promise((resolve, reject) => {
        ungzip(new Uint8Array(data), (err, result) => {
          if (err) reject(err);
          else resolve(new TextDecoder('utf-8').decode(result));
        });
      });
    } else if (encoding === 'deflate') {
      return new Promise((resolve, reject) => {
        unzlib(new Uint8Array(data), (err, result) => {
          if (err) reject(err);
          else resolve(new TextDecoder('utf-8').decode(result));
        });
      });
    }
    // For other encodings (including zstd), return as-is and let axios handle it
    return data.toString('utf-8');
  } catch (error) {
    console.error('Decompression error:', error);
    return data.toString('utf-8');
  }
}

async function checkAppointmentForDate(date: string): Promise<AppointmentResult> {
  const baseUrl = 'https://mytor.co.il/home.php';
  const params = {
    i: 'cmFtZWwzMw==', // ramel33
    s: 'MjY1',         // 265
    mm: 'y',
    lang: 'he',
    datef: date
  };

  try {
    const response = await axios.get(baseUrl, {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'he,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cookie': `userID=${process.env.USER_ID}; codeAuth=${process.env.CODE_AUTH}`,
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000,
      responseType: 'text'
    });

    const $ = cheerio.load(response.data);

    // Check for "no appointments" message
    const noAppointmentsMessages = [
      'מצטערים, לא נשארו תורים פנויים ליום זה',
      'לא נשארו תורים פנויים'
    ];

    const dangerElements = $('h4.tx-danger');
    for (let i = 0; i < dangerElements.length; i++) {
      const elementText = $(dangerElements[i]).text().trim();
      for (const msg of noAppointmentsMessages) {
        if (elementText.includes(msg)) {
          return {
            date,
            available: false,
            message: 'No appointments available',
            times: []
          };
        }
      }
    }

    // Look for appointment time buttons
    const timeButtons = $('button.btn.btn-outline-dark.btn-block');
    const availableTimes: string[] = [];

    timeButtons.each((_, button) => {
      const timeText = $(button).text().trim();
      if (/^\d{1,2}:\d{2}$/.test(timeText)) {
        availableTimes.push(timeText);
      }
    });

    if (availableTimes.length > 0) {
      return {
        date,
        available: true,
        message: `Found ${availableTimes.length} available appointments`,
        times: availableTimes
      };
    } else {
      return {
        date,
        available: null,
        message: 'Could not determine availability',
        times: []
      };
    }

  } catch (error: any) {
    console.error(`Error checking ${date}:`, error.message);
    return {
      date,
      available: null,
      message: `Error: ${error.message}`,
      times: []
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if environment variables are set
  if (!process.env.USER_ID || !process.env.CODE_AUTH) {
    return res.status(500).json({ 
      error: 'Authentication cookies not configured. Please set USER_ID and CODE_AUTH environment variables.' 
    });
  }

  try {
    const { days = '30' } = req.query;
    const numDays = parseInt(days as string, 10);

    if (numDays < 1 || numDays > 60) {
      return res.status(400).json({ error: 'Days must be between 1 and 60' });
    }

    const results: AppointmentResult[] = [];
    const today = new Date();

    console.log(`Checking appointments for next ${numDays} days...`);

    for (let i = 0; i < numDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      const result = await checkAppointmentForDate(dateStr);
      results.push(result);

      console.log(`${dateStr}: ${result.available ? `${result.times.length} slots` : 'No slots'}`);

      // Add delay between requests to be respectful
      if (i < numDays - 1) {
        const delay = parseInt(process.env.REQUEST_DELAY_MS || '1000', 10);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Filter available appointments
    const availableAppointments = results.filter(r => r.available === true);

    res.status(200).json({
      success: true,
      totalDaysChecked: numDays,
      availableAppointments: availableAppointments.length,
      results: results,
      summary: {
        hasAvailableAppointments: availableAppointments.length > 0,
        earliestAvailable: availableAppointments.length > 0 ? availableAppointments[0] : null,
        totalSlots: availableAppointments.reduce((sum, apt) => sum + apt.times.length, 0)
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
} 