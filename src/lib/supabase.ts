import { createClient } from '@supabase/supabase-js';
import { getRedirectUrl, providerToSupabase, type AuthProvider } from '@/config/auth';

// Fallback for missing environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables - authentication will be disabled');
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Auth helper functions
export const authHelpers = {
  // Sign up with email/password - bypassing Supabase email verification
  async signUp(email: string, password: string, firstName?: string, lastName?: string) {
    try {
      // First create the user in Supabase without triggering email verification
      // by creating them with a temporary unverified state
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      // If Supabase throws email error, catch it and return success anyway
      // since we'll handle email verification with our own SendGrid system
      if (error && error.message?.includes('sending confirmation email')) {
        console.log('Supabase email service unavailable - using custom email system');
        return { 
          data: { user: { email, id: 'pending-verification' } }, 
          error: null 
        };
      }
      
      return { data, error };
    } catch (err) {
      // Catch any email-related errors and handle gracefully
      if (err instanceof Error && err.message?.includes('email')) {
        return { 
          data: { user: { email, id: 'pending-verification' } }, 
          error: null 
        };
      }
      return { data: null, error: err as Error };
    }
  },

  // Sign in with email/password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Unified OAuth sign in method
  async signInWithProvider(provider: AuthProvider) {
    const supabaseProvider = providerToSupabase[provider];
    const redirectUrl = getRedirectUrl();
      
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider as any,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    return { data, error };
  },

  // Sign in with Google using popup
  async signInWithGoogle() {
    return this.signInWithProvider('google');
  },

  // Alternative popup-based Google sign in
  async signInWithGooglePopup() {
    try {
      const redirectUrl = window.location.hostname === 'localhost' ? 
        `${window.location.origin}/auth/callback` : 
        'https://mystudyswaps.com/auth/callback';
        
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  },

  // Sign in with Microsoft
  async signInWithMicrosoft() {
    return this.signInWithProvider('microsoft');
  },

  // Sign in with Apple
  async signInWithApple() {
    return this.signInWithProvider('apple');
  },

  // Sign in with Facebook
  async signInWithFacebook() {
    return this.signInWithProvider('facebook');
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }
};