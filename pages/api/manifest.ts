import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Determine theme
    const theme = req.query.theme || 'light'
    
    // Read the base manifest file
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json')
    const manifestContent = fs.readFileSync(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)
    
    // Update theme colors based on the requested theme
    if (theme === 'dark') {
      manifest.theme_color = '#171717' // Dark background
      manifest.background_color = '#171717'
    } else {
      manifest.theme_color = '#FFFFFF' // Light background
      manifest.background_color = '#FFFFFF'
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/manifest+json')
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    
    // Return the modified manifest
    res.status(200).json(manifest)
  } catch (error) {
    console.error('Error generating dynamic manifest:', error)
    res.status(500).json({ error: 'Failed to generate manifest' })
  }
} 