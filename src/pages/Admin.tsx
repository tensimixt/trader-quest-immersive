
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WalletAuthButton } from '@/components/WalletAuthButton';

interface TraderCall {
  createdTime: string;
  'fields.call_end_date': string | null;
  'fields.call_start_date': string;
  'fields.created_at': string;
  'fields.current_score': number;
  'fields.exchange': string;
  'fields.expected_market_direction': string;
  'fields.market': string;
  'fields.market_id': string;
  'fields.score_delta': number;
  'fields.screenName': string | null;
  'fields.tweet_url': string;
  'fields.user_entered_text': string;
  'fields.default_call_timeframe': number;
  'fields.marketcap_category': number | null;
  'fields.number_of_calls_in_timeframe': string | null;
  'fields.use_default_timeframe': string | null;
  id: string;
}

const traders = ['ninjascalp', 'satsdart', 'cryptofelon'];

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  const fetchTraderCalls = async (trader: string) => {
    try {
      const response = await fetch(`https://metadata.unlimitedcope.com/trader-report-gen/${trader}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trader calls');
      }
      const data = await response.json();
      console.log('API Response for trader:', trader, data);
      return data;
    } catch (error) {
      console.error('Error fetching trader calls:', error);
      throw error;
    }
  };

  const addTraderCallsToSupabase = async (trader: string) => {
    try {
      setIsLoading(trader);
      const calls = await fetchTraderCalls(trader);
      
      console.log('Raw calls data for trader:', trader, calls);
      const formattedCalls = calls.map((call: TraderCall) => {
        // Get screenName from the API response, fallback to the trader name with proper casing
        const screenName = call['fields.screenName'] || trader.charAt(0).toUpperCase() + trader.slice(1);
        
        return {
          trader_name: screenName,
          call_start_date: call['fields.call_start_date'],
          call_end_date: call['fields.call_end_date'],
          exchange: call['fields.exchange'],
          market: call['fields.market'],
          market_id: call['fields.market_id'],
          direction: call['fields.expected_market_direction'],
          score: call['fields.current_score'],
          score_delta: call['fields.score_delta'],
          tweet_url: call['fields.tweet_url'],
          text: call['fields.user_entered_text'],
          default_call_timeframe: call['fields.default_call_timeframe'],
          marketcap_category: call['fields.marketcap_category'],
          number_of_calls_in_timeframe: call['fields.number_of_calls_in_timeframe'],
          use_default_timeframe: call['fields.use_default_timeframe'],
          created_at: new Date().toISOString()
        };
      });

      console.log('Formatted calls ready for insert:', formattedCalls);
      const { error } = await supabase
        .from('trading_calls')
        .insert(formattedCalls);

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['trading_calls'] });
      
      toast({
        title: "Success",
        description: `Added ${formattedCalls.length} calls for ${trader}`,
      });

      window.location.reload();
    } catch (error: any) {
      console.error('Error adding calls to Supabase:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add trader calls",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <WalletAuthButton />
      <h1 className="text-2xl font-bold mb-6 text-white">Trader Management &lt;&gt;</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {traders.map((trader) => (
          <div key={trader} className="bg-black/20 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">{trader}</h3>
              <Button
                onClick={() => addTraderCallsToSupabase(trader)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20"
                disabled={isLoading === trader}
              >
                {isLoading === trader ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isLoading === trader ? 'Adding...' : 'Add Calls'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
