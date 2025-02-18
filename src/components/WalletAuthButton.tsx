
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import bs58 from 'bs58';

export const WalletAuthButton = () => {
  const { publicKey, connected, connecting, signMessage, disconnect } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetVerification = async () => {
    if (publicKey) {
      // Clear the verification in the database
      await supabase
        .from('wallet_auth')
        .update({
          nft_verified: false,
          last_verification: null
        })
        .eq('wallet_address', publicKey.toString());
      
      // Reset local state
      setIsVerified(false);
      
      // Disconnect wallet
      await disconnect();
      
      toast({
        title: "Verification Reset",
        description: "Please reconnect your wallet to verify again",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      verifyWallet();
    } else {
      setIsVerified(false);
    }
  }, [connected, publicKey]);

  const verifyWallet = async () => {
    if (!publicKey || !signMessage) return;
    
    setIsLoading(true);
    try {
      // First, request message signing
      const message = new TextEncoder().encode(
        `Verify wallet ownership for ${publicKey.toString()}\nTimestamp: ${Date.now()}`
      );
      
      try {
        const signedMessage = await signMessage(message);
        console.log('Message signed successfully:', bs58.encode(signedMessage));
      } catch (error) {
        console.error('Error signing message:', error);
        toast({
          title: "Signature Required",
          description: "Please sign the message to verify wallet ownership",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Check if we have a recent verification
      const { data: walletData, error: fetchError } = await supabase
        .from('wallet_auth')
        .select('nft_verified, last_verification')
        .eq('wallet_address', publicKey.toString())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching wallet data:', fetchError);
        throw new Error('Failed to fetch wallet verification status');
      }

      const lastVerification = walletData?.last_verification ? new Date(walletData.last_verification) : null;
      const needsVerification = !lastVerification || 
        (new Date().getTime() - lastVerification.getTime()) > 1000 * 60 * 60; // 1 hour

      if (!needsVerification && walletData?.nft_verified) {
        setIsVerified(true);
        return;
      }

      // Verify NFT ownership
      const { data, error } = await supabase.functions.invoke('verify-nft', {
        body: { 
          walletAddress: publicKey.toString()
        }
      });

      if (error) {
        console.error('Verification function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data received from verification function');
      }

      setIsVerified(data.verified);
      
      if (!data.verified) {
        toast({
          title: "NFT Verification Failed",
          description: "You need to own an NFT from the required collection to access this feature.",
          duration: 5000,
        });
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <WalletMultiButton 
          className="!bg-emerald-500 hover:!bg-emerald-600" 
        />
        {connected && (
          <button
            onClick={resetVerification}
            className="px-3 py-2 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      {(isLoading || connecting) && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-400"></div>
        </div>
      )}
      {isVerified && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
      )}
    </div>
  );
};

export default WalletAuthButton;
