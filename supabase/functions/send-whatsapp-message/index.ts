import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { version, phoneNumberId, token, recipientPhone, messageBody } = await req.json();

    console.log('Send WhatsApp Message request received:', { 
      version, 
      phoneNumberId, 
      recipientPhone: recipientPhone ? '***' : undefined,
      messageBodyLength: messageBody?.length 
    });

    if (!version || !phoneNumberId || !token || !recipientPhone || !messageBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: version, phoneNumberId, token, recipientPhone, messageBody' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
    console.log('Calling Facebook Messages API:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: messageBody,
        },
      }),
    });

    const data = await response.json();
    console.log('Facebook Messages API response:', { status: response.status, data });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error || data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
