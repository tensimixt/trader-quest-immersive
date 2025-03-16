
import React, { useState } from 'react';
import { History, AlertTriangle, RefreshCcw, Download, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StartNewDialog from './StartNewDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isSettingUpCron, setIsSettingUpCron] = useState(false);

  const handleStartNewClick = () => {
    setIsStartNewDialogOpen(true);
  };

  const confirmStartNew = () => {
    handleStartNewHistorical();
    setIsStartNewDialogOpen(false);
  };

  const setupCronJob = async () => {
    setIsSettingUpCron(true);
    
    try {
      toast.info("Setting up automated tweet fetching (every minute)...");
      
      const response = await supabase.functions.invoke('setup-tweet-cron');
      
      if (response.error) {
        throw new Error(`Error: ${response.error.message || response.error}`);
      }
      
      const data = response.data;
      
      if (data?.success) {
        toast.success("Successfully set up automated tweet fetching!");
        console.log("Cron job setup details:", data.details);
      } else {
        throw new Error(data?.message || "Unknown error setting up cron job");
      }
      
    } catch (error) {
      console.error("Error setting up cron job:", error);
      toast.error(`Failed to set up automated fetching: ${error.message}`);
    } finally {
      setIsSettingUpCron(false);
    }
  };

  return (
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
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={setupCronJob}
              disabled={isSettingUpCron}
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <Clock className={`h-4 w-4 mr-2 ${isSettingUpCron ? 'animate-spin' : ''}`} />
              Setup Auto-Fetch
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-black/90 text-white">
            <p className="text-xs">Set up a scheduled task that will automatically fetch new tweets every minute.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <StartNewDialog 
        isOpen={isStartNewDialogOpen} 
        setIsOpen={setIsStartNewDialogOpen} 
        onConfirm={confirmStartNew}
        fetchingMode={fetchingMode}
      />
    </div>
  );
};

export default TweetFetchActions;
