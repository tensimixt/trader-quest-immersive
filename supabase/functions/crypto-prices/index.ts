
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Handle both URL parameters and body parameters
    const url = new URL(req.url);
    let symbol = url.searchParams.get('symbol');
    let getHistory = url.searchParams.get('history') === 'true';
    let interval = url.searchParams.get('interval') || '15m';
    
    // If there's a request body, check for parameters there as well
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        // Body parameters take precedence over URL parameters
        symbol = body.symbol || symbol;
        getHistory = (body.history === 'true' || body.history === true) || getHistory;
        interval = body.interval || interval;
      } catch (e) {
        console.error("Error parsing JSON body:", e);
      }
    }
    
    if (symbol) {
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
