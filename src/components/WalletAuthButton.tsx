
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Wallet } from 'lucide-react';
import bs58 from 'bs58';

export const WalletAuthButton = () => {
  const { publicKey, connected, connecting, signMessage, disconnect } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset verification when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setIsVerified(false);
      setIsLoading(false);
    }
  }, [connected]);

  const handleReset = async () => {
    try {
      setIsLoading(true);
      if (publicKey) {
        // Delete the verification record first
        const { error } = await supabase
          .from('wallet_auth')
          .delete()
          .eq('wallet_address', publicKey.toString());
        
        if (error) {
          console.error('Error deleting wallet auth:', error);
          throw error;
        }
        
        console.log('Successfully deleted wallet authentication data');
        
        // Reset state and disconnect
        setIsVerified(false);
        await disconnect();
        
        toast({
          title: "Reset Successful",
          description: "Your wallet authentication data has been cleared",
          duration: 3000,
        });

        // Force a clean reload
        window.location.reload();
      }
    } catch (error) {
      console.error('Reset verification error:', error);
      toast({
        title: "Reset Error",
        description: "There was an error resetting your wallet data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyWallet = async () => {
    if (!publicKey || !signMessage || isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Starting verification process...', publicKey.toString());
      
      // Check database verification status
      const { data: existingVerification, error: checkError } = await supabase
        .from('wallet_auth')
        .select('nft_verified')
        .eq('wallet_address', publicKey.toString())
        .maybeSingle();

      if (checkError) {
        console.error('Error checking verification status:', checkError);
        throw checkError;
      }

      console.log('Existing verification:', existingVerification);

      if (existingVerification?.nft_verified) {
        console.log('Found existing verification, setting verified state');
        setIsVerified(true);
        setIsLoading(false);
        return;
      }

      // Always request message signing for new verifications
      console.log('Requesting message signing...');
      const message = new TextEncoder().encode(
        `Verify wallet ownership for ${publicKey.toString()}\nTimestamp: ${Date.now()}`
      );
      
      let signedMessage;
      try {
        signedMessage = await signMessage(message);
        console.log('Message signed successfully:', bs58.encode(signedMessage));
      } catch (error) {
        console.error('Error signing message:', error);
        toast({
          title: "Signature Required",
          description: "Please sign the message to verify wallet ownership",
          variant: "destructive",
          duration: 5000,
        });
        setIsLoading(false);
        await disconnect();
        return;
      }

      // Verify NFT ownership
      console.log('Calling verify-nft function...');
      const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-nft', {
        body: { 
          walletAddress: publicKey.toString()
        }
      });

      console.log('Verification response:', verificationData, verificationError);

      if (verificationError) {
        console.error('Verification function error:', verificationError);
        throw verificationError;
      }

      if (!verificationData || typeof verificationData.verified === 'undefined') {
        console.error('Invalid verification response:', verificationData);
        throw new Error('Invalid verification response from server');
      }

      if (verificationData.verified === true) {
        // Insert new verification record
        const { error: insertError } = await supabase
          .from('wallet_auth')
          .insert({
            wallet_address: publicKey.toString(),
            nft_verified: true,
            last_verification: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error updating verification status:', insertError);
          throw insertError;
        }

        setIsVerified(true);
        toast({
          title: "Verification Successful",
          description: "Your NFT ownership has been verified",
          duration: 3000,
        });
      } else {
        console.log('NFT verification failed:', verificationData);
        setIsVerified(false);
        toast({
          title: "NFT Verification Failed",
          description: "You need to own an NFT from the required collection to access this feature.",
          duration: 5000,
        });
        await disconnect();
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Error",
        description: "There was an error verifying your NFT ownership. Please try again.",
        duration: 5000,
        variant: "destructive"
      });
      setIsVerified(false);
      await disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  // Modified useEffect to ensure verification happens when connected
  useEffect(() => {
    const checkAndVerify = async () => {
      if (connected && publicKey && !isVerified && !isLoading) {
        console.log('Triggering verification check...', {
          connected,
          publicKey: publicKey.toString(),
          isVerified,
          isLoading
        });
        await verifyWallet();
      }
    };

    checkAndVerify();
  }, [connected, publicKey, isVerified, isLoading]);

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="flex items-center gap-3">
        <WalletMultiButton 
          className="!bg-[#1A1F2C] hover:!bg-[#403E43] !transition-all !duration-300 !border !border-[#9b87f5]/20 !shadow-lg hover:!shadow-[#9b87f5]/10 !rounded-xl !px-6 !py-3 !h-auto !font-medium tracking-wide backdrop-blur-sm !text-[#9b87f5]" 
          startIcon={<Wallet className="w-5 h-5 text-[#9b87f5]" />}
        />
        {connected && (
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
      {(isLoading || connecting) && (
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
