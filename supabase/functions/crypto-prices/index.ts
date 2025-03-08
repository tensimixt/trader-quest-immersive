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
      
      // Set up event handlers for WebSocket
      socket.onopen = () => {
        console.log('WebSocket connection established');
        
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
        });
        
        // Setup heartbeat for connection keepalive
        const heartbeatInterval = setupHeartbeat(socket);
        
        // Instead of trying to connect to Binance WebSocket, we'll use fetch polling
        const topSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
        
        // Setup interval to fetch prices every few seconds
        const priceUpdateInterval = setInterval(async () => {
          if (socket.readyState !== WebSocket.OPEN) {
            clearInterval(priceUpdateInterval);
            return;
          }
          
          try {
            // Fetch current prices
            const prices = await Promise.all(
              topSymbols.map(async symbol => {
                const price = await fetchBinancePrice(symbol);
                return { symbol, price };
              })
            );
            
            // Send updates to client
            prices.forEach(({ symbol, price }) => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                  type: 'price',
                  symbol: symbol,
                  price: price,
                  change: '0' // We don't have change data in this simplified version
                }));
              }
            });
          } catch (error) {
            console.error('Error fetching price updates:', error);
          }
        }, 5000); // Every 5 seconds
        
        // Periodically refresh the full ticker list
        const tickerRefreshInterval = setInterval(async () => {
          if (socket.readyState !== WebSocket.OPEN) {
            clearInterval(tickerRefreshInterval);
            return;
          }
          
          try {
            console.log('Refreshing full ticker list');
            const tickers = await fetch24hTickers();
            
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'refresh',
                data: tickers
              }));
              
              // Update price changes for main coins
              const changes = {
                BTCUSDT: tickers.find((t: any) => t.symbol === 'BTCUSDT')?.priceChangePercent || '0',
                ETHUSDT: tickers.find((t: any) => t.symbol === 'ETHUSDT')?.priceChangePercent || '0',
                BNBUSDT: tickers.find((t: any) => t.symbol === 'BNBUSDT')?.priceChangePercent || '0',
              };
              
              socket.send(JSON.stringify({
                type: 'prices',
                changes: changes
              }));
            }
          } catch (error) {
            console.error('Error refreshing ticker list:', error);
          }
        }, 60000); // Every minute
        
        // Clean up intervals when client disconnects
        socket.onclose = (event) => {
          console.log(`Client WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
          clearInterval(heartbeatInterval);
          clearInterval(priceUpdateInterval);
          clearInterval(tickerRefreshInterval);
        };
        
        // Handle pong from client
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'pong') {
              console.log('Received pong from client');
            }
            
            // Handle kline requests
            if (message.type === 'kline' && message.symbol) {
              fetchBinanceKlines(message.symbol, message.interval || '15m')
                .then(klines => {
                  if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                      type: 'klineData',
                      symbol: message.symbol,
                      data: klines
                    }));
                  }
                }).catch(error => {
                  console.error('Error fetching klines:', error);
                });
            }
          } catch (error) {
            console.error('Error handling client message:', error);
          }
        };
        
        socket.onerror = (error) => {
          console.error('Client WebSocket error:', error);
        };
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
