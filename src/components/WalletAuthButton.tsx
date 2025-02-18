
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const WalletAuthButton = () => {
  const { publicKey, connected } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (connected && publicKey) {
      verifyWallet();
    } else {
      setIsVerified(false);
    }
  }, [connected, publicKey]);

  const verifyWallet = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      // First check if we have a recent verification
      const { data: walletData } = await supabase
        .from('wallet_auth')
        .select('nft_verified, last_verification')
        .eq('wallet_address', publicKey.toString())
        .single();

      const lastVerification = walletData?.last_verification ? new Date(walletData.last_verification) : null;
      const needsVerification = !lastVerification || 
        (new Date().getTime() - lastVerification.getTime()) > 1000 * 60 * 60; // 1 hour

      if (!needsVerification && walletData?.nft_verified) {
        setIsVerified(true);
        return;
      }

      // Verify NFT ownership
      const { data, error } = await supabase.functions.invoke('verify-nft', {
        body: { walletAddress: publicKey.toString() }
      });

      if (error) throw error;

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
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600" />
      {isLoading && (
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
