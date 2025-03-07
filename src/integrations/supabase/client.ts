
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
 * Helper function to set up ping/pong handling for Binance WebSockets
 * @param ws WebSocket instance to handle
 * @returns Cleanup function
 */
export const setupBinancePingPong = (ws: WebSocket): () => void => {
  let pingInterval: number | null = null;
  let pongTimeout: number | null = null;
  
  // Send unsolicited pong frames every 15 seconds
  pingInterval = window.setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // Empty pong frame as recommended
      ws.send(JSON.stringify({ pong: {} }));
    }
  }, 15000);
  
  // Setup listener for ping messages
  const pingHandler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      // If we receive a ping, immediately respond with pong
      if (data.ping) {
        ws.send(JSON.stringify({ pong: data.ping }));
        
        // Reset pong timeout whenever we receive a ping
        if (pongTimeout) clearTimeout(pongTimeout);
        
        // If no ping is received within 50 seconds, close connection
        pongTimeout = window.setTimeout(() => {
          console.log("No ping received for 50 seconds, closing connection");
          ws.close();
        }, 50000);
      }
    } catch (e) {
      // Not all messages are JSON or have ping/pong structure
    }
  };
  
  ws.addEventListener('message', pingHandler);
  
  // Cleanup function
  return () => {
    if (pingInterval) clearInterval(pingInterval);
    if (pongTimeout) clearTimeout(pongTimeout);
    ws.removeEventListener('message', pingHandler);
  };
};

// Binance WebSocket constants
export const BINANCE_WS_API = "wss://ws-api.binance.com:443/ws-api/v3";
export const BINANCE_STREAM_WS = "wss://stream.binance.com:9443/ws";
