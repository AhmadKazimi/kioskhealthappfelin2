# Environment Variables Documentation

## Overview

This document explains all environment variables used in the application, where they're used, and why.

---

## 🔧 Main Environment Variable

### `NEXT_PUBLIC_API_BASE_URL`

**Purpose**: Backend API base URL for all API calls

**Required**: ✅ Yes (for production)

**Format**: `https://your-backend-domain.com/api`

**Example Values**:
```bash
# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Production
NEXT_PUBLIC_API_BASE_URL=https://kiosk-be2-production.up.railway.app/api
```

---

## 📍 Where It's Used (18 locations)

### 1. **Fingerprint Scan Results** 
**File**: `src/services/saveFingerprintScan.ts`  
**Line**: 71  
**Purpose**: Save fingerprint scan results and trigger arrhythmia detection  
**Endpoints**:
- `POST ${apiUrl}/ScanResult/AddScanResult`
- `POST ${apiUrl}/Arrhythmia/AddArrhythmiaRequest`

### 2. **Admin Panel**
**File**: `src/components/admin-panel.tsx`  
**Line**: 94  
**Purpose**: Admin dashboard API calls  

### 3. **Health Summary Page**
**File**: `src/components/New pages/health-summary-page.tsx`  
**Line**: 48  
**Purpose**: Send health summary emails  
**Endpoint**: `POST ${apiUrl}/Email/SendEmail`

### 4. **Health Summary Modal**
**File**: `src/components/health-summary-modal.tsx`  
**Line**: 46  
**Purpose**: Send health summary from modal view  
**Endpoint**: `POST ${apiUrl}/Email/SendEmail`

### 5. **Country Selector**
**File**: `src/components/ui/country-selector.tsx`  
**Line**: 26  
**Purpose**: Fetch list of countries/nationalities  
**Endpoint**: `GET ${apiUrl}/Nationality`

### 6. **Client Assessment**
**File**: `src/components/client-assessment.tsx`  
**Line**: 35  
**Purpose**: Submit client assessment data  

### 7. **Personal Info Screen (New)**
**File**: `src/components/New pages/Newpersonal-info-screen.tsx`  
**Line**: 106  
**Purpose**: Create new client profile  
**Endpoint**: `POST ${apiUrl}/Client/AddClient`

### 8. **Complaint Screen**
**File**: `src/components/complaint-screen.tsx`  
**Line**: 68  
**Purpose**: Save client complaints/health concerns  
**Endpoint**: `PUT ${apiUrl}/Client/UpdateClient`

### 9. **User Info Screen**
**File**: `src/components/user-info-screen.tsx`  
**Line**: 76  
**Purpose**: Update client age/gender  
**Endpoint**: `PUT ${apiUrl}/Client/UpdateClient`

### 10. **Client Scan Results Hook**
**File**: `src/hooks/useClientScanResults.ts`  
**Line**: 36  
**Purpose**: Fetch client's scan history  
**Endpoint**: `GET ${apiUrl}/Client/GetClientDetails?clientId=${id}`

### 11. **Shenai Scanner**
**File**: `src/components/ShenaiScanner.tsx`  
**Line**: 13  
**Purpose**: Save face scan results  
**Endpoint**: `POST ${apiUrl}/ScanResult/AddScanResult`

### 12. **User Profile**
**File**: `src/components/user-profile.tsx`  
**Line**: 47  
**Purpose**: Fetch user profile data  
**Endpoint**: `GET ${apiUrl}/Client/GetClientDetails?clientId=${id}`

### 13. **Chatbot Screen**
**File**: `src/components/chatbot-screen.tsx`  
**Line**: 135  
**Purpose**: Send chat messages to AI/backend  

### 14. **Health Summary Screen**
**File**: `src/components/health-summary-screen.tsx`  
**Line**: 44  
**Purpose**: Generate and display health summaries  

### 15. **Physicians Grid**
**File**: `src/components/physicians-grid.tsx`  
**Line**: 61  
**Purpose**: Fetch list of physicians/doctors  
**Endpoint**: `GET ${apiUrl}/Physicians`

### 16. **Personal Info Screen (Legacy)**
**File**: `src/components/personal-info-screen.tsx`  
**Line**: 76  
**Purpose**: Create client profile (legacy version)  
**Endpoint**: `POST ${apiUrl}/Client/AddClient`

---

## 🔐 Why `NEXT_PUBLIC_` Prefix?

Next.js requires the `NEXT_PUBLIC_` prefix to expose environment variables to the **browser/client-side** code.

### How Next.js Environment Variables Work:

| Prefix | Available In | Example |
|--------|-------------|---------|
| `NEXT_PUBLIC_*` | ✅ Browser & Server | `NEXT_PUBLIC_API_BASE_URL` |
| No prefix | ❌ Server only | `DATABASE_URL` |

**Why we need it**:
- Our API calls happen in React components (client-side)
- Without `NEXT_PUBLIC_`, the variable would be `undefined` in the browser
- Server-only variables are used for secrets (database passwords, API keys)

