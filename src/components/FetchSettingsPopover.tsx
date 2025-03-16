
import React from 'react';
import { Settings, Info, RefreshCcw } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface FetchSettingsPopoverProps {
  batchSize: number;
  setBatchSize: (value: number) => void;
  tweetsPerRequest: number;
  setTweetsPerRequest: (value: number) => void;
  isAutoClickEnabled: boolean;
  setIsAutoClickEnabled: (value: boolean) => void;
  isLatestDateLoading: boolean;
  fetchLatestTweetDate: () => void;
}

const FetchSettingsPopover: React.FC<FetchSettingsPopoverProps> = ({
  batchSize,
  setBatchSize,
  tweetsPerRequest,
  setTweetsPerRequest,
  isAutoClickEnabled,
  setIsAutoClickEnabled,
  isLatestDateLoading,
  fetchLatestTweetDate
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
        >
          <Settings className="h-4 w-4 mr-2" />
          Fetch Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-black/80 border-amber-500/30">
        <div className="space-y-4">
          <h4 className="font-medium text-amber-400">Batch Settings</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Batch Size: {batchSize}</span>
              <span className="text-xs text-amber-400/70">API calls per batch</span>
            </div>
            <Slider
              value={[batchSize]}
              min={1}
              max={1000}
              step={10}
              onValueChange={(value) => setBatchSize(value[0])}
              className="w-full"
            />
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-white/70">Tweets Per Request: {tweetsPerRequest}</span>
              <span className="text-xs text-amber-400/70">Max tweets per page</span>
            </div>
            <Slider
              value={[tweetsPerRequest]}
              min={20}
              max={100}
              step={20}
              onValueChange={(value) => setTweetsPerRequest(value[0])}
              className="w-full"
            />
            
            <div className="mt-4 text-xs text-white/70 p-2 bg-amber-500/10 rounded">
              <Info className="h-3 w-3 inline-block mr-1 text-amber-400" />
              <span>Each request typically returns around 20 tweets regardless of the setting. The batch size determines how many API calls will be made in one batch operation.</span>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-white/70">Auto-click Continue (5s):</span>
              <Button
                variant={isAutoClickEnabled ? "autofetch" : "outline"}
                size="xs"
                onClick={() => setIsAutoClickEnabled(!isAutoClickEnabled)}
                className={isAutoClickEnabled ? "" : "border-gray-500/30 text-gray-400"}
              >
                {isAutoClickEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="xs"
                onClick={fetchLatestTweetDate}
                disabled={isLatestDateLoading}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <RefreshCcw className={`h-3 w-3 mr-1 ${isLatestDateLoading ? 'animate-spin' : ''}`} />
                Refresh Latest Date
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FetchSettingsPopover;
