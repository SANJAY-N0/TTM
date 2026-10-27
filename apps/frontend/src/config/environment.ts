export const environment = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  isProduction: import.meta.env.PROD || false,
};
