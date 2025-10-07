# Fingerprint Scanner Authentication Update

## Summary

Updated the fingerprint scanning feature to include authentication with the vitals API before establishing the socket connection for the scanning process.

## Changes Made

### 1. New Authentication Service
**File**: `src/services/fingerprintAuthService.ts`

- Created new service to handle login to vitals API
- Endpoint: `https://vitals.miavitals.com/api/v1/login`
- Credentials:
  - Username: `info@carevisionai.com`
  - Password: `Carevision@2263`
- Returns access token with 3600 second expiry

### 2. Updated Socket Service
**File**: `src/services/fingerprintSocketService.ts`

**Changes**:
- Updated socket URL from `https://` to `wss://` (WebSocket protocol)
- Changed authentication method from query parameter to auth header
- Now uses: `auth: { Authorization: "Bearer <access_token>" }`
- Removed access_token from query parameters

**Before**:
```typescript
this.socket = io(SOCKET_URL, {
  transports: ['websocket'],
  forceNew: true,
  withCredentials: true,
  query: {
    access_token: accessToken,
    ...params
  }
});
```

**After**:
```typescript
this.socket = io(SOCKET_URL, {
  transports: ['websocket'],
  forceNew: true,
  withCredentials: true,
  auth: {
    Authorization: `Bearer ${accessToken}`
  },
  query: params
});
```

### 3. Updated Fingerprint Scanner Component
**File**: `src/components/fingerprint-scan-screen.tsx`

**Changes**:
- Added import for `loginToVitalsAPI` authentication service
- Modified initialization flow to include authentication as first step
- Added better error handling for authentication failures
- Updated flow:
  1. **Step 1**: Login to vitals API to get access token
  2. **Step 2**: Initialize socket connection with bearer token
  3. **Step 3**: Wait for socket to connect
  4. **Step 4**: Initialize camera and start frame capture

**Code Changes**:
```typescript
const initializeScan = async () => {
  try {
    // Step 1: Login to get access token
    console.log('Authenticating with vitals API...')
    const loginResponse = await loginToVitalsAPI()
    const accessToken = loginResponse.access_token
    console.log('Authentication successful, token expires in:', loginResponse.expires_in, 'seconds')

    // Step 2: Initialize socket connection
    socketServiceRef.current = new FingerprintSocketService()

    // Step 3: Wait for socket to connect before starting frame capture
    await new Promise<void>((resolve, reject) => {
      // ... socket connection logic
    })

    // Step 4: Initialize camera and start frame capture
    // ... existing code
  } catch (err) {
    // Enhanced error handling
  }
}
```

### 4. Enhanced Error Handling

Added specific error handling for authentication failures:

```typescript
if (err.message.includes('Authentication') || err.message.includes('Login')) {
  setError(t('fingerprintScan.errors.authenticationFailed'))
}
```

### 5. Translation Updates

**English** (`public/locales/en/common.json`):
```json
"fingerprintScan": {
  "errors": {
    "authenticationFailed": "Authentication failed. Please contact support."
  }
}
```

**Arabic** (`public/locales/ar/common.json`):
```json
"fingerprintScan": {
  "errors": {
    "authenticationFailed": "فشلت المصادقة. يرجى الاتصال بالدعم الفني."
  }
}
```

## Authentication Flow

```
User initiates fingerprint scan
         ↓
POST https://vitals.miavitals.com/api/v1/login
    (username + password)
         ↓
Receive access_token (valid for 3600 seconds)
         ↓
Connect to wss://amal.miavitals.com/process_frame
    with auth: { Authorization: "Bearer <token>" }
         ↓
Socket established
         ↓
Start camera and frame capture
         ↓
Send frames via socket
         ↓
Receive vitals results
```

## Security Considerations

⚠️ **Important**: The credentials are currently hardcoded in the authentication service. For production:

1. Move credentials to environment variables
2. Consider using a backend proxy to handle authentication
3. Implement token refresh mechanism before expiry
4. Add error handling for expired tokens

## Testing Checklist

- [ ] Login API successfully returns access token
- [ ] Socket connection establishes with bearer token
- [ ] Authentication failure shows proper error message
- [ ] Token expiry is handled gracefully
- [ ] Translation works for both English and Arabic
- [ ] Full fingerprint scan flow completes successfully

## Files Modified

1. `src/services/fingerprintAuthService.ts` - NEW
2. `src/services/fingerprintSocketService.ts` - MODIFIED
3. `src/components/fingerprint-scan-screen.tsx` - MODIFIED
4. `public/locales/en/common.json` - MODIFIED
5. `public/locales/ar/common.json` - MODIFIED

## Next Steps

1. Test the complete authentication flow
2. Verify socket connection with bearer token
3. Test error scenarios (network failure, invalid credentials, etc.)
4. Consider moving credentials to environment variables
5. Implement token refresh mechanism if needed
