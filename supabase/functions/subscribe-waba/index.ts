import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { version, wabaId, token } = await req.json();

    console.log('Subscribe WABA request received:', { version, wabaId });

    if (!version || !wabaId || !token) {
      return new Response(
        JSON.stringify({ error: { message: 'Versão, WABA ID e Token são obrigatórios' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Subscribe to WABA
    const subscribeUrl = `https://graph.facebook.com/${version}/${wabaId}/subscribed_apps`;
    
    console.log('Calling Facebook Subscribe API:', subscribeUrl);

    const subscribeResponse = await fetch(subscribeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const subscribeData = await subscribeResponse.json();
    
    console.log('Facebook Subscribe API response:', { status: subscribeResponse.status, data: subscribeData });

    // If subscription failed, return error
    if (!subscribeResponse.ok || subscribeData.error) {
      return new Response(
        JSON.stringify(subscribeData),
        { 
          status: subscribeResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: If subscription successful, get phone numbers
    const phoneNumbersUrl = `https://graph.facebook.com/${version}/${wabaId}/phone_numbers`;
    
    console.log('Calling Facebook Phone Numbers API:', phoneNumbersUrl);

    const phoneResponse = await fetch(phoneNumbersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const phoneData = await phoneResponse.json();
    
    console.log('Facebook Phone Numbers API response:', { status: phoneResponse.status, data: phoneData });

    // Return combined response with subscription success and phone data
    return new Response(
      JSON.stringify({
        success: true,
        subscription: subscribeData,
        phoneNumbers: phoneData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in subscribe-waba function:', error);
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Erro interno do servidor' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
