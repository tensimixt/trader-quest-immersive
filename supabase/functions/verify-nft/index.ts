
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { PublicKey } from 'https://esm.sh/@solana/web3.js@1.87.6'

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
      console.error('HELIUS_API_KEY is not set');
      throw new Error('Configuration error');
    }

    const body = await req.json();
    const { walletAddress } = body;
    
    if (!walletAddress) {
      console.error('No wallet address provided');
      throw new Error('Wallet address is required');
    }

    console.log(`Verifying NFTs for wallet: ${walletAddress}`);

    try {
      // Validate wallet address
      new PublicKey(walletAddress);
    } catch (error) {
      console.error('Invalid wallet address:', error);
      throw new Error('Invalid wallet address format');
    }

    try {
      // Use Helius DAS API getAssetsByOwner endpoint
      const response = await fetch(
        'https://api.helius.xyz/v0/assets/getAssetsByOwner',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ownerAddress: walletAddress,
            displayOptions: {
              showCollectionMetadata: true,
            },
            api_key: HELIUS_API_KEY,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Helius API error response:', errorText);
        throw new Error(`Helius API error: ${response.status} - ${errorText}`);
      }

      const assets = await response.json();
      console.log(`Found ${assets.length} assets`);
      
      // Log all assets for debugging
      console.log('All assets:', JSON.stringify(assets, null, 2));

      const VALID_COLLECTION_ADDRESS = "EE35ugdX9PvMgsSs9Zck6y5HmsiYxgnLM76AhSXN3kkY";
      
      // Check if any asset belongs to our collection
      const hasRequiredNFT = assets.some(asset => {
        // Check collection address in various possible locations
        const collectionAddress = 
          asset.collection?.address || 
          asset.grouping?.find(g => g.group_key === "collection")?.group_value;
        
        const isInCollection = collectionAddress === VALID_COLLECTION_ADDRESS;
        
        if (isInCollection) {
          console.log(`Found matching NFT: ${asset.name}`);
          console.log('Collection details:', {
            collectionAddress,
            assetId: asset.id,
            mint: asset.id // in Helius v0, id is the mint address
          });
        }
        return isInCollection;
      });

      console.log(`NFT verification result: ${hasRequiredNFT}`);

      // Update the wallet_auth table
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // First try to delete any existing entries for this wallet
      await supabaseAdmin
        .from('wallet_auth')
        .delete()
        .eq('wallet_address', walletAddress);

      // Then insert the new record
      const { error: insertError } = await supabaseAdmin
        .from('wallet_auth')
        .insert({
          wallet_address: walletAddress,
          nft_verified: hasRequiredNFT,
          last_verification: new Date().toISOString()
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
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
      console.error('Helius API or database error:', error);
      throw new Error(`Failed to verify NFT ownership: ${error.message}`);
    }

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
