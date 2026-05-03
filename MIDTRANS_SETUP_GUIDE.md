# Midtrans Setup Guide

## Problem
The payment system is failing with a 500 Internal Server Error because Midtrans credentials are not configured.

## Solution

### 1. Get Midtrans Credentials
1. Go to [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. Sign up or log in
3. Go to Settings → API Keys
4. For development, use the **Sandbox** keys:
   - Client Key (starts with `SB-Mid-client-`)
   - Server Key (starts with `SB-Mid-server-`)

### 2. Configure Environment Variables
Create or update your `.env.local` file:

```bash
# Midtrans Configuration (Sandbox for development)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-YourSandboxClientKeyHere
MIDTRANS_SERVER_KEY=SB-Mid-server-YourSandboxServerKeyHere
MIDTRANS_PRODUCTION=false

# Base URL for callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Restart Development Server
After updating `.env.local`, restart your Next.js development server:

```bash
npm run dev
```

### 4. Test the Payment Flow
1. Go through the booking process
2. Select payment method (QRIS or Transfer Bank)
3. The payment should now work with Midtrans Sandbox

## Troubleshooting

### If you don't have Midtrans account yet:
1. Sign up at [Midtrans](https://midtrans.com/)
2. Verify your email
3. Create a sandbox account
4. Get your API keys from the dashboard

### If you want to test without real Midtrans:
The API should automatically provide a mock response in development if credentials are missing, but this requires:
- `MIDTRANS_PRODUCTION=false` (default)
- `NODE_ENV=development` (default for `npm run dev`)

### Common Issues:
- **500 Error**: Missing or incorrect API keys
- **Invalid Keys**: Make sure you're using Sandbox keys for development
- **Network Issues**: Check if you can access midtrans.com

## Testing with Mock Data
If you want to test the payment flow without setting up Midtrans immediately, you can temporarily modify the API to always return mock data, but this is not recommended for production use.
