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
    const { version, phoneNumberId, token, pin } = await req.json();

    console.log('Register Phone WABA request received:', { version, phoneNumberId, pin: '***' });

    if (!version || !phoneNumberId || !token || !pin) {
      return new Response(
        JSON.stringify({ error: { message: 'Versão, Phone Number ID, Token e PIN são obrigatórios' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const registerUrl = `https://graph.facebook.com/${version}/${phoneNumberId}/register`;
    
    console.log('Calling Facebook Register Phone API:', registerUrl);

    const registerResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        pin: pin,
      }),
    });

    const registerData = await registerResponse.json();
    
    console.log('Facebook Register Phone API response:', { status: registerResponse.status, data: registerData });

    if (!registerResponse.ok || registerData.error) {
      return new Response(
        JSON.stringify(registerData),
        { 
          status: registerResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: registerData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in register-phone-waba function:', error);
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Erro interno do servidor' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
