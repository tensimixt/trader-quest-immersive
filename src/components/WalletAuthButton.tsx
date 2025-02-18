
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

  const handleLogout = async () => {
    await disconnect();
    setIsVerified(false);
    toast({
      title: "Disconnected",
      description: "Your wallet has been disconnected",
      duration: 3000,
    });
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
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-3">
        <WalletMultiButton 
          className="!bg-[#1A1F2C] hover:!bg-[#403E43] !transition-all !duration-300 !border !border-[#9b87f5]/20 !shadow-lg hover:!shadow-[#9b87f5]/10 !rounded-xl !px-6 !py-3 !h-auto !font-medium tracking-wide backdrop-blur-sm" 
          startIcon={<Wallet className="w-5 h-5 text-[#9b87f5]" />}
        />
        {connected && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all duration-300 border border-red-500/20 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        )}
      </div>
      {(isLoading || connecting) && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#9b87f5]"></div>
        </div>
      )}
      {isVerified && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#9b87f5] rounded-full shadow-[0_0_10px_rgba(155,135,245,0.5)]" />
      )}
    </div>
  );
};

export default WalletAuthButton;
