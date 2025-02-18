import { format } from 'date-fns-tz';

const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

export const marketCalls = [
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "48,250",
    timeframe: "4H",
    analysis: "Double bottom pattern with volume.",
    confidence: 94,
    roi: 1250,
    timestamp: formatJapanTime(new Date('2024-01-15'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "2,850",
    timeframe: "1D",
    analysis: "Breaking resistance.",
    confidence: 92,
    roi: -275,
    timestamp: formatJapanTime(new Date('2024-01-15'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "SHORT",
    entryPrice: "52,100",
    timeframe: "4H",
    analysis: "RSI divergence.",
    confidence: 88,
    roi: 820,
    timestamp: formatJapanTime(new Date('2024-02-08'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "98.5",
    timeframe: "1D",
    analysis: "Accumulation phase complete, ready for breakout.",
    confidence: 91,
    roi: 1100,
    timestamp: formatJapanTime(new Date('2024-02-07'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "55,300",
    timeframe: "4H",
    analysis: "Bull flag formation on high timeframe.",
    confidence: 89,
    roi: 750,
    timestamp: formatJapanTime(new Date('2024-03-12'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "SHORT",
    entryPrice: "3,150",
    timeframe: "1D",
    analysis: "Head and shoulders pattern forming.",
    confidence: 87,
    roi: -320,
    timestamp: formatJapanTime(new Date('2024-03-20'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "57,800",
    timeframe: "4H",
    analysis: "Golden cross on daily timeframe.",
    confidence: 93,
    roi: 1500,
    timestamp: formatJapanTime(new Date('2024-04-05'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "SHORT",
    entryPrice: "125.5",
    timeframe: "1D",
    analysis: "Bearish divergence on RSI.",
    confidence: 86,
    roi: 650,
    timestamp: formatJapanTime(new Date('2024-04-18'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "59,200",
    timeframe: "4H",
    analysis: "Support level bounce with volume.",
    confidence: 90,
    roi: 880,
    timestamp: formatJapanTime(new Date('2024-05-03'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "3,450",
    timeframe: "1D",
    analysis: "Breaking out of consolidation.",
    confidence: 91,
    roi: -420,
    timestamp: formatJapanTime(new Date('2024-05-22'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "SHORT",
    entryPrice: "62,400",
    timeframe: "4H",
    analysis: "Distribution pattern at resistance.",
    confidence: 88,
    roi: 920,
    timestamp: formatJapanTime(new Date('2024-06-08'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "145.5",
    timeframe: "1D",
    analysis: "Bullish engulfing pattern.",
    confidence: 92,
    roi: 1350,
    timestamp: formatJapanTime(new Date('2024-06-25'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "63,800",
    timeframe: "4H",
    analysis: "Higher low pattern forming.",
    confidence: 89,
    roi: 780,
    timestamp: formatJapanTime(new Date('2024-07-10'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "SHORT",
    entryPrice: "3,850",
    timeframe: "1D",
    analysis: "Double top formation.",
    confidence: 87,
    roi: -280,
    timestamp: formatJapanTime(new Date('2024-07-28'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "65,200",
    timeframe: "4H",
    analysis: "Ascending triangle breakout.",
    confidence: 93,
    roi: 1150,
    timestamp: formatJapanTime(new Date('2024-08-05'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "SHORT",
    entryPrice: "168.5",
    timeframe: "1D",
    analysis: "Overbought RSI conditions.",
    confidence: 85,
    roi: 720,
    timestamp: formatJapanTime(new Date('2024-08-22'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "67,500",
    timeframe: "4H",
    analysis: "Breaking previous ATH.",
    confidence: 94,
    roi: 1680,
    timestamp: formatJapanTime(new Date('2024-09-08'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "LONG",
    entryPrice: "4,150",
    timeframe: "1D",
    analysis: "Cup and handle formation.",
    confidence: 91,
    roi: -350,
    timestamp: formatJapanTime(new Date('2024-09-25'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "SHORT",
    entryPrice: "71,200",
    timeframe: "4H",
    analysis: "Bearish divergence multiple timeframes.",
    confidence: 88,
    roi: 980,
    timestamp: formatJapanTime(new Date('2024-10-12'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "182.5",
    timeframe: "1D",
    analysis: "Breaking resistance with volume.",
    confidence: 90,
    roi: 1250,
    timestamp: formatJapanTime(new Date('2024-10-28'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "69,800",
    timeframe: "4H",
    analysis: "Higher low higher high pattern.",
    confidence: 92,
    roi: 850,
    timestamp: formatJapanTime(new Date('2024-11-05'))
  },
  {
    traderProfile: "Hsaka",
    market: "ETH/USD",
    direction: "SHORT",
    entryPrice: "4,450",
    timeframe: "1D",
    analysis: "Triple top pattern.",
    confidence: 86,
    roi: -420,
    timestamp: formatJapanTime(new Date('2024-11-22'))
  },
  {
    traderProfile: "Hsaka",
    market: "BTC/USD",
    direction: "LONG",
    entryPrice: "72,500",
    timeframe: "4H",
    analysis: "Bull flag breakout.",
    confidence: 93,
    roi: 1450,
    timestamp: formatJapanTime(new Date('2024-12-08'))
  },
  {
    traderProfile: "Hsaka",
    market: "SOL/USD",
    direction: "LONG",
    entryPrice: "195.5",
    timeframe: "1D",
    analysis: "Accumulation complete.",
    confidence: 91,
    roi: 1180,
    timestamp: formatJapanTime(new Date('2024-12-24'))
  }
];
