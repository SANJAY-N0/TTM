import { createClient } from '@supabase/supabase-js';
import { EnvironmentService } from '../services/EnvironmentService';

export const getSupabaseClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  
  const envService = EnvironmentService.getInstance();
  
  // Return null if database writes are disabled or env is missing
  if (!envService.isDatabaseWritesEnabled() || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};
