// Fingerprint Scanner Authentication Service
// Singleton pattern to prevent duplicate login calls

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Global state for token caching (singleton pattern)
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number = 0;
let loginPromise: Promise<LoginResponse> | null = null;
let activeAbortController: AbortController | null = null;

/**
 * Get cached access token or login to get a new one
 * This prevents duplicate login calls and reuses valid tokens
 */
export async function getAuthToken(): Promise<string> {
  // Return cached token if still valid (with 60 second buffer)
  const now = Date.now();
  if (cachedAccessToken && now < (tokenExpiryTime - 60000)) {
    console.log('✅ Using cached access token (expires in', Math.round((tokenExpiryTime - now) / 1000), 'seconds)');
    return cachedAccessToken;
  }

  // If token expired, clear it
  if (cachedAccessToken && now >= tokenExpiryTime) {
    console.log('⏰ Cached token expired, will get new token');
    cachedAccessToken = null;
    tokenExpiryTime = 0;
  }

  // Reuse in-flight login request to prevent duplicates
  if (loginPromise) {
    console.log('⏳ Login already in progress, waiting for it to complete...');
    const response = await loginPromise;
    return response.access_token;
  }

  // Start new login
  console.log('🔐 No valid token, starting new login...');
  loginPromise = loginToVitalsAPI();

  try {
    const response = await loginPromise;
    cachedAccessToken = response.access_token;
    tokenExpiryTime = Date.now() + (response.expires_in * 1000);
    console.log('✅ New token cached (valid for', response.expires_in, 'seconds)');
    return response.access_token;
  } finally {
    loginPromise = null;
  }
}

/**
 * Clear cached token (useful for logout or token invalidation)
 */
export function clearAuthToken(): void {
  console.log('🧹 Clearing cached access token');
  cachedAccessToken = null;
  tokenExpiryTime = 0;
  loginPromise = null;

  // Cancel any in-flight login request
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

/**
 * Authenticates with the vitals API and retrieves an access token
 * This token is required before establishing the socket connection
 *
 * NOTE: Use getAuthToken() instead to benefit from caching
 */
async function loginToVitalsAPI(): Promise<LoginResponse> {
  const LOGIN_URL = 'https://vitals.miavitals.com/api/v1/login';

  const credentials: LoginCredentials = {
    username: 'info@carevisionai.com',
    password: 'Carevision@2263'
  };

  // Cancel previous request if any
  if (activeAbortController) {
    activeAbortController.abort();
  }

  // Create new AbortController for this request
  activeAbortController = new AbortController();

  try {
    console.log('📡 Sending login request to:', LOGIN_URL);

    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials),
      signal: activeAbortController.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    const data: LoginResponse = await response.json();

    console.log('✅ Successfully authenticated with vitals API');
    activeAbortController = null;

    return data;

  } catch (error) {
    activeAbortController = null;

    // Don't throw error if request was aborted (it's intentional)
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('⚠️ Login request was cancelled');
      throw new Error('Login cancelled');
    }

    console.error('❌ Failed to authenticate with vitals API:', error);
    throw new Error(
      error instanceof Error
        ? `Authentication error: ${error.message}`
        : 'Unknown authentication error'
    );
  }
}
