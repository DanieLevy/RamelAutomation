# Ramel Barbershop Appointment Checker

> **⚠️ Netlify Build Failing?** See [Environment Variables Setup Guide](./NETLIFY_ENV_SETUP.md)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Gmail account with app password

### Local Development

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` (or use your existing `.env.local`)
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run development server:
   ```bash
   npm run dev
   ```

### Deployment to Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. **IMPORTANT**: Set up environment variables - see [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md)
4. Deploy

## 📋 Environment Variables

All environment variables MUST be set in Netlify for deployment to work. See the full guide: [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md)

### Required Variables:
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EMAIL_SENDER`
- `EMAIL_APP_PASSWORD`
- `NEXT_PUBLIC_BASE_URL`
- `USER_ID`
- `CODE_AUTH`

## 🛠️ Troubleshooting

### Build Failing on Netlify?

Run the debug script to see which environment variables are missing:
```bash
npm run debug:env
```

Or add `ENV_DEBUG=true` as an environment variable in Netlify for detailed logs.

### Common Issues

1. **Missing environment variables**: Follow [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md)
2. **Variable name typos**: Variable names are case-sensitive
3. **Extra spaces**: Don't add spaces before/after values
4. **Quotes**: Don't add quotes around values in Netlify

## 📖 Documentation

- [Environment Variables Setup](./NETLIFY_ENV_SETUP.md)
- [Scheduled Functions](./NETLIFY_SCHEDULED_FUNCTIONS.md)
- [Notification System](./SIMPLIFIED_NOTIFICATION_SYSTEM.md)
- [Email Queue System](./EMAIL_QUEUE_SYSTEM.md)

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run debug:env` - Debug environment variables
- `npm run validate:env` - Validate all required variables are set
 