
import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RefreshCcw } from 'lucide-react';

interface CutoffDateDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  cutoffDate: string;
  isLatestDateLoading: boolean;
  isFetchingUntilCutoff: boolean;
  fetchTweetsUntilCutoff: () => void;
}

const CutoffDateDialog: React.FC<CutoffDateDialogProps> = ({
  isOpen,
  setIsOpen,
  cutoffDate,
  isLatestDateLoading,
  isFetchingUntilCutoff,
  fetchTweetsUntilCutoff
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm" 
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          disabled={isFetchingUntilCutoff}
        >
          <Calendar className={`h-4 w-4 mr-2 ${isFetchingUntilCutoff ? 'animate-spin' : ''}`} />
          Fetch Until Cutoff
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-black/80 border-blue-500/40">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-blue-400">Fetch Until Cutoff Date</AlertDialogTitle>
          <AlertDialogDescription>
            This will continuously fetch tweets until reaching the cutoff date:
            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/20 rounded text-white font-mono">
              {cutoffDate}
            </div>
            {isLatestDateLoading && (
              <div className="mt-2 text-blue-300 flex items-center gap-2">
                <RefreshCcw className="w-3 h-3 animate-spin" />
                <span>Loading latest date from database...</span>
              </div>
            )}
            <p className="mt-2">This operation may take a while and make many API requests. Are you sure you want to proceed?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={fetchTweetsUntilCutoff} 
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CutoffDateDialog;
