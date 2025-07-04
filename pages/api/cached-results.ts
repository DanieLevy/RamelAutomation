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
      console.error('❌ Error fetching auto-check-minimal:', newError);
    } else {
      console.log('✅ Fetched auto-check-minimal cache:', {
        hasData: !!newData,
        hasValue: !!newData?.value,
        updatedAt: newData?.updated_at
      });
    }
    
    let cacheData = null;
    
    if (!newError && newData?.value) {
      cacheData = newData.value;
      console.log('📊 Using auto-check-minimal cache:', {
        found: cacheData.found,
        count: cacheData.count,
        previewLength: cacheData.preview?.length,
        timestamp: new Date(cacheData.timestamp).toLocaleString('he-IL'),
        firstAppointment: cacheData.preview?.[0]
      });
    } else {
      // Fallback to old cache format
      console.log('📦 Falling back to old cache format with key: auto-check');
      const { data: oldData, error: oldError } = await supabase
        .from('cache')
        .select('value, updated_at')
        .eq('key', 'auto-check')
        .single();
      
      if (oldError) {
        console.error('❌ Error fetching auto-check:', oldError);
      } else {
        console.log('✅ Fetched auto-check cache:', {
          hasData: !!oldData,
          hasValue: !!oldData?.value,
          updatedAt: oldData?.updated_at
        });
      }
        
      if (!oldError && oldData?.value) {
        // Convert old format to new format
        const oldValue = oldData.value;
        if (oldValue.result?.results) {
          const availableResults = oldValue.result.results.filter((r: any) => r.available === true);
          cacheData = {
            found: availableResults.length > 0,
            preview: availableResults.slice(0, 5),
            summary: oldValue.result.summary
          };
          console.log('📊 Converted old format cache:', {
            found: cacheData.found,
            previewLength: cacheData.preview?.length
          });
        }
      }
    }
      
    if (!cacheData) {
      console.log('❌ No cache data available');
      const response = {
        found: false,
        preview: [],
        summary: {
          completedAt: new Date().toISOString(),
          message: 'No cached data available'
        }
      };
      return res.status(200).json(response);
    }

    console.log('📤 Returning cache data:', {
      found: cacheData.found,
      previewCount: cacheData.preview?.length,
      summary: cacheData.summary
    });

    return res.status(200).json(cacheData);
  } catch (error) {
    console.error('❌ Failed to load cached results:', error);
    return res.status(500).json({ 
      error: 'Failed to load cached results',
      found: false,
      preview: []
    });
  }
} 