import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader, Wallet } from 'lucide-react';
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
  const hasInitialVerificationCheck = useRef(false);
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);

  const resetAllStates = () => {
    setIsVerified(false);
    setIsLoading(false);
    setUserRejected(false);
    setShouldVerify(false);
    
    verificationInProgress.current = false;
    isResetting.current = false;
    hasInitialVerificationCheck.current = false;
    
    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
      resetTimeout.current = null;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('wallet') || key?.includes('Wallet')) {
        localStorage.removeItem(key);
      }
    }

    localStorage.removeItem('walletName');
    localStorage.removeItem('wallet');
    localStorage.removeItem('autoConnect');
    
    sessionStorage.clear();
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      isResetting.current = true;
      
      const currentWalletAddress = publicKey?.toString();
      console.log('Reset: Starting reset for wallet address:', currentWalletAddress);
      
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

      await disconnect();

      console.log('Reset: Attempting to delete wallet record:', currentWalletAddress);
      const { error: deleteError } = await supabase
        .from('wallet_auth')
        .delete()
        .eq('wallet_address', currentWalletAddress);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }
      
      console.log('Reset: Successfully deleted wallet record');
      
      resetAllStates();
      
      toast({
        title: "Reset Successful",
        description: "Your wallet authentication data has been cleared. Refreshing page...",
        duration: 2000,
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Reset verification error:', error);
      toast({
        title: "Reset Error",
        description: error?.message || "There was an error resetting your wallet data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const verifyWallet = useCallback(async () => {
    if (!publicKey || !signMessage || isLoading || verificationInProgress.current || userRejected || !shouldVerify || isResetting.current) {
      console.log('Verification skipped:', {
        noPublicKey: !publicKey,
        noSignMessage: !signMessage,
        isLoading,
        verificationInProgress: verificationInProgress.current,
        userRejected,
        shouldNotVerify: !shouldVerify,
        isResetting: isResetting.current
      });
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
  }, [publicKey, signMessage, isLoading, disconnect, toast, userRejected, shouldVerify]);

  const CustomWalletButton = () => {
    if (isResetting.current) {
      return (
        <button 
          className="wallet-adapter-button !bg-white/5 !border !border-white/10 !shadow-lg hover:!shadow-white/5 !rounded-xl !px-6 !py-3 !h-auto !font-medium !tracking-wide !backdrop-blur-sm !text-white !cursor-not-allowed !opacity-50 flex items-center gap-2"
          disabled
        >
          <Loader className="w-5 h-5 text-white/70 animate-spin" />
          <span>Reloading...</span>
        </button>
      );
    }

    return (
      <WalletMultiButton 
        startIcon={<Wallet className="w-5 h-5 text-white/70" />}
        disabled={isLoading || isResetting.current}
      />
    );
  };

  useEffect(() => {
    return () => {
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkInitialVerification = async () => {
      if (!publicKey || !connected || hasInitialVerificationCheck.current || isResetting.current) {
        console.log('Skipping initial verification check:', {
          noPublicKey: !publicKey,
          notConnected: !connected,
          alreadyChecked: hasInitialVerificationCheck.current,
          isResetting: isResetting.current
        });
        return;
      }

      hasInitialVerificationCheck.current = true;
      
      try {
        console.log('Checking verification status for wallet:', publicKey.toString());
        const { data, error } = await supabase
          .from('wallet_auth')
          .select('nft_verified')
          .eq('wallet_address', publicKey.toString())
          .maybeSingle();

        if (error) {
          console.error('Initial verification check error:', error);
          return;
        }

        if (data?.nft_verified) {
          console.log('Wallet already verified:', data);
          setIsVerified(true);
          setShouldVerify(false);
        } else if (!userRejected) {
          console.log('Setting shouldVerify to true');
          setShouldVerify(true);
        }
      } catch (error) {
        console.error('Error in initial verification check:', error);
      }
    };

    checkInitialVerification();
  }, [connected, publicKey, userRejected]);

  useEffect(() => {
    if (!connected) {
      console.log('Wallet disconnected, resetting verification states');
      verificationInProgress.current = false;
      hasInitialVerificationCheck.current = false;
      setShouldVerify(false);
      setIsVerified(false);
    }
  }, [connected]);

  useEffect(() => {
    if (shouldVerify && !verificationInProgress.current && !isResetting.current) {
      console.log('Starting verification process');
      verifyWallet();
    }
  }, [shouldVerify, verifyWallet]);

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="flex items-center gap-3 [&_.wallet-adapter-button]:!bg-white/5 [&_.wallet-adapter-button]:hover:!bg-white/10 [&_.wallet-adapter-button]:!transition-all [&_.wallet-adapter-button]:!duration-300 [&_.wallet-adapter-button]:!border [&_.wallet-adapter-button]:!border-white/10 [&_.wallet-adapter-button]:!shadow-lg [&_.wallet-adapter-button]:hover:!shadow-white/5 [&_.wallet-adapter-button]:!rounded-xl [&_.wallet-adapter-button]:!px-6 [&_.wallet-adapter-button]:!py-3 [&_.wallet-adapter-button]:!h-auto [&_.wallet-adapter-button]:!font-medium [&_.wallet-adapter-button]:!tracking-wide [&_.wallet-adapter-button]:!backdrop-blur-sm [&_.wallet-adapter-button]:!text-white [&_.wallet-adapter-button:disabled]:!opacity-50 [&_.wallet-adapter-button:disabled]:!cursor-not-allowed">
        <CustomWalletButton />
        {(connected || userRejected) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all duration-300 border border-red-500/20 backdrop-blur-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isResetting.current}
          >
            <LogOut className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>
      {isLoading && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
        </div>
      )}
      {isVerified && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]">
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-pulse-soft"></div>
        </div>
      )}
    </div>
  );
};

export default WalletAuthButton;