---

## 📝 Environment Files

### File Structure

```
your-project/
├── .env.local           # ← Local development (gitignored)
├── .env.development     # ← Development environment
├── .env.production      # ← Production environment
└── .env                 # ← Default fallback
```

### Priority Order (highest to lowest):
1. `.env.local` (always gitignored)
2. `.env.development` or `.env.production` (based on NODE_ENV)
3. `.env`

---

## 🛠️ Setup Instructions

### For Development

**Create `.env.local`** (not tracked in git):
```bash
# Development API URL (local backend)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# Or use ngrok/tunneling for testing
NEXT_PUBLIC_API_BASE_URL=https://abc123.ngrok.io/api
```

### For Production

**Set in deployment platform** (Vercel, Railway, etc.):
```bash
# Production API URL
NEXT_PUBLIC_API_BASE_URL=https://kiosk-be2-production.up.railway.app/api
```

### For Testing Without Backend

If you want to test the frontend without a backend:
```bash
# Leave empty or use placeholder
NEXT_PUBLIC_API_BASE_URL=
```

The app will skip API calls and show warning messages in console.

---

## ⚠️ Common Issues & Solutions

### Issue 1: API calls return 404
**Cause**: Wrong URL in environment variable  
**Solution**: 
```bash
# Check the URL format - should include /api
✅ CORRECT: https://your-domain.com/api
❌ WRONG:   https://your-domain.com
```

### Issue 2: Variable is undefined in browser
**Cause**: Missing `NEXT_PUBLIC_` prefix  
**Solution**: Always use `NEXT_PUBLIC_` for client-side variables

### Issue 3: Changes not taking effect
**Cause**: Need to restart dev server after .env changes  
**Solution**:
```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

### Issue 4: Works locally but not in production
**Cause**: Environment variable not set on deployment platform  
**Solution**: Set it in your hosting provider's dashboard:
- **Vercel**: Project Settings → Environment Variables
- **Railway**: Project → Variables → Add Variable
- **Netlify**: Site Settings → Environment Variables

---

## 🔍 How to Check Current Value

### In Browser Console:
```javascript
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
```

### In Component:
```typescript
console.log('API URL:', process.env.NEXT_PUBLIC_API_BASE_URL)
```

### Expected Output:
```
API URL: https://kiosk-be2-production.up.railway.app/api
```

---

## 🚀 API Call Examples

### Standard Pattern Used Throughout App:

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

// Check if configured
if (!apiUrl) {
  console.warn('⚠️ No backend API URL configured');
  return;
}

// Make API call
const response = await fetch(`${apiUrl}/YourEndpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // For ngrok testing
  },
  body: JSON.stringify(data)
});
```

---

## 📊 Backend API Endpoints Summary

Based on the code, here are all the endpoints your backend should have:

| Endpoint | Method | Purpose | Used In |
|----------|--------|---------|---------|
| `/Client/AddClient` | POST | Create new client | Personal info screens |
| `/Client/UpdateClient` | PUT | Update client data | User info, Complaint |
| `/Client/GetClientDetails` | GET | Fetch client data | User profile, Scan results |
| `/ScanResult/AddScanResult` | POST | Save scan results | Fingerprint & Face scan |
| `/Arrhythmia/AddArrhythmiaRequest` | POST | Detect arrhythmia | Fingerprint scan |
| `/Email/SendEmail` | POST | Send health summary | Health summary pages |
| `/Nationality` | GET | Get countries list | Country selector |
| `/Physicians` | GET | Get doctors list | Physicians grid |

---

## 🔒 Security Notes

### DO ✅:
- Use HTTPS in production
- Set different URLs for dev/prod
- Keep `.env.local` in `.gitignore`

### DON'T ❌:
- Don't commit `.env.local` to git
- Don't put API keys in `NEXT_PUBLIC_*` variables (they're exposed to browser)
- Don't hardcode URLs in components

---

## 🧪 Testing Checklist

✅ **Verify Variable is Set**:
```bash
echo $NEXT_PUBLIC_API_BASE_URL  # In terminal
```

✅ **Verify in Browser**:
```javascript
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)  # Should not be undefined
```

✅ **Test API Call**:
- Start app
- Open browser console
- Perform an action that makes API call
- Check Network tab for correct URL

✅ **Test Different Environments**:
- Development: Should use dev backend
- Production: Should use prod backend

---

## 📖 Related Documentation

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- Backend API Documentation: (link to your backend docs)

---

## 🛠️ Quick Commands

```bash
# Check if variable is set
npm run env | grep NEXT_PUBLIC_API_BASE_URL

# Test with different URL temporarily
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api npm run dev

# Build with production env
npm run build
```

---

## Date
October 11, 2025

## Changelog

### 2025-10-11
- ✅ Fixed inconsistency: Changed `NEXT_PUBLIC_API_URL` to `NEXT_PUBLIC_API_BASE_URL` in `saveFingerprintScan.ts`
- 📝 Documented all 18 locations where the variable is used
- 📚 Created comprehensive environment variables guide

