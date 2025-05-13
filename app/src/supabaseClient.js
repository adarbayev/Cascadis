import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your actual Supabase URL and Anon Key
// Consider using environment variables for security:
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabaseUrl = 'YOUR_SUPABASE_URL'; 
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL' || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error("Supabase URL or Anon Key is missing or using placeholder values. Please check your configuration in app/src/supabaseClient.js or environment variables.");
  // Optionally throw an error or handle this case appropriately, 
  // maybe return a dummy client or null to prevent further errors.
}

// Initialize client only if URL and key are likely valid
let supabaseInstance = null;
try {
  if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } else {
     // Handle the case where placeholders are still present - maybe log a more specific warning
     console.warn("Supabase client not initialized due to missing/placeholder credentials.");
  }
} catch (error) {
    console.error("Error initializing Supabase client:", error);
}

export const supabase = supabaseInstance; // Export the instance (which might be null if config is missing) 