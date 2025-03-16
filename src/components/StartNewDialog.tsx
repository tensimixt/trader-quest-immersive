
import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StartNewDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onConfirm: () => void;
  fetchingMode: 'newer' | 'older';
}

const StartNewDialog: React.FC<StartNewDialogProps> = ({
  isOpen,
  setIsOpen,
  onConfirm,
  fetchingMode
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="bg-black/80 border-amber-500/40">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-amber-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Start New Fetch Sequence
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p>This will reset the current fetch position and start a new sequence for {fetchingMode} tweets.</p>
            <p className="mt-2">Any existing cursor position will be lost. Are you sure you want to proceed?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            Start New
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default StartNewDialog;
