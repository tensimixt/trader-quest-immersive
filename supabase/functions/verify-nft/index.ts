
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Connection, PublicKey } from 'https://esm.sh/@solana/web3.js@1.87.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const HELIUS_API_KEY = Deno.env.get('HELIUS_API_KEY')
    if (!HELIUS_API_KEY) {
      throw new Error('HELIUS_API_KEY is not set')
    }

    const { walletAddress } = await req.json()
    if (!walletAddress) {
      throw new Error('Wallet address is required')
    }

    console.log(`Verifying NFTs for wallet: ${walletAddress}`);

    // Connect to Helius RPC
    const connection = new Connection(`https://rpc-devnet.helius.xyz/?api-key=${HELIUS_API_KEY}`);
    
    // Get all token accounts for the wallet
    const accounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program ID
      }
    );

    console.log(`Found ${accounts.value.length} token accounts`);
    
    const VALID_COLLECTION_ADDRESS = "EE35ugdX9PvMgsSs9Zck6y5HmsiYxgnLM76AhSXN3kkY";
    
    // Check if any token account belongs to our collection
    const hasRequiredNFT = accounts.value.some(account => {
      const mint = account.account.data.parsed.info.mint;
      console.log(`Checking mint: ${mint}`);
      return mint === VALID_COLLECTION_ADDRESS;
    });

    console.log(`NFT verification result: ${hasRequiredNFT}`);

    // Update the wallet_auth table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabaseAdmin
      .from('wallet_auth')
      .upsert({
        wallet_address: walletAddress,
        nft_verified: hasRequiredNFT,
        last_verification: new Date().toISOString()
      })

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        verified: hasRequiredNFT,
        message: hasRequiredNFT ? 
          "NFT verification successful" : 
          "No matching NFTs found in the required collection"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to verify NFT ownership. Please try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
