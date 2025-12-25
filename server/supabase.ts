import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.error('WARNING: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'set' : 'missing');
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
