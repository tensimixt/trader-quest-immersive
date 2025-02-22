
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import WalletAuthButton from '@/components/WalletAuthButton';

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
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const fetchTraderCalls = async (trader: string) => {
    try {
      console.log(`Fetching calls for trader: ${trader}`);
      const response = await fetch(`https://metadata.unlimitedcope.com/trader-report-gen/${trader}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trader calls');
      }
      const data = await response.json();
      console.log(`Received ${data.length} calls for ${trader}`);
      return data;
    } catch (error) {
      console.error('Error fetching trader calls:', error);
      throw error;
    }
  };

  const addTraderCallsToSupabase = async (trader: string) => {
    try {
      setIsLoading(trader);
      console.log('Checking authentication session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to check authentication status');
      }

      if (!session) {
        console.log('No active session found');
        toast({
          title: "Authentication required",
          description: "Please login using the wallet button to add trader calls",
          variant: "destructive",
        });
        return;
      }

      console.log('Session found, user is authenticated');
      const calls = await fetchTraderCalls(trader);
      
      const formattedCalls = calls.map((call: TraderCall) => ({
        trader_name: call['fields.screenName'] || trader,
        call_start_date: call['fields.call_start_date'] || new Date().toISOString(),
        call_end_date: call['fields.call_end_date'],
        exchange: call['fields.exchange'] || 'unknown',
        market: call['fields.market'] || 'unknown',
        direction: call['fields.expected_market_direction'] || 'unknown',
        score: call['fields.current_score'] || 0,
        score_delta: call['fields.score_delta'] || 0,
        tweet_url: call['fields.tweet_url'] || '',
        text: call['fields.user_entered_text'] || '',
        market_id: call['fields.market_id'] || null,
        created_at: new Date().toISOString()
      }));

      console.log('Attempting to insert calls:', {
        numberOfCalls: formattedCalls.length,
        sampleCall: formattedCalls[0]
      });

      const { error: insertError, data } = await supabase
        .from('trading_calls')
        .insert(formattedCalls)
        .select();

      if (insertError) {
        console.error('Supabase insert error:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }

      console.log('Successfully added calls:', data);
      
      toast({
        title: "Success",
        description: `Added ${formattedCalls.length} calls for ${trader}`,
      });
    } catch (error: any) {
      console.error('Error adding calls to Supabase:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "Error",
        description: error.message || "Failed to add trader calls",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Trader Management</h1>
        <WalletAuthButton />
      </div>
      
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
                  <Loader className="w-4 h-4 animate-spin" />
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
