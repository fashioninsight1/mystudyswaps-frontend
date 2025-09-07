import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

// CRITICAL: Use anon key for client-side authentication (NOT service key)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY! // Client-safe anon key
);

// CRITICAL FIX: OAuth State Management with Server Integration
export const OAuthSecurity = {
  // Generate secure OAuth state with server-side validation token
  generateState: async (redirectTo = '/'): Promise<string> => {
    const nonce = crypto.getRandomValues(new Uint8Array(16));
    const nonceHex = Array.from(nonce).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const state = {
      nonce: nonceHex,
      timestamp: Date.now(),
      redirect: redirectTo,
      csrf: CryptoJS.lib.WordArray.random(16).toString(),
      // CRITICAL: Add server validation token
      validation_token: await generateServerValidationToken()
    };
    
    const encoded = btoa(JSON.stringify(state));
    
    // Store state securely in sessionStorage AND send to server for validation
    sessionStorage.setItem('oauth_state', encoded);
    
    // CRITICAL FIX: Register state with server for validation
    await registerOAuthStateWithServer(encoded);
    
    return encoded;
  },

  // CRITICAL FIX: Validate state with server-side verification
  validateState: async (receivedState: string): Promise<any | null> => {
    try {
      const storedState = sessionStorage.getItem('oauth_state');
      if (!storedState) {
        throw new Error('No stored OAuth state found');
      }

      if (receivedState !== storedState) {
        throw new Error('OAuth state mismatch');
      }

      const decoded = JSON.parse(atob(receivedState));
      
      // Check timestamp (10 minute window)
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      
      if (now - decoded.timestamp > tenMinutes) {
        throw new Error('OAuth state expired');
      }

      // CRITICAL FIX: Validate with server
      const isValidOnServer = await validateOAuthStateWithServer(receivedState);
      if (!isValidOnServer) {
        throw new Error('Server-side state validation failed');
      }

      // Clear used state
      sessionStorage.removeItem('oauth_state');
      await clearOAuthStateFromServer(receivedState);
      
      return decoded;
    } catch (error) {
      console.error('OAuth state validation failed:', error);
      return null;
    }
  },

  // CRITICAL FIX: Secure OAuth initiation that works with server flow
  initiateOAuth: async (provider = 'google', redirectTo = '/') => {
    try {
      const state = await OAuthSecurity.generateState(redirectTo);
      
      // CRITICAL FIX: Use unified OAuth initiation endpoint
      const response = await fetch('/api/auth/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await generateCSRFToken(),
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          provider,
          state,
          redirect_to: redirectTo
        })
      });

      if (!response.ok) {
        throw new Error('OAuth initiation failed');
      }

      const { redirect_url } = await response.json();
      
      // CRITICAL FIX: Redirect to server-generated URL (no token exposure)
      window.location.href = redirect_url;
      
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      throw error;
    }
  }
};

// Helper functions for server integration
async function generateServerValidationToken(): Promise<string> {
  const response = await fetch('/api/auth/oauth/generate-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate server validation token');
  }
  
  const { token } = await response.json();
  return token;
}

async function registerOAuthStateWithServer(state: string): Promise<void> {
  await fetch('/api/auth/register-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state })
  });
}

async function validateOAuthStateWithServer(state: string): Promise<boolean> {
  const response = await fetch('/api/auth/oauth/validate-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': await generateCSRFToken()
    },
    body: JSON.stringify({ state })
  });
  
  if (!response.ok) return false;
  
  const { valid } = await response.json();
  return valid;
}

async function clearOAuthStateFromServer(state: string): Promise<void> {
  await fetch('/api/auth/oauth/clear-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': await generateCSRFToken()
    },
    body: JSON.stringify({ state })
  });
}

// CRITICAL FIX: Enhanced CSRF token management with unified server API
async function generateCSRFToken(): Promise<string> {
  try {
    // Always get fresh CSRF token from server
    const response = await fetch('/api/auth/csrf/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate CSRF token');
    }
    
    const { csrf_token } = await response.json();
    
    // Store token for client-side access
    sessionStorage.setItem('csrf_token', csrf_token);
    
    return csrf_token;
  } catch (error) {
    console.warn('CSRF token generation failed, using fallback');
    return CryptoJS.lib.WordArray.random(32).toString();
  }
}

// CRITICAL FIX: Unified secure API request using cookie-based authentication
export const secureApiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    // Generate CSRF token from server
    const csrfToken = await generateCSRFToken();

    // Prepare headers for unified security
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    };

    // Make request with cookie-based auth
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Use cookies for authentication
    });

    // Handle session refresh header
    if (response.headers.get('x-session-refreshed') === 'true') {
      console.log('Session was automatically refreshed by server');
    }

    // Handle authentication errors
    if (response.status === 401) {
      // Clear local storage and redirect to login
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/';
      throw new Error('Authentication required');
    }

    return await parseResponse(response);

  } catch (error) {
    console.error('Secure API request failed:', error);
    throw error;
  }
};

// Helper function to parse response
async function parseResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

// CRITICAL FIX: Unified session management using server endpoints
export const SessionManager = {
  // Check if user has valid session using server endpoint
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) return false;
      
      const { authenticated } = await response.json();
      return authenticated;
    } catch (error) {
      console.error('Session check failed:', error);
      return false;
    }
  },

  // Get current user from server session
  getCurrentUser: async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) return null;
      
      const { user } = await response.json();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Session refresh is handled automatically by server
  refreshSession: async (): Promise<boolean> => {
    // Server handles automatic refresh, just check session status
    return await SessionManager.isAuthenticated();
  },

  // Secure logout using server endpoint
  logout: async () => {
    try {
      // Clear client-side storage
      sessionStorage.clear();
      localStorage.clear();
      
      // Call server logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Redirect to login
    window.location.href = '/';
  }
};

export { supabase };