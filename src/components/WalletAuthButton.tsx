
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Wallet } from 'lucide-react';
import bs58 from 'bs58';
import { useTab } from '@/context/TabContext';

export const WalletAuthButton = () => {
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const { setActiveTab, isTransitioning } = useTab();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRejected, setUserRejected] = useState(false);
  const [shouldVerify, setShouldVerify] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const verificationInProgress = useRef(false);
  const isResetting = useRef(false);

  const handleReset = async () => {
    try {
      isResetting.current = true;
      setIsLoading(true);
      
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

      const { data: existingRecord, error: checkError } = await supabase
        .from('wallet_auth')
        .select('*')
        .eq('wallet_address', currentWalletAddress)
        .maybeSingle();

      if (checkError) {
        console.error('Check error:', checkError);
        throw checkError;
      }

      if (existingRecord) {
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
      } else {
        console.log('No record found to delete for wallet:', currentWalletAddress);
      }
      
      await disconnect();
      
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
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isResetting.current = false;
      }, 1000);
    }
  };

  const verifyNFTOwnership = async () => {
    try {
      setIsVerifying(true);
      
      if (!publicKey) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet first",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const { data, error } = await supabase
        .from('wallet_auth')
        .upsert({
          wallet_address: publicKey.toString(),
          nft_verified: true,
          last_verified: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Verification error:', error);
        toast({
          title: "Verification Failed",
          description: "There was an error verifying your NFT ownership",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      console.log('Verification successful:', data);
      
      // First set the verified state
      setIsVerified(true);
      
      // Immediately attempt to transition
      console.log("Attempting tab transition after verification...");
      try {
        await setActiveTab("chat");
        console.log("Tab transition successful");
      } catch (error) {
        console.error("Error during tab transition:", error);
      }
      
      toast({
        title: "Verification Successful",
        description: "Your NFT ownership has been verified",
        duration: 3000,
      });
      
    } catch (err) {
      console.error('Error in verification:', err);
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyWallet = useCallback(async () => {
    if (!publicKey || !signMessage || isLoading || verificationInProgress.current || userRejected || !shouldVerify || isResetting.current) {
      return;
    }
    
    try {
      verificationInProgress.current = true;
      setIsLoading(true);
      
      const { data: existingVerification, error: verificationError } = await supabase
        .from('wallet_auth')
        .select('nft_verified')
        .eq('wallet_address', publicKey.toString())
        .maybeSingle();

      if (verificationError) {
        console.error('Verification check error:', verificationError);
        toast({
          title: "Verification Check Failed",
          description: "Error checking verification status. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      if (existingVerification?.nft_verified) {
        console.log('Already verified:', existingVerification);
        setIsVerified(true);
        setShouldVerify(false);
        
        // Immediately attempt to transition for existing verification
        console.log("Attempting tab transition for existing verification...");
        try {
          await setActiveTab("chat");
          console.log("Tab transition successful");
        } catch (error) {
          console.error("Error during tab transition:", error);
        }
        
        toast({
          title: "Already Verified",
          description: "Your wallet is already verified",
          duration: 3000,
        });
        return;
      }

      const message = new TextEncoder().encode(
        `Welcome to the platform!\n\n` +
        `Please sign this message to verify that you own this wallet:\n` +
        `${publicKey.toString()}\n\n` +
        `This signature will be used to verify your NFT ownership.\n` +
        `Timestamp: ${Date.now()}`
      );
      
      let signature;
      try {
        signature = await signMessage(message);
      } catch (error: any) {
        console.error('Signature error:', error);
        if (error?.message?.includes('User rejected')) {
          setUserRejected(true);
          setShouldVerify(false);
          toast({
            title: "Verification Cancelled",
            description: "You cancelled the signature request. Please reset and try again if you want to verify.",
            variant: "destructive",
            duration: 3000,
          });
          await disconnect();
        }
        return;
      }

      if (signature) {
        console.log('Calling verify-nft function with signature');
        const { data: verificationData, error: verificationFnError } = await supabase.functions.invoke('verify-nft', {
          body: { 
            walletAddress: publicKey.toString(),
            message: bs58.encode(message),
            signature: bs58.encode(signature)
          }
        });

        if (verificationFnError) {
          console.error('Verification function error:', verificationFnError);
          toast({
            title: "Verification Failed",
            description: "Error during NFT verification. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
          throw verificationFnError;
        }

        console.log('Verification response:', verificationData);

        if (verificationData?.verified) {
          const { error: upsertError } = await supabase
            .from('wallet_auth')
            .upsert({
              wallet_address: publicKey.toString(),
              nft_verified: true,
              last_verification: new Date().toISOString()
            }, {
              onConflict: 'wallet_address',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.error('Upsert error:', upsertError);
            toast({
              title: "Database Error",
              description: "Error saving verification status. Please try again.",
              variant: "destructive",
              duration: 3000,
            });
            throw upsertError;
          }

          setIsVerified(true);
          setShouldVerify(false);
          
          // Immediately attempt to transition after successful verification
          console.log("Attempting tab transition after successful verification...");
          try {
            await setActiveTab("chat");
            console.log("Tab transition successful");
          } catch (error) {
            console.error("Error during tab transition:", error);
          }
          
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
            variant: "destructive",
            duration: 3000,
          });
          await disconnect();
        }
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setShouldVerify(false);
      toast({
        title: "Verification Error",
        description: error?.message || "There was an error verifying your NFT ownership. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      await disconnect();
    } finally {
      setIsLoading(false);
      verificationInProgress.current = false;
    }
  }, [publicKey, signMessage, isLoading, disconnect, toast, userRejected, shouldVerify, setActiveTab]);

  useEffect(() => {
    if (connected && publicKey && !isVerified && !userRejected && !shouldVerify && !isResetting.current) {
      setShouldVerify(true);
    }
  }, [connected, publicKey, isVerified, userRejected]);

  useEffect(() => {
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
