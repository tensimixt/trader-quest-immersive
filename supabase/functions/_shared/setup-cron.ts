
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';

/**
 * Setup a cron job to run the scheduled-tweet-fetch edge function every minute
 */
export async function setupCronJob() {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create the pg_cron and pg_net extensions if they don't exist
    await supabase.rpc('create_pg_extensions');
    
    // Call our new database function to setup the cron job
    const { data, error } = await supabase.rpc('setup_tweet_fetch_cron');
    
    if (error) {
      throw new Error(`Failed to setup cron job: ${error.message}`);
    }
    
    console.log('Cron job setup result:', data);
    return { success: true, message: 'Cron job setup successfully', details: data };
  } catch (error) {
    console.error('Error setting up cron job:', error);
    return { success: false, error: error.message };
  }
}
