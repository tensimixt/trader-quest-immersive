
import React, { useState, useEffect } from 'react';
import { History, AlertTriangle, RefreshCcw, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StartNewDialog from './StartNewDialog';
import AdaptiveInsight from './AdaptiveInsight';

interface TweetFetchActionsProps {
  isPossiblyAtEnd: boolean;
  isHistoricalLoading: boolean;
  fetchingMode: 'newer' | 'older';
  continueButtonRef: React.RefObject<HTMLButtonElement>;
  handleRetryHistorical: () => void;
  handleStartNewHistorical: () => void;
  handleRetryFetch: () => void;
  handleFetchNew: () => void;
  isLoading: boolean;
  isFetchingNew: boolean;
}

const TweetFetchActions: React.FC<TweetFetchActionsProps> = ({
  isPossiblyAtEnd,
  isHistoricalLoading,
  fetchingMode,
  continueButtonRef,
  handleRetryHistorical,
  handleStartNewHistorical,
  handleRetryFetch,
  handleFetchNew,
  isLoading,
  isFetchingNew
}) => {
  const [isStartNewDialogOpen, setIsStartNewDialogOpen] = useState(false);
  
  // Add state for adaptive insight
  const [showInsight, setShowInsight] = useState(false);
  const [currentInsight, setCurrentInsight] = useState({
    title: "",
    description: "",
    type: "info" as const,
    symbol: "",
    change: 0,
    severity: "medium" as const
  });

  // Simulate detecting a price spike or other event with a timer
  useEffect(() => {
    // This would normally be triggered by real market data or user behavior
    const simulateEvent = () => {
      const events = [
        {
          title: "BTC Price Spike Detected",
          description: "Bitcoin has surged 4.8% in the last hour. This coincides with increased whale activity and positive sentiment from top traders.",
          type: "price_spike" as const,
          symbol: "BTC",
          change: 4.8,
          severity: "medium" as const
        },
        {
          title: "ETH Trading Volume Alert",
          description: "Ethereum trading volume has increased by 35% compared to the 24-hour average. This could indicate increased market interest.",
          type: "market_event" as const,
          symbol: "ETH",
          change: 2.1,
          severity: "low" as const
        },
        {
          title: "New Hsaka Trading Call",
          description: "Trader Hsaka has just posted a new bullish call on SOL with 85% confidence based on technical indicators and market sentiment.",
          type: "trader_call" as const,
          symbol: "SOL",
          change: 1.2,
          severity: "high" as const
        }
      ];
      
      // Pick a random event for this demo
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setCurrentInsight(randomEvent);
      setShowInsight(true);
    };
    
    // Show an insight after a random delay between 5-15 seconds
    const timeoutDelay = Math.floor(Math.random() * 10000) + 5000;
    const timerId = setTimeout(simulateEvent, timeoutDelay);
    
    return () => clearTimeout(timerId);
  }, []);

  const handleStartNewClick = () => {
    setIsStartNewDialogOpen(true);
  };

  const confirmStartNew = () => {
    handleStartNewHistorical();
    setIsStartNewDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartNewClick}
          disabled={isHistoricalLoading}
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          <History className="h-4 w-4 mr-2" />
          Start New
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={continueButtonRef}
                variant="outline"
                size="sm"
                onClick={handleRetryHistorical}
                disabled={isHistoricalLoading}
                className={`border-purple-500/30 text-purple-400 hover:bg-purple-500/10 ${isPossiblyAtEnd ? 'border-yellow-500/50 text-yellow-400' : ''}`}
              >
                <History className={`h-4 w-4 mr-2 ${isHistoricalLoading ? 'animate-spin' : ''}`} />
                Continue {fetchingMode === 'newer' ? 'Newer' : 'Older'}
                {isPossiblyAtEnd && <AlertTriangle className="h-3 w-3 ml-1 text-yellow-400" />}
              </Button>
            </TooltipTrigger>
            {isPossiblyAtEnd && (
              <TooltipContent className="bg-black/90 border-yellow-500/50 text-white">
                <p className="text-xs">You may have reached the end of available tweets, but you can try again if you wish.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleFetchNew}
          disabled={isFetchingNew}
          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          <Download className={`h-4 w-4 mr-2 ${isFetchingNew ? 'animate-spin' : ''}`} />
          Fetch Latest
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetryFetch}
          disabled={isLoading}
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <StartNewDialog 
          isOpen={isStartNewDialogOpen} 
          setIsOpen={setIsStartNewDialogOpen} 
          onConfirm={confirmStartNew}
          fetchingMode={fetchingMode}
        />
      </div>
      
      {/* Add our adaptive insight component */}
      <AdaptiveInsight 
        isVisible={showInsight}
        onClose={() => setShowInsight(false)}
        insight={currentInsight}
      />
    </>
  );
};

export default TweetFetchActions;
