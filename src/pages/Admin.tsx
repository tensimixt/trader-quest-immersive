
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CircleUserRound, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TraderData {
  createdTime: string;
  fields: {
    call_end_date: string | null;
    call_start_date: string;
    created_at: string;
    current_score: number;
    exchange: string;
    expected_market_direction: string;
    market: string;
    market_id: string;
    score_delta: number;
    screenName: string;
    tweet_url: string;
    user_entered_text: string;
  };
  id: string;
}

const fetchTraderData = async (trader: string) => {
  const response = await fetch(`https://metadata.unlimitedcope.com/trader-report-gen/${trader}`);
  if (!response.ok) {
    throw new Error('Failed to fetch trader data');
  }
  const data = await response.json();
  return data as TraderData[];
};

const traders = ['ninjascalp', 'satsdart', 'inmortalcrypto']; // Add more traders as needed

export default function Admin() {
  const [selectedTrader, setSelectedTrader] = React.useState<string | null>(null);

  const { data: traderData, isLoading, error } = useQuery({
    queryKey: ['trader', selectedTrader],
    queryFn: () => selectedTrader ? fetchTraderData(selectedTrader) : null,
    enabled: !!selectedTrader,
  });

  const addCallsToSupabase = async (calls: TraderData[]) => {
    try {
      const { error } = await supabase.from('trading_calls').insert(
        calls.map(call => ({
          trader_name: call.fields.screenName,
          created_at: call.createdTime,
          call_start_date: call.fields.call_start_date,
          call_end_date: call.fields.call_end_date,
          market: call.fields.market,
          direction: call.fields.expected_market_direction,
          tweet_url: call.fields.tweet_url,
          score: call.fields.current_score,
          score_delta: call.fields.score_delta,
          exchange: call.fields.exchange,
          text: call.fields.user_entered_text
        }))
      );

      if (error) throw error;
      toast.success(`Successfully added ${calls.length} calls for ${selectedTrader}`);
    } catch (error) {
      console.error('Error adding calls:', error);
      toast.error('Failed to add calls to database');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-emerald-400">Trader Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {traders.map((trader) => (
            <motion.div
              key={trader}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-xl hover:bg-white/[0.02] transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <CircleUserRound className="w-12 h-12 text-emerald-400" />
                <div>
                  <h3 className="text-xl font-semibold">{trader}</h3>
                  <p className="text-sm text-gray-400">Trader Profile</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={() => setSelectedTrader(trader)}
                  variant="outline"
                  className="w-full"
                >
                  View Calls
                </Button>
                
                {selectedTrader === trader && traderData && (
                  <Button
                    onClick={() => addCallsToSupabase(traderData)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Add Calls to Database
                  </Button>
                )}
                
                {selectedTrader === trader && isLoading && (
                  <div className="text-center text-sm text-gray-400">
                    Loading trader data...
                  </div>
                )}
                
                {selectedTrader === trader && error && (
                  <div className="flex items-center justify-center gap-2 text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Failed to load trader data</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
