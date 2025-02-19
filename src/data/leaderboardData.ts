export type TraderStatus = {
  action: "BUY" | "SELL";
  pair: string;
  timestamp: Date;
};

export type TraderData = {
  trader: string;
  score: number;
  status: TraderStatus;
};

export const leaderboardData: TraderData[] = [
  {
    trader: "Hsaka",
    score: 158420,
    status: {
      action: "BUY",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T12:00:00')
    }
  },
  {
    trader: "CryptoKage",
    score: 142850,
    status: {
      action: "SELL",
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T11:30:00')
    }
  },
  {
    trader: "DefiWhale",
    score: 136700,
    status: {
      action: "BUY",
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T10:45:00')
    }
  },
  {
    trader: "AlphaHunter",
    score: 128900,
    status: {
      action: "SELL",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T09:15:00')
    }
  },
  {
    trader: "SatsStack",
    score: 115600,
    status: {
      action: "BUY",
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T08:30:00')
    }
  },
  {
    trader: "CryptoNinja",
    score: 98750,
    status: {
      action: "BUY",
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T08:15:00')
    }
  },
  {
    trader: "BlockWizard",
    score: 92340,
    status: {
      action: "SELL",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T08:00:00')
    }
  },
  {
    trader: "TradeQueen",
    score: 88900,
    status: {
      action: "BUY",
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T07:45:00')
    }
  },
  {
    trader: "CoinMaster",
    score: 84500,
    status: {
      action: "SELL",
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T07:30:00')
    }
  },
  {
    trader: "BitLord",
    score: 79200,
    status: {
      action: "BUY",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T07:15:00')
    }
  },
  {
    trader: "CryptoSamurai",
    score: 75800,
    status: {
      action: "SELL",
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T07:00:00')
    }
  },
  {
    trader: "ChainMaster",
    score: 71400,
    status: {
      action: "BUY",
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T06:45:00')
    }
  },
  {
    trader: "TradingPro",
    score: 68900,
    status: {
      action: "SELL",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T06:30:00')
    }
  },
  {
    trader: "WhaleMaster",
    score: 65300,
    status: {
      action: "BUY",
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T06:15:00')
    }
  },
  {
    trader: "CryptoKing",
    score: 61800,
    status: {
      action: "SELL",
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T06:00:00')
    }
  },
  {
    trader: "TokenMage",
    score: 58200,
    status: {
      action: "BUY",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T05:45:00')
    }
  },
  {
    trader: "ChartWizard",
    score: 54700,
    status: {
      action: "SELL",
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T05:30:00')
    }
  },
  {
    trader: "CryptoShark",
    score: 51200,
    status: {
      action: "BUY",
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T05:15:00')
    }
  },
  {
    trader: "BlockSmith",
    score: 48600,
    status: {
      action: "SELL",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T05:00:00')
    }
  },
  {
    trader: "CoinSage",
    score: 45100,
    status: {
      action: "BUY",
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T04:45:00')
    }
  },
  {
    trader: "TradeOracle",
    score: 42500,
    status: {
      action: "SELL",
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T04:30:00')
    }
  },
  {
    trader: "BitWizard",
    score: 39800,
    status: {
      action: "BUY",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T04:15:00')
    }
  },
  {
    trader: "CryptoMystic",
    score: 37200,
    status: {
      action: "SELL",
      pair: "ETH/USD",
      timestamp: new Date('2024-02-17T04:00:00')
    }
  },
  {
    trader: "ChainSage",
    score: 34600,
    status: {
      action: "BUY",
      pair: "SOL/USD",
      timestamp: new Date('2024-02-17T03:45:00')
    }
  },
  {
    trader: "TokenKnight",
    score: 32000,
    status: {
      action: "SELL",
      pair: "BTC/USD",
      timestamp: new Date('2024-02-17T03:30:00')
    }
  }
];
