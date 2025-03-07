import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Binance WebSocket base endpoint
const BINANCE_WS_API = "wss://ws-api.binance.com:443/ws-api/v3";
const BINANCE_STREAM_WS = "wss://stream.binance.com:9443/ws";

async function fetchBinancePrice(symbol: string) {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching ${symbol} price:`, error);
    return null;
  }
}

async function fetchBinanceKlines(symbol: string, interval = "15m", limit = 30) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    console.log(`Fetching klines from: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    
    // Format klines data
    // Klines format: [openTime, open, high, low, close, volume, closeTime, ...]
    return data.map((kline: any) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  } catch (error) {
    console.error(`Error fetching ${symbol} klines:`, error);
    return [];
  }
}

async function fetch24hTickers() {
  try {
    console.log('Fetching 24h tickers from Binance API');
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Only include USDT pairs for simplicity and sort by volume
    const filteredData = data
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
    
    console.log(`Fetched ${filteredData.length} USDT pairs from Binance`);
    
    // Return all USDT pairs with enhanced volume data
    return filteredData.map((ticker: any) => ({
      symbol: ticker.symbol,
      priceChange: ticker.priceChange,
      priceChangePercent: ticker.priceChangePercent,
      lastPrice: ticker.lastPrice,
      volume: ticker.volume,
      quoteVolume: ticker.quoteVolume, // This is the USD equivalent volume
    }));
  } catch (error) {
    console.error('Error fetching 24h tickers:', error);
    return [];
  }
}

// Function to handle ping/pong for Binance WebSocket
function setupPingPong(ws: WebSocket) {
  let pingInterval: number | null = null;
  let pongTimeout: number | null = null;
  
  // Send unsolicited pong frames every 15 seconds to keep connection alive
  pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ pong: {} }));
    }
  }, 15000);
  
  // Setup listener for ping messages
  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      // If we receive a ping from server, immediately respond with pong
      if (data.ping) {
        ws.send(JSON.stringify({ pong: data.ping }));
        
        // Reset pong timeout whenever we receive a ping
        if (pongTimeout) clearTimeout(pongTimeout);
        
        // If no pong is received within 50 seconds, close and reconnect
        pongTimeout = setTimeout(() => {
          console.log("No ping received for 50 seconds, closing connection");
          ws.close();
        }, 50000);
      }
    } catch (e) {
      // Not all messages are JSON or have ping/pong structure
    }
  });
  
  // Cleanup function to clear intervals and timeouts
  return () => {
    if (pingInterval) clearInterval(pingInterval);
    if (pongTimeout) clearTimeout(pongTimeout);
  };
}

serve(async (req) => {
  // Check if WebSocket upgrade is requested
  const upgradeHeader = req.headers.get('upgrade') || '';
  
  if (upgradeHeader.toLowerCase() === 'websocket') {
    // Handle WebSocket connection
    console.log('WebSocket connection request received');
    
    try {
      const { socket, response } = Deno.upgradeWebSocket(req);
      
      // Set up event handlers for WebSocket
      socket.onopen = () => {
        console.log('WebSocket connection established');
        
        // Immediately send initial data to client
        fetch24hTickers().then(tickers => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'initial',
              data: tickers
            }));
          }
        });
        
        // Set up connection to Binance WebSocket for combined streams
        const topSymbols = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt'];
        const streams = topSymbols.map(symbol => `${symbol}@ticker`);
        const binanceWs = new WebSocket(`${BINANCE_STREAM_WS}/${streams.join('/')}`);
        
        // Set up ping/pong handler for Binance WebSocket
        const cleanupPingPong = setupPingPong(binanceWs);
        
        binanceWs.onmessage = (event) => {
          try {
            const tickerData = JSON.parse(event.data);
            
            // Format ticker data to match our API format
            const ticker = {
              symbol: tickerData.s,
              lastPrice: tickerData.c,
              priceChange: tickerData.p,
              priceChangePercent: tickerData.P,
              volume: tickerData.v,
              quoteVolume: tickerData.q
            };
            
            // Send update to client if socket is still open
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'update',
                data: ticker
              }));
            }
          } catch (e) {
            console.error('Error processing Binance WebSocket message:', e);
          }
        };
        
        binanceWs.onerror = (error) => {
          console.error('Binance WebSocket error:', error);
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Binance connection error'
            }));
          }
        };
        
        // Periodically refresh the full ticker list
        const intervalId = setInterval(() => {
          console.log('Refreshing full ticker list');
          fetch24hTickers().then(tickers => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'refresh',
                data: tickers
              }));
            }
          });
        }, 60000); // Every minute
        
        // Clean up WebSocket connections when client disconnects
        socket.onclose = () => {
          console.log('Client WebSocket closed');
          cleanupPingPong();
          binanceWs.close();
          clearInterval(intervalId);
        };
        
        socket.onerror = (error) => {
          console.error('Client WebSocket error:', error);
          cleanupPingPong();
          binanceWs.close();
          clearInterval(intervalId);
        };
      };
      
      return response;
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      return new Response(JSON.stringify({ error: 'WebSocket upgrade failed' }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  // Handle regular HTTP requests as before
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Handle both URL parameters and body parameters
    const url = new URL(req.url);
    let symbol = url.searchParams.get('symbol');
    let getHistory = url.searchParams.get('history') === 'true';
    let interval = url.searchParams.get('interval') || '15m';
    let get24hTickers = url.searchParams.get('get24hTickers') === 'true';
    
    // If there's a request body, check for parameters there as well
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        // Body parameters take precedence over URL parameters
        symbol = body.symbol || symbol;
        getHistory = (body.history === 'true' || body.history === true) || getHistory;
        interval = body.interval || interval;
        get24hTickers = (body.get24hTickers === 'true' || body.get24hTickers === true) || get24hTickers;
      } catch (e) {
        console.error("Error parsing JSON body:", e);
      }
    }
    
    if (get24hTickers) {
      // Fetch 24-hour tickers for multiple symbols
      const tickers = await fetch24hTickers();
      return new Response(JSON.stringify(tickers), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else if (symbol) {
      // Single symbol request with optional history
      const price = await fetchBinancePrice(symbol);
      
      let history = [];
      if (getHistory) {
        history = await fetchBinanceKlines(symbol, interval);
      }
      
      return new Response(JSON.stringify({ symbol, price, history }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else {
      // Multiple symbols request (default behavior)
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
      const prices = await Promise.all(
        symbols.map(async symbol => ({
          symbol,
          price: await fetchBinancePrice(symbol)
        }))
      );

      return new Response(JSON.stringify(prices), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
})
