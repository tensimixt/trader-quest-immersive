
import { createClient } from '@supabase/supabase-js';

// Provide fallback values if environment variables are not available
// These values will ensure the application works without env setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zzbftruhrjfmynhamypk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6YmZ0cnVocmpmbXluaGFteXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MzI2OTMsImV4cCI6MjA1MzUwODY5M30.v-Oz5lCbpoB9aQvq43WSaZ8DKy1wthSPQYeD8KzixKo';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Constructs a WebSocket URL for connecting to a Supabase Edge Function
 * @param functionName The name of the Edge Function
 * @returns WebSocket URL string
 */
export const getEdgeFunctionWebSocketUrl = (functionName: string): string => {
  // Extract the project ID from the Supabase URL
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
  
  // Construct WebSocket URL
  return `wss://${projectId}.supabase.co/functions/v1/${functionName}`;
};
