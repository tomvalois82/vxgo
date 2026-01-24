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

    const url = `https://graph.facebook.com/${version}/${wabaId}/subscribed_apps`;
    
    console.log('Calling Facebook API:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    console.log('Facebook API response:', { status: response.status, data });

    return new Response(
      JSON.stringify(data),
      { 
        status: response.status, 
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
