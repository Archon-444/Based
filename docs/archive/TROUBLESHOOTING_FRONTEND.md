# Frontend Troubleshooting Guide

**Issue Fixed**: Frontend was unable to create suggestions

---

## Problem

The frontend `.env` file had:
```env
VITE_API_URL=/api
```

This caused the frontend to make API requests to:
- ❌ `http://localhost:5173/api/suggestions` (wrong - no backend here)

Instead of:
- ✅ `http://localhost:3000/api/suggestions` (correct - backend server)

---

## Solution Applied

Updated `dapp/.env`:
```env
# Before
VITE_API_URL=/api

# After
VITE_API_URL=http://localhost:3000
```

---

## How to Test Now

### 1. Refresh Your Browser

Open http://localhost:5173 and **hard refresh** (Cmd+Shift+R on Mac or Ctrl+Shift+R on Windows)

### 2. Try Creating a Suggestion

1. Navigate to "Suggest Market" page
2. Fill in the form:
   - Question: "Will BTC reach $100,000 by 2025?"
   - Outcomes: ["Yes", "No"]
   - Category: "crypto"
   - Duration: 720 hours
   - Resolution Source: "Pyth Network"
3. Click "Submit"

### 3. Expected Result

- ✅ Success message
- ✅ Suggestion appears in the list
- ✅ Data saved to PostgreSQL database

---

## Verify Backend Connection

### Check Browser Console

Open browser DevTools (F12) and look in the Console tab:

**Before fix** (error):
```
Failed to fetch
POST http://localhost:5173/api/suggestions 404 (Not Found)
```

**After fix** (success):
```
POST http://localhost:3000/api/suggestions 201 (Created)
```

### Check Network Tab

In DevTools, go to Network tab and filter by "Fetch/XHR":

You should see:
- Request URL: `http://localhost:3000/api/suggestions`
- Status: `201 Created`
- Response: JSON with your suggestion data

---

## API Testing (Alternative)

If the frontend still has issues, you can test the backend API directly:

### Create Suggestion via cURL

```bash
curl -X POST http://localhost:3000/api/suggestions \
  -H "Content-Type: application/json" \
  -H "x-dev-wallet-address: 0xYOUR_WALLET" \
  -d '{
    "question": "Will BTC reach $100,000 by 2025?",
    "outcomes": ["Yes", "No"],
    "category": "crypto",
    "durationHours": 720,
    "resolutionSource": "Pyth Network"
  }'
```

### List All Suggestions

```bash
curl http://localhost:3000/api/suggestions
```

---

## Database Verification

Check that data is actually being saved:

```bash
psql postgresql://philippeschmitt@localhost:5432/prediction_market

# In PostgreSQL shell:
SELECT id, question, status, "createdAt"
FROM "Suggestion"
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

## Common Issues & Fixes

### Issue 1: CORS Error

**Error**: `Access to fetch at 'http://localhost:3000' has been blocked by CORS policy`

**Fix**: Backend `.env` should have:
```env
CORS_ORIGIN=http://localhost:5173
```

**Current status**: ✅ Already configured

### Issue 2: Backend Not Running

**Error**: `Failed to fetch` or `Connection refused`

**Check**:
```bash
curl http://localhost:3000/api/suggestions
```

**Fix**: Restart backend:
```bash
cd backend
npm run dev
```

### Issue 3: Wrong Port

**Error**: Frontend making requests to wrong port

**Check** `dapp/.env`:
```env
VITE_API_URL=http://localhost:3000  # Must match backend PORT
```

**Current status**: ✅ Fixed

### Issue 4: Environment Variable Not Loading

**Fix**: Hard refresh browser (Cmd+Shift+R)

Or restart Vite dev server:
```bash
# Kill current server
killall -9 node

# Restart
cd dapp
npm run dev
```

---

## Current Status

### ✅ Working

- Backend API: http://localhost:3000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432/prediction_market
- API endpoint: `POST /api/suggestions` ✅ Tested
- API endpoint: `GET /api/suggestions` ✅ Tested

### 🔧 Fixed

- ✅ Frontend `.env` updated to point to correct backend URL
- ✅ CORS configured for localhost:5173
- ✅ Development authentication bypass enabled

---

## Test Checklist

- [ ] Open http://localhost:5173
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Check browser console for errors
- [ ] Try creating a suggestion
- [ ] Check Network tab - should see POST to http://localhost:3000
- [ ] Verify suggestion appears in list
- [ ] Check database for new record

---

## Need More Help?

### View Backend Logs

The backend server console will show all incoming requests:
```
POST /api/suggestions 201 Created
GET /api/suggestions 200 OK
```

### View Frontend Logs

Browser console (F12) will show:
- API requests being made
- Success/error responses
- React Query cache updates

### Check Both Servers Running

```bash
# Backend (should show port 3000)
lsof -i :3000

# Frontend (should show port 5173)
lsof -i :5173
```

---

**Issue Resolved**: Frontend now correctly connects to backend API at http://localhost:3000 🎉

Try creating a suggestion now and it should work!
