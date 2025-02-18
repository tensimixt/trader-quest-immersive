
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

    // Fetch NFTs owned by the wallet using Helius API
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${walletAddress}/nfts?api-key=${HELIUS_API_KEY}`
    )
    
    const nfts = await response.json()
    
    // Replace this with your actual NFT collection address
    const TARGET_COLLECTION = "YOUR_NFT_COLLECTION_ADDRESS"
    
    // Check if the wallet owns an NFT from the target collection
    const hasRequiredNFT = nfts.some((nft: any) => 
      nft.collection?.address === TARGET_COLLECTION
    )

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
      JSON.stringify({ verified: hasRequiredNFT }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
