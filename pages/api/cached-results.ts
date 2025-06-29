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

  try {
    // Try new optimized cache first, fallback to old format
    const { data: newData, error: newError } = await supabase
      .from('cache')
      .select('value, updated_at')
      .eq('key', 'auto-check-minimal')
      .single();
    
    let cacheData = null;
    
    if (!newError && newData?.value) {
      cacheData = newData.value;
    } else {
      // Fallback to old cache format
      const { data: oldData, error: oldError } = await supabase
        .from('cache')
        .select('value, updated_at')
        .eq('key', 'auto-check')
        .single();
        
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
        }
      }
    }
      
    if (!cacheData) {
      return res.status(200).json({
        found: false,
        preview: [],
        summary: {
          completedAt: new Date().toISOString(),
          message: 'No cached data available'
        }
      });
    }

    return res.status(200).json(cacheData);
  } catch (error) {
    console.error('Failed to load cached results:', error);
    return res.status(500).json({ 
      error: 'Failed to load cached results',
      found: false,
      preview: []
    });
  }
} 