
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
      // Delete the wallet_auth entry completely
      const { error } = await supabase
        .from('wallet_auth')
        .delete()
        .eq('wallet_address', publicKey.toString());
      
      if (error) {
        console.error('Error deleting wallet auth:', error);
        throw error;
      }
      
      setIsVerified(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // First reset the verification status
      await resetVerification();
      
      // Then disconnect the wallet
      await disconnect();
      
      // Clear all local state
      setIsVerified(false);
      
      toast({
        title: "Logged Out Successfully",
        description: "Your wallet has been disconnected and verification reset",
        duration: 3000,
      });
      
      // Force reload the page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an error during logout. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkVerification = async () => {
      if (connected && publicKey) {
        const { data, error } = await supabase
          .from('wallet_auth')
          .select('nft_verified')
          .eq('wallet_address', publicKey.toString())
          .maybeSingle();

        if (error) {
          console.error('Error checking verification:', error);
          setIsVerified(false);
          return;
        }

        if (!data || !data.nft_verified) {
          setIsVerified(false);
          await verifyWallet();
        } else {
          setIsVerified(true);
        }
      } else {
        setIsVerified(false);
      }
    };

    checkVerification();
  }, [connected, publicKey]);

  const verifyWallet = async () => {
    if (!publicKey || !signMessage) return;
    
    setIsLoading(true);
    try {
      // First, request message signing
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
          variant: "destructive"
        });
        setIsLoading(false);
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

      // Update verification status in database
      if (data.verified) {
        const { error: upsertError } = await supabase
          .from('wallet_auth')
          .upsert({
            wallet_address: publicKey.toString(),
            nft_verified: true,
            last_verification: new Date().toISOString()
          });

        if (upsertError) {
          console.error('Error updating verification status:', upsertError);
          throw upsertError;
        }
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
    <div className="fixed top-4 right-4 z-[100]">
      <div className="flex items-center gap-3">
        <WalletMultiButton 
          className="!bg-[#1A1F2C] hover:!bg-[#403E43] !transition-all !duration-300 !border !border-[#9b87f5]/20 !shadow-lg hover:!shadow-[#9b87f5]/10 !rounded-xl !px-6 !py-3 !h-auto !font-medium tracking-wide backdrop-blur-sm !text-[#9b87f5]" 
          startIcon={<Wallet className="w-5 h-5 text-[#9b87f5]" />}
        />
        {connected && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-all duration-300 border border-red-500/20 backdrop-blur-sm hover:shadow-lg"
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
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#9b87f5] rounded-full shadow-[0_0_10px_rgba(155,135,245,0.5)]">
          <div className="absolute inset-0 bg-[#9b87f5] rounded-full animate-pulse-soft"></div>
        </div>
      )}
    </div>
  );
};

export default WalletAuthButton;
