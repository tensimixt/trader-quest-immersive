
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Mistral } from 'npm:@mistralai/mistralai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MISTRAL_API_KEY');
    
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is not set');
    }
    
    const { tweet } = await req.json();
    
    if (!tweet || !tweet.text) {
      throw new Error('Invalid tweet data provided');
    }
    
    console.log('Classifying tweet:', tweet.id);
    
    const client = new Mistral({ apiKey });
    
    const prompt = `
You are a financial market analyst specializing in cryptocurrency and forex trends on social media.
Analyze the following tweet and classify it with these parameters:
1. Market: Identify which market it's discussing (BTC, ETH, CRYPTO, FOREX, or UNKNOWN)
2. Direction: Determine if the sentiment is bullish (UP), bearish (DOWN), or NEUTRAL
3. Confidence: Assign a confidence score (0-100) for your classification
4. Explanation: Provide a brief explanation (2-3 sentences) of your reasoning

Tweet: "${tweet.text}"
${tweet.quoted_tweet ? `Quoted Tweet: "${tweet.quoted_tweet.text}"` : ''}
${tweet.author ? `Author: @${tweet.author.userName}` : ''}

Format your response as a valid JSON object with these exact fields:
{
  "market": "BTC|ETH|CRYPTO|FOREX|UNKNOWN",
  "direction": "UP|DOWN|NEUTRAL",
  "confidence": number between 0-100,
  "explanation": "Your brief explanation here"
}
`;

    try {
      const chatResponse = await client.chat.complete({
        model: 'mistral-tiny',
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = chatResponse.choices[0].message.content;
      console.log('Raw Mistral response:', responseText);
      
      // Try to parse the JSON response
      let parsedResponse;
      try {
        // Look for JSON in the response - it might be wrapped in markdown code blocks
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                          responseText.match(/```\n([\s\S]*?)\n```/) || 
                          responseText.match(/{[\s\S]*?}/);
                          
        const jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```\n|```/g, '') : responseText;
        parsedResponse = JSON.parse(jsonString);
        
        // Validate required fields
        if (!parsedResponse.market || !parsedResponse.direction || parsedResponse.confidence === undefined) {
          throw new Error('Missing required fields in AI response');
        }
        
        console.log('Successfully classified tweet:', tweet.id, parsedResponse);
        
        return new Response(JSON.stringify(parsedResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw response that could not be parsed:', responseText);
        
        // Fallback classification
        parsedResponse = {
          market: "UNKNOWN",
          direction: "NEUTRAL",
          confidence: 50,
          explanation: "Classification based on fallback logic due to parsing error."
        };
        
        return new Response(JSON.stringify(parsedResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (mistralError) {
      console.error('Error calling Mistral API:', mistralError);
      throw new Error(`Mistral API error: ${mistralError.message}`);
    }
  } catch (error) {
    console.error('Error in tweet classification:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      market: "UNKNOWN",
      direction: "NEUTRAL",
      confidence: 50,
      explanation: "Error occurred during classification."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
