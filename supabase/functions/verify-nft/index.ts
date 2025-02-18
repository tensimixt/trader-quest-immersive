
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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

    // Fetch NFTs owned by the wallet using Helius API
    const response = await fetch(
      `https://api.helius.xyz/v1/nft-events?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            ownerAddress: walletAddress,
            types: ["NFT_MINT"],
          },
          options: {
            limit: 100,
          },
        }),
      }
    );
    
    const { result: nfts } = await response.json();
    
    // Updated collection address
    const VALID_COLLECTION_ADDRESS = "EE35ugdX9PvMgsSs9Zck6y5HmsiYxgnLM76AhSXN3kkY";
    
    console.log(`Checking NFTs against collection: ${VALID_COLLECTION_ADDRESS}`);

    // Check if any NFT matches our criteria
    const hasRequiredNFT = nfts.some((nftEvent: any) => {
      const nft = nftEvent.nft;
      
      // Check for collection address
      const hasValidCollection = nft.collection?.address === VALID_COLLECTION_ADDRESS;

      console.log(`NFT ${nft.name}: Collection valid: ${hasValidCollection}`);
      
      return hasValidCollection;
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

    if (updateError) throw updateError

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
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
