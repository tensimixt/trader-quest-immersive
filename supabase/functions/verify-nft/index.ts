
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
      const VALID_COLLECTION_ADDRESS = "EE35ugdX9PvMgsSs9Zck6y5HmsiYxgnLM76AhSXN3kkY";

      // First, get all NFTs in the collection using RPC endpoint
      console.log('Fetching collection assets...');
      const collectionResponse = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByGroup",
            params: {
              groupKey: "collection",
              groupValue: VALID_COLLECTION_ADDRESS,
              page: 1,
              limit: 1000,
              options: {
                showUnverifiedCollections: false,
                showCollectionMetadata: false
              }
            }
          }),
        }
      );

      if (!collectionResponse.ok) {
        const errorText = await collectionResponse.text();
        console.error('Helius API error response (collection):', errorText);
        throw new Error(`Helius API error: ${collectionResponse.status} - ${errorText}`);
      }

      const collectionData = await collectionResponse.json();
      const collectionAssets = collectionData.result.items;
      console.log(`Found ${collectionAssets.length} assets in collection`);
      
      // Get all NFTs owned by the wallet using RPC endpoint
      const walletResponse = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByOwner",
            params: {
              ownerAddress: walletAddress,
              page: 1,
              limit: 1000
            }
          })
        }
      );

      if (!walletResponse.ok) {
        const errorText = await walletResponse.text();
        console.error('Helius API error response (wallet):', errorText);
        throw new Error(`Helius API error: ${walletResponse.status} - ${errorText}`);
      }

      const walletData = await walletResponse.json();
      const walletAssets = walletData.result.items;
      console.log(`Found ${walletAssets.length} assets in wallet`);

      // Create a Set of mint addresses from the collection for faster lookup
      const collectionMints = new Set(collectionAssets.map(asset => asset.id));
      
      // Check if any wallet NFT is in the collection
      const hasRequiredNFT = walletAssets.some(asset => {
        const isInCollection = collectionMints.has(asset.id);
        if (isInCollection) {
          console.log(`Found matching NFT: ${asset.content?.metadata?.name} (${asset.id})`);
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
