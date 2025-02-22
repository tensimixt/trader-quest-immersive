
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  'fields.screenName': string;
  'fields.tweet_url': string;
  'fields.user_entered_text': string;
  id: string;
}

const traders = ['ninjascalp', 'satsdart', 'cryptofelon']; // Example traders

const Admin = () => {
  const { toast } = useToast();

  const fetchTraderCalls = async (trader: string) => {
    try {
      const response = await fetch(`https://metadata.unlimitedcope.com/trader-report-gen/${trader}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trader calls');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching trader calls:', error);
      throw error;
    }
  };

  const addTraderCallsToSupabase = async (trader: string) => {
    try {
      const calls = await fetchTraderCalls(trader);
      
      // Prepare the data for insertion - now matching the actual table schema
      const formattedCalls = calls.map((call: TraderCall) => ({
        trader_name: call['fields.screenName'],
        call_start_date: call['fields.call_start_date'],
        call_end_date: call['fields.call_end_date'],
        exchange: call['fields.exchange'],
        market: call['fields.market'],
        direction: call['fields.expected_market_direction'],
        score: call['fields.current_score'],
        score_delta: call['fields.score_delta'],
        tweet_url: call['fields.tweet_url'],
        text: call['fields.user_entered_text'],
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('trading_calls')
        .insert(formattedCalls);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${formattedCalls.length} calls for ${trader}`,
      });
    } catch (error) {
      console.error('Error adding calls to Supabase:', error);
      toast({
        title: "Error",
        description: "Failed to add trader calls",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-white">Trader Management</h1>
      
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
              >
                <Plus className="w-4 h-4" />
                Add Calls
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
