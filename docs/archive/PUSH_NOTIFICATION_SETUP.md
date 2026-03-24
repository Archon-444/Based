# Push Notification Setup Guide

## Overview

This guide explains how to set up server-side push notifications for Move Market using the Web Push API with VAPID (Voluntary Application Server Identification).

## Prerequisites

- Node.js server (Express, Fastify, etc.)
- Access to your production domain
- SSL/TLS certificate (HTTPS required)

## 1. Generate VAPID Keys

### Option A: Using web-push library (Node.js)

```bash
npm install web-push --save
```

```javascript
// scripts/generate-vapid-keys.js
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Public Key:', vapidKeys.publicKey);
console.log('VAPID Private Key:', vapidKeys.privateKey);

// Save these keys securely
```

Run:
```bash
node scripts/generate-vapid-keys.js
```

### Option B: Using web-push CLI

```bash
npx web-push generate-vapid-keys
```

**IMPORTANT**:
- Store the **private key** securely (environment variable, secrets manager)
- The **public key** goes in your frontend code
- Never commit private keys to git

## 2. Backend Setup

### Install Dependencies

```bash
npm install web-push
```

### Server Configuration

```javascript
// server/push-notifications.js
const webpush = require('web-push');

// Set VAPID details (from environment variables)
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Your contact email
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Store subscriptions in database
const subscriptions = new Map(); // Use proper database in production

// Subscribe endpoint
app.post('/api/push/subscribe', async (req, res) => {
  const { subscription, userAddress } = req.body;

  try {
    // Store subscription in database
    subscriptions.set(userAddress, subscription);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Unsubscribe endpoint
app.post('/api/push/unsubscribe', async (req, res) => {
  const { userAddress } = req.body;

  try {
    subscriptions.delete(userAddress);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Send notification function
async function sendPushNotification(userAddress, payload) {
  const subscription = subscriptions.get(userAddress);

  if (!subscription) {
    throw new Error('No subscription found for user');
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    data: payload.url || '/',
    tag: payload.tag || 'default',
  });

  try {
    await webpush.sendNotification(subscription, notificationPayload);
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);

    // If subscription is expired, remove it
    if (error.statusCode === 410) {
      subscriptions.delete(userAddress);
    }

    throw error;
  }
}

// Example: Send win notification
async function sendWinNotification(userAddress, amount, marketQuestion) {
  await sendPushNotification(userAddress, {
    title: '🎉 You Won!',
    body: `Congratulations! You won $${amount.toFixed(2)} on "${marketQuestion}"`,
    url: '/dashboard',
    tag: 'win',
  });
}

module.exports = {
  sendPushNotification,
  sendWinNotification,
};
```

## 3. Frontend Configuration

Update the VAPID public key in your frontend:

```typescript
// frontend/src/config/push.ts
export const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';

// Validate key is set
if (!VAPID_PUBLIC_KEY && process.env.NODE_ENV === 'production') {
  console.error('VAPID_PUBLIC_KEY not set!');
}
```

Update `.env`:

```bash
# Frontend .env
REACT_APP_VAPID_PUBLIC_KEY=your_public_key_here
```

Update `.env.example`:

```bash
# Frontend .env.example
REACT_APP_VAPID_PUBLIC_KEY=
```

## 4. Database Schema

Store subscriptions in your database:

```sql
-- PostgreSQL example
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(66) NOT NULL,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_address, endpoint)
);

-- Index for fast lookups
CREATE INDEX idx_push_subscriptions_user_address ON push_subscriptions(user_address);
```

## 5. Environment Variables

### Backend (.env)

```bash
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

### Frontend (.env)

```bash
REACT_APP_VAPID_PUBLIC_KEY=your_public_key_here
REACT_APP_API_URL=https://api.movemarket.com
```

## 6. Notification Triggers

### Market Resolution

```javascript
// When market resolves
async function resolveMarket(marketId, winningOutcome) {
  // ... resolve market logic ...

  // Get all users who bet on this market
  const users = await getMarketParticipants(marketId);

  for (const user of users) {
    const userBet = await getUserBet(user.address, marketId);

    if (userBet.outcome === winningOutcome) {
      // User won
      await sendWinNotification(
        user.address,
        userBet.potentialWin,
        market.question
      );
    }
  }
}
```

### Market Closing Soon

```javascript
// Cron job - runs every hour
async function checkClosingMarkets() {
  const markets = await getMarketsClosingInNextHour();

  for (const market of markets) {
    const watchers = await getMarketWatchers(market.id);

    for (const watcher of watchers) {
      await sendPushNotification(watcher.address, {
        title: '⏰ Market Closing Soon',
        body: `"${market.question}" closes in 1 hour`,
        url: `/market/${market.id}`,
        tag: 'market_closing',
      });
    }
  }
}

// Run every hour
setInterval(checkClosingMarkets, 60 * 60 * 1000);
```

## 7. Testing

### Test Subscription

```bash
curl -X POST http://localhost:3000/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    },
    "userAddress": "0x1234..."
  }'
```

### Test Notification

```javascript
// test-notification.js
const { sendWinNotification } = require('./server/push-notifications');

sendWinNotification(
  '0x1234...',
  50.00,
  'Will Bitcoin reach $100k by end of 2025?'
);
```

## 8. Security Best Practices

1. **Rate Limiting**: Limit subscription requests to prevent abuse
2. **User Verification**: Verify user owns the wallet address before subscribing
3. **Subscription Cleanup**: Remove expired subscriptions (410 status)
4. **Payload Validation**: Validate notification payloads on server
5. **HTTPS Only**: Push notifications require HTTPS
6. **Key Rotation**: Rotate VAPID keys periodically
7. **Monitoring**: Log all notification sends and failures

## 9. Production Deployment

### Vercel/Netlify (Frontend)

```bash
# Set environment variable
vercel env add REACT_APP_VAPID_PUBLIC_KEY
```

### Heroku/Railway (Backend)

```bash
heroku config:set VAPID_PUBLIC_KEY=your_public_key
heroku config:set VAPID_PRIVATE_KEY=your_private_key
```

### Docker

```dockerfile
# Dockerfile
ENV VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
ENV VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
```

## 10. Troubleshooting

### Notifications not received

1. Check browser console for errors
2. Verify VAPID keys match frontend/backend
3. Ensure HTTPS is enabled
4. Check notification permissions
5. Verify service worker is active

### 403 Unauthorized

- VAPID keys don't match
- Subject (email) is missing or invalid

### 410 Gone

- Subscription expired
- Remove from database and re-subscribe

## Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [web-push NPM Package](https://www.npmjs.com/package/web-push)
- [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/aptos-predict/issues
- Email: support@movemarket.com
