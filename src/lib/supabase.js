import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠ Supabase credentials not configured. OTP auth will not work.');
}

/**
 * Supabase client for server-side OTP operations.
 * Uses the anon key — only for signInWithOtp / verifyOtp.
 */
const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export default supabase;
