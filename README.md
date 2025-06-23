# Ram-El Barbershop Appointment Checker

A Next.js web application that automatically checks for available appointments at Ram-El Barbershop. Perfect for mobile use and deployable to Netlify.

## 🚀 Features

- **Real-time Appointment Checking**: Scans 7-60 days ahead for available slots
- **Mobile-Friendly**: Responsive design optimized for phones
- **Hebrew Support**: RTL layout with proper Hebrew text rendering
- **Modern UI**: Beautiful, intuitive interface with Tailwind CSS
- **Fast & Reliable**: Built with Next.js and TypeScript
- **Easy Deployment**: One-click deploy to Netlify

## 🛠 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file with your authentication cookies:

```env
USER_ID=4481
CODE_AUTH=Sa1W2GjL
REQUEST_DELAY_MS=1000
```

**How to get your cookies:**
1. Visit the Ram-El website in your browser
2. Open Developer Tools (F12)
3. Go to Application > Cookies > mytor.co.il
4. Copy the values for `userID` and `codeAuth`

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## 📱 Usage

1. **Select Time Range**: Choose 7, 14, 30, or 60 days to check
2. **Click "בדוק תורים"**: Start the appointment search
3. **View Results**: See available appointments with times
4. **Book Quickly**: Visit the barbershop website to book found slots

## 🌐 Deploy to Netlify

### Option 1: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

### Option 2: Manual Deploy

1. **Fork this repository**
2. **Connect to Netlify**:
   - Login to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose this repository
3. **Set Environment Variables**:
   - Go to Site settings > Environment variables
   - Add: `USER_ID`, `CODE_AUTH`, `REQUEST_DELAY_MS`
4. **Deploy**: Netlify will build and deploy automatically

### Environment Variables for Netlify

In your Netlify dashboard, set these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `USER_ID` | `4481` | Your user ID cookie |
| `CODE_AUTH` | `Sa1W2GjL` | Your authentication code |
| `REQUEST_DELAY_MS` | `1000` | Delay between requests (optional) |

## 🔧 Technical Details

### Architecture

- **Frontend**: Next.js with React and TypeScript
- **Styling**: Tailwind CSS with RTL support
- **API**: Next.js API routes for server-side scraping
- **Parsing**: Cheerio for HTML parsing
- **HTTP Client**: Axios with compression support

### How It Works

1. **API Endpoint** (`/api/check-appointments`): 
   - Accepts query parameter `days` (1-60)
   - Makes authenticated requests to Ram-El website
   - Parses HTML to extract appointment buttons
   - Returns structured JSON response

2. **Frontend**: 
   - React interface with loading states
   - Real-time results display
   - Mobile-optimized design

3. **Authentication**: 
   - Uses your browser cookies for access
   - Maintains session with barbershop website

### Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## 📋 API Reference

### GET `/api/check-appointments`

Check appointments for specified number of days.

**Query Parameters:**
- `days` (optional): Number of days to check (1-60, default: 30)

**Response:**
```json
{
  "success": true,
  "totalDaysChecked": 30,
  "availableAppointments": 3,
  "results": [...],
  "summary": {
    "hasAvailableAppointments": true,
    "earliestAvailable": {...},
    "totalSlots": 15
  }
}
```

## 🔒 Privacy & Security

- **No Data Storage**: No appointment data is stored
- **Secure Cookies**: Authentication cookies are environment variables
- **Rate Limiting**: Respectful delays between requests
- **HTTPS Only**: Secure connections in production

## 🆘 Troubleshooting

### Common Issues

1. **"Authentication cookies not configured"**
   - Make sure `USER_ID` and `CODE_AUTH` are set in environment variables
   - Check that cookies are valid (not expired)

2. **"No appointments found" but you see them on website**
   - Cookies may have expired - get fresh ones from browser
   - Website structure may have changed

3. **Deployment fails on Netlify**
   - Check that all environment variables are set
   - Ensure `NODE_VERSION = "18"` in build settings

### Getting Fresh Cookies

1. Clear browser cookies for mytor.co.il
2. Login to the barbershop website again
3. Get new `userID` and `codeAuth` values
4. Update environment variables

## 📞 Support

If you encounter issues:

1. Check the browser developer console for errors
2. Verify your cookies are still valid
3. Try with a different browser
4. Check Netlify function logs (if deployed)

## 🙏 Credits

Built with love for the Ram-El Barbershop community. This tool helps you find appointments faster so you can look your best! ✂️💇‍♂️ 