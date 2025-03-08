
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, URL: ${url}`);
    }
    
    const data = await response.json();
    
    // Return with proper mapping
    return data.map((kline: any) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  } catch (error) {
    console.error(`Error fetching ${symbol} klines with interval ${interval}:`, error);
    
    // Special handling for 1s interval since it might not be supported for all pairs
    if (interval === "1s") {
      console.log(`Falling back to 1m interval for ${symbol}`);
      try {
        const fallbackUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${limit}`;
        console.log(`Trying fallback URL: ${fallbackUrl}`);
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error in fallback! status: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        
        return fallbackData.map((kline: any) => ({
          timestamp: kline[0],
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5]),
        }));
      } catch (fallbackError) {
        console.error(`Fallback to 1m also failed for ${symbol}:`, fallbackError);
        return [];
      }
    }
    
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
    
    const filteredData = data
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
    
    console.log(`Fetched ${filteredData.length} USDT pairs from Binance`);
    
    return filteredData.map((ticker: any) => ({
      symbol: ticker.symbol,
      priceChange: ticker.priceChange,
      priceChangePercent: ticker.priceChangePercent,
      lastPrice: ticker.lastPrice,
      volume: ticker.volume,
      quoteVolume: ticker.quoteVolume,
    }));
  } catch (error) {
    console.error('Error fetching 24h tickers:', error);
    return [];
  }
}

async function fetchTopPerformers(days = 7, limit = 10, useOHLC = false) {
  try {
    console.log(`Fetching top performers for ${days} days (useOHLC: ${useOHLC})`);
    const allTickers = await fetch24hTickers();
    
    const topByVolume = allTickers.slice(0, 50);
    
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
          
          const firstPrice = klines[0].open;
          const lastPrice = klines[klines.length - 1].close;
          
          const daysSinceFirstKline = (klines[klines.length - 1].timestamp - klines[0].timestamp) / (1000 * 60 * 60 * 24);
          
          const isNewListing = daysSinceFirstKline < (days * 0.8);
          
          const performance = ((lastPrice - firstPrice) / firstPrice) * 100;
          
          const priceData = klines.map(k => ({
            timestamp: k.timestamp,
            price: k.close
          }));

          const result = {
            symbol: ticker.symbol,
            performance,
            priceData,
            currentPrice: lastPrice,
            isNewListing,
            dataPoints: klines.length,
            expectedDataPoints: klineLimit,
            daysCovered: daysSinceFirstKline.toFixed(1)
          };
          
          if (useOHLC) {
            result.klineData = klines;
          }
          
          return result;
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
    
    return performanceData
      .filter(data => data.priceData.length > 0)
      .sort((a, b) => b.performance - a.performance)
      .slice(0, limit);
    
  } catch (error) {
    console.error('Error fetching top performers:', error);
    return [];
  }
}

const websocketClients = new Map();

function setupHeartbeat(socket: WebSocket) {
  const interval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    } else {
      clearInterval(interval);
    }
  }, 30000);

  return interval;
}

serve(async (req) => {
  console.log(`Received request: ${req.method} ${new URL(req.url).pathname}`);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  const upgradeHeader = req.headers.get('upgrade') || '';
  
  if (upgradeHeader.toLowerCase() === 'websocket') {
    console.log('WebSocket connection request received');
    
    try {
      const { socket, response } = Deno.upgradeWebSocket(req);
      console.log('WebSocket upgrade successful');
      
      const clientId = crypto.randomUUID();
      
      socket.onopen = () => {
        console.log(`WebSocket connection established (${clientId})`);
        
        websocketClients.set(clientId, {
          socket,
          subscribedSymbols: [],
          heartbeatInterval: setupHeartbeat(socket),
          lastActivity: Date.now()
        });
        
        Promise.all([
          fetchBinancePrice('BTCUSDT'),
          fetchBinancePrice('ETHUSDT'),
          fetchBinancePrice('BNBUSDT'),
          fetch24hTickers()
        ]).then(([btcPrice, ethPrice, bnbPrice, tickers]) => {
          if (socket.readyState === WebSocket.OPEN) {
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
      
      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`Received message from client ${clientId}:`, message.type);
          
          if (websocketClients.has(clientId)) {
            websocketClients.get(clientId).lastActivity = Date.now();
          }
          
          if (message.type === 'pong') {
            console.log(`Received pong from client ${clientId}`);
            return;
          }
          
          if (message.type === 'ping') {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'pong',
                timestamp: Date.now()
              }));
            }
            return;
          }
          
          if (message.type === 'subscribe' && Array.isArray(message.symbols)) {
            if (websocketClients.has(clientId)) {
              websocketClients.get(clientId).subscribedSymbols = message.symbols;
              console.log(`Client ${clientId} subscribed to:`, message.symbols);
              
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
                  interval: message.interval || '15m',
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
      
      socket.onclose = (event) => {
        console.log(`Client ${clientId} WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
        
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

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    let symbol = url.searchParams.get('symbol');
    let getHistory = url.searchParams.get('history') === 'true';
    let interval = url.searchParams.get('interval') || '15m';
    let get24hTickers = url.searchParams.get('get24hTickers') === 'true';
    let getTopPerformers = url.searchParams.get('getTopPerformers') === 'true';
    let getTickerHistory = url.searchParams.get('getTickerHistory') === 'true';
    let days = parseInt(url.searchParams.get('days') || '7', 10);
    let limit = parseInt(url.searchParams.get('limit') || '10', 10);
    let useOHLC = url.searchParams.get('useOHLC') === 'true';
    
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        symbol = body.symbol || symbol;
        getHistory = (body.history === 'true' || body.history === true) || getHistory;
        interval = body.interval || interval;
        get24hTickers = (body.get24hTickers === 'true' || body.get24hTickers === true) || get24hTickers;
        getTopPerformers = (body.getTopPerformers === 'true' || body.getTopPerformers === true) || getTopPerformers;
        getTickerHistory = (body.getTickerHistory === 'true' || body.getTickerHistory === true) || getTickerHistory;
        days = body.days || days;
        limit = body.limit || limit;
        useOHLC = (body.useOHLC === 'true' || body.useOHLC === true) || useOHLC;
      } catch (e) {
        console.error("Error parsing JSON body:", e);
      }
    }
    
    if (getTickerHistory && symbol) {
      console.log(`Fetching history for ticker: ${symbol}, interval: ${interval}, days: ${days}`);
      const klineInterval = days <= 1 ? '1h' : '1d';
      const klineLimit = days <= 1 ? days * 24 : days;
      
      const klineData = await fetchBinanceKlines(symbol, klineInterval, klineLimit);
      
      return new Response(JSON.stringify({ symbol, klineData }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else if (getTopPerformers) {
      console.log(`Fetching top ${limit} performers for ${days} days (useOHLC: ${useOHLC})`);
      const topPerformers = await fetchTopPerformers(days, limit, useOHLC);
      return new Response(JSON.stringify(topPerformers), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else if (get24hTickers) {
      const tickers = await fetch24hTickers();
      return new Response(JSON.stringify(tickers), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else if (symbol) {
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
