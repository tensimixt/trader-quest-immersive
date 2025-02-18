
export interface MarketCall {
  traderProfile: string;
  market: string;
  direction: string;
  entryPrice: string;
  timeframe: string;
  analysis: string;
  confidence: number;
  roi: number;
  timestamp: string;
}

export interface TraderStatus {
  action: 'BUY' | 'SELL';
  pair: string;
  timestamp: Date;
}

export interface LeaderboardEntry {
  trader: string;
  score: number;
  status: TraderStatus;
}

export interface PerformanceData {
  monthlyData: Array<{
    month: string;
    winRate: number;
  }>;
  overall: number;
}
