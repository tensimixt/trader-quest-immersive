
export interface TradingCall {
  id?: string
  trader_name: string
  created_at: string
  call_start_date: string
  call_end_date: string | null
  market: string
  direction: string
  tweet_url: string
  score: number
  score_delta: number
  exchange: string
  text: string
}

declare global {
  type Database = {
    public: {
      Tables: {
        trading_calls: {
          Row: TradingCall
          Insert: TradingCall
          Update: Partial<TradingCall>
        }
      }
    }
  }
}
