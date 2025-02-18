
export interface MarketCall {
  traderProfile: string;
  market: string;
  direction: "LONG" | "SHORT";
  entryPrice: string;
  timeframe: string;
  analysis: string;
  confidence: number;
  roi: number;
  timestamp: string;
}

export interface ChatMessage {
  message: string;
  timestamp: string;
  isUser?: boolean;
  type?: 'chat' | 'intel' | 'history';
  contextData?: {
    showChart?: boolean;
    showCalls?: boolean;
  };
}

export interface SortConfig {
  key: 'rank' | 'roi' | 'score' | null;
  direction: 'asc' | 'desc';
}
