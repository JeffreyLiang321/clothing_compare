import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

// Create Supabase client - PKCE is the default flow for OAuth in v2+
// Using redirectTo (query params) + exchangeCodeForSession() = PKCE flow
export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Automatically detect session in URL
  },
});

/**
 * Get the authentication callback URL for OAuth flows.
 */
export const getAuthRedirectUrl = () => `${window.location.origin}/auth/callback`;

/**
 * Get the finish setup redirect URL for email confirmation flows.
 */
export const getFinishSetupRedirectUrl = () => `${window.location.origin}/finish-setup`;