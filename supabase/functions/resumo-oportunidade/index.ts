import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Aciona o fluxo do N8N que gera o resumo da oportunidade
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('N8N_RESUMO_WEBHOOK_URL');
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: 'Webhook não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const sessionWhatsapp = typeof body?.session_id_whasaap === 'string' ? body.session_id_whasaap : '';
    const sessionOlx = typeof body?.session_id_olx === 'string' ? body.session_id_olx : '';

    if (!sessionWhatsapp && !sessionOlx) {
      return new Response(JSON.stringify({ error: 'Informe ao menos um session_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resposta = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ session_id_whasaap: sessionWhatsapp, session_id_olx: sessionOlx }]),
    });

    const bruto = await resposta.text();

    if (!resposta.ok) {
      return new Response(JSON.stringify({ error: `Webhook retornou ${resposta.status}`, detalhe: bruto }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrai o texto do retorno, aceitando variações de formato
    let texto = '';
    try {
      const json = JSON.parse(bruto);
      const item = Array.isArray(json) ? json[0] : json;
      texto = item?.output?.text ?? item?.output ?? item?.text ?? item?.resumo ?? '';
      if (typeof texto !== 'string') texto = JSON.stringify(texto);
    } catch {
      texto = bruto;
    }

    return new Response(JSON.stringify({ resumo: texto }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: mensagem }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
