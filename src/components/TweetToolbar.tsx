
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FetchSettingsPopover from './FetchSettingsPopover';
import TweetFetchActions from './TweetFetchActions';
import CutoffDateDialog from './CutoffDateDialog';

interface TweetToolbarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  fetchingMode: 'newer' | 'older';
  toggleFetchingMode: () => void;
  batchSize: number;
  setBatchSize: (value: number) => void;
  tweetsPerRequest: number;
  setTweetsPerRequest: (value: number) => void;
  isAutoClickEnabled: boolean;
  setIsAutoClickEnabled: (value: boolean) => void;
  isLatestDateLoading: boolean;
  fetchLatestTweetDate: () => void;
  isPossiblyAtEnd: boolean;
  isHistoricalLoading: boolean;
  continueButtonRef: React.RefObject<HTMLButtonElement>;
  handleRetryHistorical: () => void;
  handleStartNewHistorical: () => void;
  isUntilCutoffDialogOpen: boolean;
  setIsUntilCutoffDialogOpen: (value: boolean) => void;
  cutoffDate: string;
  isFetchingUntilCutoff: boolean;
  fetchTweetsUntilCutoff: () => void;
  handleRetryFetch: () => void;
  isLoading: boolean;
}

const TweetToolbar: React.FC<TweetToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  fetchingMode,
  toggleFetchingMode,
  batchSize,
  setBatchSize,
  tweetsPerRequest,
  setTweetsPerRequest,
  isAutoClickEnabled,
  setIsAutoClickEnabled,
  isLatestDateLoading,
  fetchLatestTweetDate,
  isPossiblyAtEnd,
  isHistoricalLoading,
  continueButtonRef,
  handleRetryHistorical,
  handleStartNewHistorical,
  isUntilCutoffDialogOpen,
  setIsUntilCutoffDialogOpen,
  cutoffDate,
  isFetchingUntilCutoff,
  fetchTweetsUntilCutoff,
  handleRetryFetch,
  isLoading
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-xl font-bold text-white">Tweet Analyzer</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Input
            type="text"
            placeholder="Search tweets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-black/20 border-purple-500/30 text-white placeholder:text-gray-400 w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFetchingMode}
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            {fetchingMode === 'older' ? "Switch to Newer" : "Switch to Older"}
          </Button>
          
          <FetchSettingsPopover 
            batchSize={batchSize}
            setBatchSize={setBatchSize}
            tweetsPerRequest={tweetsPerRequest}
            setTweetsPerRequest={setTweetsPerRequest}
            isAutoClickEnabled={isAutoClickEnabled}
            setIsAutoClickEnabled={setIsAutoClickEnabled}
            isLatestDateLoading={isLatestDateLoading}
            fetchLatestTweetDate={fetchLatestTweetDate}
          />
          
          <TweetFetchActions 
            isPossiblyAtEnd={isPossiblyAtEnd}
            isHistoricalLoading={isHistoricalLoading}
            fetchingMode={fetchingMode}
            continueButtonRef={continueButtonRef}
            handleRetryHistorical={handleRetryHistorical}
            handleStartNewHistorical={handleStartNewHistorical}
            handleRetryFetch={handleRetryFetch}
            isLoading={isLoading}
          />
          
          <CutoffDateDialog 
            isOpen={isUntilCutoffDialogOpen}
            setIsOpen={setIsUntilCutoffDialogOpen}
            cutoffDate={cutoffDate}
            isLatestDateLoading={isLatestDateLoading}
            isFetchingUntilCutoff={isFetchingUntilCutoff}
            fetchTweetsUntilCutoff={fetchTweetsUntilCutoff}
          />
        </div>
      </div>
    </div>
  );
};

export default TweetToolbar;
