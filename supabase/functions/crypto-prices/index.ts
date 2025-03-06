
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
    console.error("Error fetching 24h tickers:", error);
    return [];
  }
}

// WebSocket connection handler function
async function handleWebSocketConnection(socket: WebSocket) {
  console.log("WebSocket client connected");
  
  // Set up interval to send price updates
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  let previousPrices: {[key: string]: number} = {};
  
  // Send initial prices immediately
  try {
    const initialPrices = await Promise.all(
      symbols.map(async symbol => {
        const price = await fetchBinancePrice(symbol);
        return {
          symbol,
          price,
          change: 0 // Initial change is 0
        };
      })
    );
    
    // Store initial prices
    initialPrices.forEach(({symbol, price}) => {
      if (price !== null) {
        previousPrices[symbol] = price;
      }
    });
    
    console.log("Sending initial prices:", initialPrices);
    socket.send(JSON.stringify({
      type: 'prices',
      data: initialPrices
    }));
  } catch (error) {
    console.error("Error sending initial prices:", error);
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch initial prices'
    }));
  }
  
  // Set up interval for price updates (every 5 seconds)
  const interval = setInterval(async () => {
    try {
      if (socket.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        return;
      }
      
      const prices = await Promise.all(
        symbols.map(async symbol => {
          const price = await fetchBinancePrice(symbol);
          const previousPrice = previousPrices[symbol] || price;
          const change = price !== null && previousPrice ? ((price - previousPrice) / previousPrice) * 100 : 0;
          
          // Update previous price
          if (price !== null) {
            previousPrices[symbol] = price;
          }
          
          return {
            symbol,
            price,
            change
          };
        })
      );
      
      console.log("Sending price updates:", prices);
      socket.send(JSON.stringify({
        type: 'prices',
        data: prices
      }));
    } catch (error) {
      console.error("Error sending price updates:", error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to fetch price updates'
      }));
    }
  }, 5000);
  
  // Clean up when the socket closes
  socket.onclose = () => {
    console.log("WebSocket client disconnected");
    clearInterval(interval);
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    clearInterval(interval);
  };
  
  // Handle messages from the client
  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'subscribe') {
        // Client wants to subscribe to specific symbols
        // Implementation for specific symbol subscription if needed
        console.log("Client subscribed to symbols:", message.symbols);
      }
    } catch (error) {
      console.error("Error processing client message:", error);
    }
  };
}

serve(async (req) => {
  // Check for WebSocket upgrade request
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() === "websocket") {
    console.log("WebSocket upgrade request received");
    const { socket, response } = Deno.upgradeWebSocket(req);
    handleWebSocketConnection(socket);
    return response;
  }

  // Handle regular HTTP requests (keep existing REST API functionality)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
});
