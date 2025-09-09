// API Configuration - Switch between mock and Supabase APIs
export const API_CONFIG = {
  // Set to 'mock' to use mock data, 'supabase' to use Supabase
  mode: process.env.NEXT_PUBLIC_API_MODE || 'mock',
  
  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
};

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(API_CONFIG.supabase.url && API_CONFIG.supabase.anonKey);
};

// Check if we should use Supabase
export const shouldUseSupabase = () => {
  return API_CONFIG.mode === 'supabase' && isSupabaseConfigured();
};

export const AI_CONFIG = {
  provider: process.env.NEXT_PUBLIC_AI_PROVIDER || 'none', // 'groq' | 'openrouter' | 'none'
  groqApiKey: process.env.GROQ_API_KEY,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.NEXT_PUBLIC_AI_MODEL || 'llama-3.1-8b-instant',
};