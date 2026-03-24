# 🚀 Start Services - Quick Reference

**All configuration is correct. Just follow these steps to start both services.**

---

## ✅ Prerequisites Check

```bash
# Verify PostgreSQL is running
/opt/homebrew/bin/brew services list | grep postgresql

# Start if needed
/opt/homebrew/bin/brew services start postgresql@15
```

---

## 1️⃣ Start Backend (Port 4000)

```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/backend

# Set environment and start
PORT=4000 DATABASE_URL="postgresql://philippeschmitt@localhost:5432/prediction_market" npm run dev
```

**Verify it's running:**
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","uptime":xxx}
```

---

## 2️⃣ Start Frontend (Port 5173)

**In a new terminal:**
```bash
cd /Users/philippeschmitt/Documents/aptos-prediction-market/dapp
npm run dev
```

**Verify it's running:**
- Open: http://localhost:5173
- Should see the Move Market homepage

---

## ✅ Verify Everything is Working

### Check Services
```bash
# Backend health
curl http://localhost:4000/health

# API endpoint test
curl "http://localhost:4000/api/markets?limit=1"

# Frontend
curl -s http://localhost:5173 | head -1
# Should return: <!DOCTYPE html>
```

### Check Configuration
```bash
# Backend port
lsof -ti:4000
# Should return a process ID

# Frontend port
lsof -ti:5173
# Should return a process ID

# Verify frontend API URL
cat dapp/.env | grep VITE_API_URL
# Should show: VITE_API_URL=http://localhost:4000/api
```

---

## 🧪 Test API Connectivity

Once both services are running, test that the frontend can reach the backend:

1. Open http://localhost:5173
2. Open browser DevTools (F12) → Console
3. Try submitting a suggestion or interacting with the app
4. API calls should go to `http://localhost:4000/api/*`
5. No CORS errors should appear

---

## 🛑 Stop Services

```bash
# Kill backend
lsof -ti:4000 | xargs kill

# Kill frontend
lsof -ti:5173 | xargs kill

# Or kill all
ps aux | grep -E "(tsx watch|vite)" | grep -v grep | awk '{print $2}' | xargs kill
```

---

## 🔧 Troubleshooting

### Backend won't start on port 4000

**Problem:** Backend starts on port 3000 instead
**Solution:** Explicitly set PORT environment variable

```bash
cd backend
PORT=4000 DATABASE_URL="postgresql://philippeschmitt@localhost:5432/prediction_market" npm run dev
```

### Frontend shows wrong API URL (3001)

**Problem:** Old environment variable cached
**Solution:**
1. Verify `dapp/.env` has: `VITE_API_URL=http://localhost:4000/api`
2. Stop frontend completely: `lsof -ti:5173 | xargs kill`
3. Start fresh: `cd dapp && npm run dev`
4. Hard reload browser (Cmd+Shift+R)

### Database connection errors

**Problem:** `User 'postgres' was denied access`
**Solution:** Use explicit DATABASE_URL

```bash
export DATABASE_URL="postgresql://philippeschmitt@localhost:5432/prediction_market"
cd backend
npm run dev
```

### CORS errors in browser

**Problem:** Backend not allowing frontend origin
**Solution:** Verify backend `.env` has:
```
CORS_ORIGIN=http://localhost:5173
```

---

## 📋 Current Configuration

### Backend (.env)
```
PORT=4000
DATABASE_URL=postgresql://philippeschmitt@localhost:5432/prediction_market
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000/api
VITE_ACTIVE_CHAINS=aptos,sui
VITE_APTOS_NETWORK=testnet
VITE_SUI_NETWORK=testnet
```

---

## ✅ Success Checklist

After starting both services, verify:

- [ ] Backend running on port 4000
- [ ] Frontend running on port 5173
- [ ] `curl http://localhost:4000/health` returns `{"status":"ok"}`
- [ ] `curl http://localhost:4000/api/markets` returns market data
- [ ] Browser can load http://localhost:5173
- [ ] Browser console shows no CORS errors
- [ ] API calls go to `http://localhost:4000/api/*` (check DevTools Network tab)

**If all checked, you're ready to test!** 🎉

---

## 📚 Additional Documentation

- **[FINAL_DEPLOYMENT_STATUS.md](FINAL_DEPLOYMENT_STATUS.md)** - Complete deployment guide
- **[ADMIN_ROLES_SETUP_GUIDE.md](ADMIN_ROLES_SETUP_GUIDE.md)** - Admin role management
- **[BLOCKING_ISSUES_FIXED.md](BLOCKING_ISSUES_FIXED.md)** - Issues resolved
