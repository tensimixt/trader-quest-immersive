
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

/**
 * Makes a request to test if WebSockets are working for a specific edge function
 * @param functionName The name of the Edge Function
 * @returns Promise<boolean> indicating if WebSockets are available
 */
export const testEdgeFunctionWebSocket = async (functionName: string): Promise<boolean> => {
  try {
    // First try a simple HTTP request to the function to check if it's deployed
    const { data, error } = await supabase.functions.invoke(functionName);
    
    if (error) {
      console.error(`Edge function ${functionName} HTTP test failed:`, error);
      return false;
    }
    
    // If HTTP works, we'll try a WebSocket connection with timeout
    return new Promise((resolve) => {
      const wsUrl = getEdgeFunctionWebSocketUrl(functionName);
      const ws = new WebSocket(wsUrl);
      
      // Set a timeout in case the connection hangs
      const timeout = setTimeout(() => {
        console.log(`WebSocket connection to ${functionName} timed out`);
        ws.close();
        resolve(false);
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log(`WebSocket connection to ${functionName} successful`);
        ws.close();
        resolve(true);
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        console.log(`WebSocket connection to ${functionName} failed`);
        resolve(false);
      };
    });
  } catch (error) {
    console.error(`Error testing WebSocket for ${functionName}:`, error);
    return false;
  }
};
