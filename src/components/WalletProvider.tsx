
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { supabase } from '@/integrations/supabase/client';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = 'https://mainnet.helius-rpc.com/?api-key=1a474e37-e5d4-433f-9e36-18f37c7cb827';

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  // Auto sign in with Supabase when verification is successful
  const signInWithSupabase = async (walletAddress: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${walletAddress}@wallet.verified`,
        password: walletAddress, // Using wallet address as password for simplicity
      });

      if (error) {
        // If sign in fails, try to sign up first
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${walletAddress}@wallet.verified`,
          password: walletAddress,
        });

        if (signUpError) {
          console.error('Error creating Supabase account:', signUpError);
          return;
        }

        // Try signing in again after successful signup
        await supabase.auth.signInWithPassword({
          email: `${walletAddress}@wallet.verified`,
          password: walletAddress,
        });
      }

      console.log('Successfully created Supabase session');
    } catch (err) {
      console.error('Error in Supabase auth:', err);
    }
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
