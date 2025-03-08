
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

async function fetchTopPerformers(days = 7, limit = 10) {
  try {
    console.log(`Fetching top performers for ${days} days`);
    // First get all USDT pairs from 24h data
    const allTickers = await fetch24hTickers();
    
    // Take top 50 by volume to avoid low liquidity pairs
    const topByVolume = allTickers.slice(0, 50);
    
    // For each of these, fetch kline data for the requested period
    const interval = days <= 1 ? '1h' : '1d';
    const klineLimit = days <= 1 ? days * 24 : days;
    
    console.log(`Fetching klines for top ${topByVolume.length} coins using interval ${interval} and limit ${klineLimit}`);
    
    const performanceData = await Promise.all(
      topByVolume.map(async (ticker) => {
        try {
          const klines = await fetchBinanceKlines(ticker.symbol, interval, klineLimit);
          
          if (klines.length < 2) {
            return {
              symbol: ticker.symbol,
              performance: 0,
              priceData: [],
              currentPrice: parseFloat(ticker.lastPrice)
            };
          }
          
          // Calculate performance (percentage change from first to last close price)
          const firstPrice = klines[0].open;
          const lastPrice = klines[klines.length - 1].close;
          
          // Calculate the performance based on available data
          // If the market was newly listed during the timeframe, performance should be calculated from its first available price
          const daysSinceFirstKline = (klines[klines.length - 1].timestamp - klines[0].timestamp) / (1000 * 60 * 60 * 24);
          
          // Get a more accurate performance by scaling to the requested timeframe
          // Only if the data doesn't cover the full requested timeframe
          const performance = ((lastPrice - firstPrice) / firstPrice) * 100;
          
          // Add a flag to indicate if this might be a new listing (if we have less than 80% of expected data points)
          const isNewListing = daysSinceFirstKline < (days * 0.8);
          
          return {
            symbol: ticker.symbol,
            performance,
            priceData: klines.map(k => ({
              timestamp: k.timestamp,
              price: k.close
            })),
            currentPrice: lastPrice,
            isNewListing,
            dataPoints: klines.length,
            expectedDataPoints: klineLimit,
            daysCovered: daysSinceFirstKline.toFixed(1)
          };
        } catch (error) {
          console.error(`Error processing ${ticker.symbol}:`, error);
          return {
            symbol: ticker.symbol,
            performance: 0,
            priceData: [],
            currentPrice: parseFloat(ticker.lastPrice)
          };
        }
      })
    );
    
    // Sort by performance (descending) and take top 'limit'
    return performanceData
      .filter(data => data.priceData.length > 0)
      .sort((a, b) => b.performance - a.performance)
      .slice(0, limit);
    
  } catch (error) {
    console.error('Error fetching top performers:', error);
    return [];
  }
}

// Map to store WebSocket connections
const websocketClients = new Map();

function setupHeartbeat(socket: WebSocket) {
  const interval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      // Send ping message
      socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    } else {
      clearInterval(interval);
    }
  }, 30000); // Send ping every 30 seconds

  return interval;
}

