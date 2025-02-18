import { format } from 'date-fns-tz';

export const formatJapanTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Tokyo' });
};

export const marketIntelligence = [
  "Blackrock acquires 12,000 BTC in latest strategic move",
  "Ethereum Foundation announces major protocol upgrade",
  "MicroStrategy increases Bitcoin holdings by 8,000 BTC",
  "JP Morgan updates crypto trading desk infrastructure",
  "Major DeFi protocol reports record-breaking TVL"
];

export const demoRankChanges = [
  2, -1, 3, 0, -2, 1, 4, -3, 0, 2,
  -4, 1, -2, 3, 0, 2, -1, 5, -2, 1,
  0, 3, -2, 1, -3
];

export const demoROI = [
  8.42, -3.21, 12.54, 5.67, -2.18, 15.32, 7.89, -4.56, 9.23, 3.45,
  -1.98, 6.78, 11.23, -5.43, 4.56, 8.90, -2.34, 13.45, 6.78, -3.21
];

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

export const leaderboardData = [
  {
    trader: "Hsaka",
    score: 158420,
    status: {
      action: "BUY" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T12:00:00')
    }
  },
  {
    trader: "CryptoKage",
    score: 142850,
    status: {
      action: "SELL" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T11:30:00')
    }
  },
  {
    trader: "DefiWhale",
    score: 136700,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T10:45:00')
    }
  },
  {
    trader: "AlphaHunter",
    score: 128900,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T09:15:00')
    }
  },
  {
    trader: "SatsStack",
    score: 115600,
    status: {
      action: "BUY" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T08:30:00')
    }
  },
  {
    trader: "CryptoNinja",
    score: 98750,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T08:15:00')
    }
  },
  {
    trader: "BlockWizard",
    score: 92340,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T08:00:00')
    }
  },
  {
    trader: "TradeQueen",
    score: 88900,
    status: {
      action: "BUY" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T07:45:00')
    }
  },
  {
    trader: "CoinMaster",
    score: 84500,
    status: {
      action: "SELL" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T07:30:00')
    }
  },
  {
    trader: "BitLord",
    score: 79200,
    status: {
      action: "BUY" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T07:15:00')
    }
  },
  {
    trader: "CryptoSamurai",
    score: 75800,
    status: {
      action: "SELL" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T07:00:00')
    }
  },
  {
    trader: "ChainMaster",
    score: 71400,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T06:45:00')
    }
  },
  {
    trader: "TradingPro",
    score: 68900,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T06:30:00')
    }
  },
  {
    trader: "WhaleMaster",
    score: 65300,
    status: {
      action: "BUY" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T06:15:00')
    }
  },
  {
    trader: "CryptoKing",
    score: 61800,
    status: {
      action: "SELL" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T06:00:00')
    }
  },
  {
    trader: "TokenMage",
    score: 58200,
    status: {
      action: "BUY" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T05:45:00')
    }
  },
  {
    trader: "ChartWizard",
    score: 54700,
    status: {
      action: "SELL" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T05:30:00')
    }
  },
  {
    trader: "CryptoShark",
    score: 51200,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T05:15:00')
    }
  },
  {
    trader: "BlockSmith",
    score: 48600,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T05:00:00')
    }
  },
  {
    trader: "CoinSage",
    score: 45100,
    status: {
      action: "BUY" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T04:45:00')
    }
  },
  {
    trader: "TradeOracle",
    score: 42500,
    status: {
      action: "SELL" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T04:30:00')
    }
  },
  {
    trader: "BitWizard",
    score: 39800,
    status: {
      action: "BUY" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T04:15:00')
    }
  },
  {
    trader: "CryptoMystic",
    score: 37200,
    status: {
      action: "SELL" as const,
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T04:00:00')
    }
  },
  {
    trader: "ChainSage",
    score: 34600,
    status: {
      action: "BUY" as const,
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T03:45:00')
    }
  },
  {
    trader: "TokenKnight",
    score: 32000,
    status: {
      action: "SELL" as const,
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T03:30:00')
    }
  }
];
