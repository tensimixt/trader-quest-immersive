
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Wallet } from 'lucide-react';
import bs58 from 'bs58';

export const WalletAuthButton = () => {
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRejected, setUserRejected] = useState(false);
  const [shouldVerify, setShouldVerify] = useState(false);
  const { toast } = useToast();
  const verificationInProgress = useRef(false);
  const isResetting = useRef(false);

  const handleReset = async () => {
    try {
      isResetting.current = true;
      setIsLoading(true);
      
      // Store the wallet address before disconnecting
      const currentWalletAddress = publicKey?.toString();
      console.log('Current wallet address:', currentWalletAddress);
      
      if (!currentWalletAddress) {
        console.error('No wallet address found for reset');
        toast({
          title: "Reset Error",
          description: "No wallet address found. Please make sure your wallet is connected.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // First clear the database record
      console.log('Attempting to delete record for wallet:', currentWalletAddress);
      const { error: deleteError, data: deleteData } = await supabase
        .from('wallet_auth')
        .delete()
        .eq('wallet_address', currentWalletAddress)
        .select();
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }
      
      console.log('Delete response:', deleteData);
      
      // Then disconnect the wallet
      await disconnect();
      
      // Reset all states
      setIsVerified(false);
      setUserRejected(false);
      setShouldVerify(false);
      
      toast({
        title: "Reset Successful",
        description: "Your wallet authentication data has been cleared. Please reconnect your wallet.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Reset verification error:', error);
      toast({
        title: "Reset Error",
        description: error?.message || "There was an error resetting your wallet data. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isResetting.current = false;
      }, 1000);
    }
  };

  const verifyWallet = useCallback(async () => {
    if (!publicKey || !signMessage || isLoading || verificationInProgress.current || userRejected || !shouldVerify || isResetting.current) {
      return;
    }
    
    try {
      verificationInProgress.current = true;
      setIsLoading(true);
      
      // Check if already verified
      const { data: existingVerification } = await supabase
        .from('wallet_auth')
        .select('nft_verified')
        .eq('wallet_address', publicKey.toString())
        .maybeSingle();

      if (existingVerification?.nft_verified) {
        setIsVerified(true);
        setShouldVerify(false);
        return;
      }

      // Generate verification message
      const message = new TextEncoder().encode(
        `Welcome to the platform!\n\n` +
        `Please sign this message to verify that you own this wallet:\n` +
        `${publicKey.toString()}\n\n` +
        `This signature will be used to verify your NFT ownership.\n` +
        `Timestamp: ${Date.now()}`
      );
      
      // Request signature
      let signature;
      try {
        signature = await signMessage(message);
      } catch (error: any) {
        console.error('Signature error:', error);
        // Check if the error is due to user rejection
        if (error?.message?.includes('User rejected')) {
          setUserRejected(true);
          setShouldVerify(false);
          toast({
            title: "Verification Cancelled",
            description: "You cancelled the signature request. Please reset and try again if you want to verify.",
            variant: "destructive",
            duration: 5000,
          });
          await disconnect();
        }
        return;
      }

      // Only proceed with verification if we got a valid signature
      if (signature) {
        const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-nft', {
          body: { 
            walletAddress: publicKey.toString(),
            message: bs58.encode(message),
            signature: bs58.encode(signature)
          }
        });

        if (verificationError) throw verificationError;

        if (verificationData?.verified) {
          const { error: insertError } = await supabase
            .from('wallet_auth')
            .insert({
              wallet_address: publicKey.toString(),
              nft_verified: true,
              last_verification: new Date().toISOString()
            });

          if (insertError) throw insertError;

          setIsVerified(true);
          setShouldVerify(false);
          toast({
            title: "Verification Successful",
            description: "Your NFT ownership has been verified",
            duration: 3000,
          });
        } else {
          setShouldVerify(false);
          toast({
            title: "NFT Verification Failed",
            description: "You need to own an NFT from the required collection to access this feature.",
            duration: 5000,
          });
          await disconnect();
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setShouldVerify(false);
      toast({
        title: "Verification Error",
        description: "There was an error verifying your NFT ownership. Please try again.",
        duration: 5000,
        variant: "destructive"
      });
      await disconnect();
    } finally {
      setIsLoading(false);
      verificationInProgress.current = false;
    }
  }, [publicKey, signMessage, isLoading, disconnect, toast, userRejected, shouldVerify]);

  useEffect(() => {
    // Only trigger verification when wallet is first connected and not resetting
    if (connected && publicKey && !isVerified && !userRejected && !shouldVerify && !isResetting.current) {
      setShouldVerify(true);
    }
  }, [connected, publicKey, isVerified, userRejected]);

  useEffect(() => {
    // Separate effect for running the verification
    if (shouldVerify && !verificationInProgress.current && !isResetting.current) {
      verifyWallet();
    }
  }, [shouldVerify, verifyWallet]);

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="flex items-center gap-3">
        <WalletMultiButton 
          className="!bg-[#1A1F2C] hover:!bg-[#403E43] !transition-all !duration-300 !border !border-[#9b87f5]/20 !shadow-lg hover:!shadow-[#9b87f5]/10 !rounded-xl !px-6 !py-3 !h-auto !font-medium tracking-wide backdrop-blur-sm !text-[#9b87f5]" 
          startIcon={<Wallet className="w-5 h-5 text-[#9b87f5]" />}
        />
        {(connected || userRejected) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all duration-300 border border-red-500/20 backdrop-blur-sm hover:shadow-lg"
            disabled={isLoading}
          >
            <LogOut className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>
      {isLoading && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#9b87f5]"></div>
        </div>
      )}
      {isVerified && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#9b87f5] rounded-full shadow-[0_0_10px_rgba(155,135,245,0.5)]">
          <div className="absolute inset-0 bg-[#9b87f5] rounded-full animate-pulse-soft"></div>
        </div>
      )}
    </div>
  );
};

export default WalletAuthButton;