// Main service function
serve(async (req) => {
  console.log(`Received request: ${req.method} ${new URL(req.url).pathname}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  // Check if WebSocket upgrade is requested
  const upgradeHeader = req.headers.get('upgrade') || '';
  
  if (upgradeHeader.toLowerCase() === 'websocket') {
    // Handle WebSocket connection
    console.log('WebSocket connection request received');
    
    try {
      const { socket, response } = Deno.upgradeWebSocket(req);
      console.log('WebSocket upgrade successful');
      
      // Create a unique ID for this client
      const clientId = crypto.randomUUID();
      
      // Set up event handlers for WebSocket
      socket.onopen = () => {
        console.log(`WebSocket connection established (${clientId})`);
        
        // Store the client connection
        websocketClients.set(clientId, {
          socket,
          subscribedSymbols: [],
          heartbeatInterval: setupHeartbeat(socket),
          lastActivity: Date.now()
        });
        
        // Immediately send initial data to client
        Promise.all([
          fetchBinancePrice('BTCUSDT'),
          fetchBinancePrice('ETHUSDT'),
          fetchBinancePrice('BNBUSDT'),
          fetch24hTickers()
        ]).then(([btcPrice, ethPrice, bnbPrice, tickers]) => {
          if (socket.readyState === WebSocket.OPEN) {
            // Send initial cryptocurrency prices
            socket.send(JSON.stringify({
              type: 'prices',
              data: {
                BTCUSDT: btcPrice,
                ETHUSDT: ethPrice,
                BNBUSDT: bnbPrice,
              },
              changes: {
                BTCUSDT: tickers.find((t: any) => t.symbol === 'BTCUSDT')?.priceChangePercent || '0',
                ETHUSDT: tickers.find((t: any) => t.symbol === 'ETHUSDT')?.priceChangePercent || '0',
                BNBUSDT: tickers.find((t: any) => t.symbol === 'BNBUSDT')?.priceChangePercent || '0',
              }
            }));
            
            // Also send full ticker list
            socket.send(JSON.stringify({
              type: 'initial',
              data: tickers
            }));
          }
        }).catch(error => {
          console.error('Error sending initial data:', error);
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Failed to fetch initial data'
            }));
          }
        });
      };
      
      // Handle messages from client
      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`Received message from client ${clientId}:`, message.type);
          
          // Update client's last activity time
          if (websocketClients.has(clientId)) {
            websocketClients.get(clientId).lastActivity = Date.now();
          }
          
          // Handle pong response from client
          if (message.type === 'pong') {
            console.log(`Received pong from client ${clientId}`);
            return;
          }
          
          // Handle ping from client
          if (message.type === 'ping') {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'pong',
                timestamp: Date.now()
              }));
            }
            return;
          }
          
          // Handle symbol subscription
          if (message.type === 'subscribe' && Array.isArray(message.symbols)) {
            if (websocketClients.has(clientId)) {
              websocketClients.get(clientId).subscribedSymbols = message.symbols;
              console.log(`Client ${clientId} subscribed to:`, message.symbols);
              
              // Fetch and send initial data for these symbols
              const prices = await Promise.all(
                message.symbols.map(async (symbol: string) => ({
                  symbol,
                  price: await fetchBinancePrice(symbol)
                }))
              );
              
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                  type: 'prices',
                  data: prices.reduce((acc, { symbol, price }) => ({
                    ...acc,
                    [symbol]: price
                  }), {})
                }));
              }
            }
            return;
          }
          
          // Handle request for all tickers
          if (message.type === 'allTickers') {
            const tickers = await fetch24hTickers();
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'initial',
                data: tickers
              }));
            }
            return;
          }
          
          // Handle kline requests
          if (message.type === 'kline' && message.symbol) {
            try {
              const klines = await fetchBinanceKlines(
                message.symbol, 
                message.interval || '15m'
              );
              
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                  type: 'klineData',
                  symbol: message.symbol,
                  data: klines
                }));
              }
            } catch (error) {
              console.error('Error fetching klines:', error);
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                  type: 'error',
                  message: `Failed to fetch klines for ${message.symbol}`
                }));
              }
            }
            return;
          }
        } catch (error) {
          console.error(`Error handling client ${clientId} message:`, error);
        }
      };
      
      // Clean up when client disconnects
      socket.onclose = (event) => {
        console.log(`Client ${clientId} WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
        
        // Clean up client resources
        if (websocketClients.has(clientId)) {
          const client = websocketClients.get(clientId);
          if (client.heartbeatInterval) {
            clearInterval(client.heartbeatInterval);
          }
          websocketClients.delete(clientId);
        }
      };
      
      socket.onerror = (error) => {
        console.error(`Client ${clientId} WebSocket error:`, error);
      };
      
      return response;
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      return new Response(JSON.stringify({ error: 'WebSocket upgrade failed', details: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  // Handle regular HTTP requests 
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
    let getTopPerformers = url.searchParams.get('getTopPerformers') === 'true';
    let days = parseInt(url.searchParams.get('days') || '7', 10);
    let limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
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
        getTopPerformers = (body.getTopPerformers === 'true' || body.getTopPerformers === true) || getTopPerformers;
        days = body.days || days;
        limit = body.limit || limit;
      } catch (e) {
        console.error("Error parsing JSON body:", e);
      }
    }
    
    if (getTopPerformers) {
      // Fetch top performing tokens
      console.log(`Fetching top ${limit} performers for ${days} days`);
      const topPerformers = await fetchTopPerformers(days, limit);
      return new Response(JSON.stringify(topPerformers), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else if (get24hTickers) {
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
    console.error('HTTP request error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
})
