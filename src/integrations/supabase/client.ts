import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * Constructs a WebSocket URL for connecting to a Supabase Edge Function
 * @param functionName The name of the Edge Function
 * @returns WebSocket URL string
 */
export const getEdgeFunctionWebSocketUrl = (functionName: string): string => {
  // Extract the project ID from the Supabase URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
  
  // Construct WebSocket URL
  return `wss://${projectId}.supabase.co/functions/v1/${functionName}`;
};

/**
 * Creates a WebSocket with heartbeat mechanism to keep connection alive
 * @param url The WebSocket URL to connect to
 * @param options Additional WebSocket options
 * @returns A configured WebSocket instance with heartbeat functionality
 */
export const createHeartbeatWebSocket = (url: string): WebSocket => {
  const ws = new WebSocket(url);
  let pingInterval: number | null = null;
  let reconnectTimeout: number | null = null;
  
  // Set up ping mechanism when connection opens
  ws.addEventListener('open', () => {
    console.log(`WebSocket connected to ${url}`);
    
    // Clear any existing interval
    if (pingInterval) {
      window.clearInterval(pingInterval);
    }
    
    // Send ping every 30 seconds to keep connection alive
    pingInterval = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send a ping message
        try {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          console.log('Ping sent to keep connection alive');
        } catch (error) {
          console.error('Error sending ping:', error);
        }
      }
    }, 30000) as unknown as number;
  });
  
  // Clean up on close
  ws.addEventListener('close', (event) => {
    console.log(`WebSocket closed with code ${event.code}, reason: ${event.reason}`);
    
    // Clear intervals
    if (pingInterval) {
      window.clearInterval(pingInterval);
      pingInterval = null;
    }
    
    // Set up reconnect if it wasn't a clean close
    if (event.code !== 1000) {
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout);
      }
      
      console.log('Scheduling reconnect...');
      reconnectTimeout = window.setTimeout(() => {
        console.log('Attempting to reconnect...');
        // We don't actually reconnect here, as that should be handled by the component
      }, 5000) as unknown as number;
    }
  });
  
  // Handle errors
  ws.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  return ws;
};
