import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 /api/cached-results: Starting request');

  try {
    // Try new optimized cache first, fallback to old format
    console.log('📦 Fetching cache with key: auto-check-minimal');
    const { data: newData, error: newError } = await supabase
      .from('cache')
      .select('value, updated_at')
      .eq('key', 'auto-check-minimal')
      .single();
    
    if (newError) {
      console.error('❌ Error fetching new cache format:', newError);
      
      // Fallback to old cache format
      console.log('📦 Trying fallback key: auto-check');
      const { data: oldData, error: oldError } = await supabase
        .from('cache')
        .select('value')
        .eq('key', 'auto-check')
        .single();
      
      if (oldError || !oldData) {
        console.error('❌ Both cache formats failed');
        return res.status(200).json({ 
          results: [], 
          summary: { 
            found: false, 
            message: 'No cached data available',
            hasAvailable: false
          } 
        });
      }
      
      return res.status(200).json(oldData.value);
    }

    const cacheData = newData.value;
    console.log('✅ Cache data retrieved:', {
      found: cacheData.found,
      count: cacheData.count,
      preview: cacheData.preview?.length || 0,
      timestamp: cacheData.timestamp,
      updatedAt: newData.updated_at
    });
    
    // Check if cache is stale (older than 10 minutes)
    const cacheAge = Date.now() - cacheData.timestamp;
    const isStale = cacheAge > 10 * 60 * 1000;
    
    if (isStale) {
      console.warn('⚠️ Cache is stale (age:', Math.round(cacheAge / 1000), 'seconds)');
    }
    
    // Extract appointments from preview
    const appointments = cacheData.preview || [];
    console.log(`📅 Found ${appointments.length} appointments in cache`);
    
    // Ensure appointments are sorted by date (nearest first)
    appointments.sort((a: any, b: any) => a.date.localeCompare(b.date));
    
    // Get the nearest available appointment
    const nearestAppointment = appointments.length > 0 ? appointments[0] : null;
    
    if (nearestAppointment) {
      console.log(`🎯 Nearest appointment: ${nearestAppointment.date} with ${nearestAppointment.times?.length || 0} time slots`);
    }
    
    // Format response to match expected structure
    const response = {
      results: appointments,
      summary: {
        found: cacheData.found,
        count: cacheData.count || appointments.length,
        hasAvailable: cacheData.found,
        hasAvailableAppointments: cacheData.found,
        totalChecked: cacheData.summary?.totalChecked || 0,
        mode: cacheData.summary?.mode || '30_day_scan',
        performance: cacheData.summary?.performance || {},
        // Add nearest appointment info
        nearestDate: nearestAppointment?.date,
        nearestTimes: nearestAppointment?.times || [],
        message: cacheData.found 
          ? `נמצאו ${cacheData.count} תורים זמינים. הקרוב ביותר: ${nearestAppointment?.date}`
          : 'לא נמצאו תורים זמינים ב-30 הימים הקרובים'
      },
      meta: {
        cacheAge: Math.round(cacheAge / 1000),
        isStale,
        updatedAt: newData.updated_at
      }
    };
    
    console.log('📤 Sending response with nearest appointment:', nearestAppointment?.date);
    
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    return res.status(200).json(response);
    
  } catch (error: any) {
    console.error('❌ Unexpected error in cached-results:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch cached results',
      details: error.message
    });
  }
} 