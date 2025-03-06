
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

async function handleWebSocketConnection(socket: WebSocket) {
  console.log("WebSocket client connected");
  
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

  // Handle regular HTTP requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
