
import React from 'react';
import { History, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TweetFetchActionsProps {
  isPossiblyAtEnd: boolean;
  isHistoricalLoading: boolean;
  fetchingMode: 'newer' | 'older';
  continueButtonRef: React.RefObject<HTMLButtonElement>;
  handleRetryHistorical: () => void;
  handleStartNewHistorical: () => void;
  handleRetryFetch: () => void;
  isLoading: boolean;
}

const TweetFetchActions: React.FC<TweetFetchActionsProps> = ({
  isPossiblyAtEnd,
  isHistoricalLoading,
  fetchingMode,
  continueButtonRef,
  handleRetryHistorical,
  handleStartNewHistorical,
  handleRetryFetch,
  isLoading
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleStartNewHistorical}
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
        onClick={handleRetryFetch}
        disabled={isLoading}
        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
      >
        <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};

export default TweetFetchActions;
