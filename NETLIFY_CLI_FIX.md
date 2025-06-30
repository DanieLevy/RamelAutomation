# Netlify CLI Error Fix

## Error Description
The Netlify CLI is throwing an error when trying to set up Edge Functions environment:
```
Error: fetch failed
Setting up the Edge Functions environment. This may take a couple of minutes.
```

## Solution

### Option 1: Use Regular Next.js Dev Server (Recommended for Development)
Since you're not using Netlify Edge Functions in this project, you can simply use the regular Next.js dev server:

```bash
npm run dev
```

Or if you've cleared the console and want to start fresh:
```bash
npm run clear
```

### Option 2: Fix Netlify CLI (If you need Netlify features)

1. **Install an older, stable version of Netlify CLI:**
```bash
npm uninstall -g netlify-cli
npm install -g netlify-cli@17.10.1
```

2. **Clear Netlify cache:**
```bash
# Windows
rmdir /s /q %LOCALAPPDATA%\netlify\Config\cache

# Or manually delete:
# C:\Users\[YourUsername]\AppData\Local\netlify\Config\cache
```

3. **Try running again:**
```bash
netlify dev
```

### Option 3: Disable Edge Functions
Add to your `netlify.toml`:
```toml
[build]
  edge_functions = false
```

## Why This Happens
- The error occurs when Netlify CLI tries to download Edge Functions runtime
- Network issues or firewall can block this download
- The latest Netlify CLI versions sometimes have compatibility issues

## For This Project
Since this project doesn't use Netlify Edge Functions (only regular Netlify Functions), you can safely use `npm run dev` for local development without any issues. 