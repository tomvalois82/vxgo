import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Integração com a API 3C Plus (Fluxoti).
// Ações: "campaigns" (lista campanhas) e "send-list" (envia lista .csv).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const acao: string = body.action;
    const configId: number = Number(body.configId);

    if (!acao || !configId) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: action e configId.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: config, error: erroConfig } = await supabase
      .from('config')
      .select('api3cplus')
      .eq('id', configId)
      .maybeSingle();

    if (erroConfig || !config?.api3cplus) {
      return new Response(
        JSON.stringify({ error: 'Token da 3C Plus não configurado para esta conta.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = config.api3cplus as string;

    if (acao === 'campaigns') {
      const resposta = await fetch(
        `https://3c.fluxoti.com/api/v1/campaigns?api_token=${encodeURIComponent(token)}`,
        { headers: { accept: 'application/json' } }
      );
      const dados = await resposta.json();
      if (!resposta.ok) {
        return new Response(JSON.stringify({ error: dados }), {
          status: resposta.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const lista = Array.isArray(dados) ? dados : (dados?.data ?? []);
      const campanhas = lista.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name }));
      return new Response(JSON.stringify({ campanhas }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (acao === 'send-list') {
      const campaignId = Number(body.campaignId);
      const csv: string = body.csv ?? '';
      const nomeLista: string = body.listName || 'Lista CRM';
      const nomeArquivo: string = body.fileName || 'lista.csv';

      if (!campaignId || !csv.trim()) {
        return new Response(JSON.stringify({ error: 'Campos obrigatórios: campaignId e csv.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const form = new FormData();
      form.append('name', nomeLista);
      form.append('header[0]', 'areacodephone');
      form.append('header[1]', 'Nome');
      form.append('header[2]', 'Interesse');
      form.append('header[3]', 'Resumo');
      form.append('header[4]', 'identifier');
      form.append('mailing', new Blob([csv], { type: 'text/csv' }), nomeArquivo);
      form.append('delimiter', 'quotes');
      form.append('separator', ',');
      form.append('has_header', '1');

      const resposta = await fetch(
        `https://3c.fluxoti.com/api/v1/campaigns/${campaignId}/lists/csv?api_token=${encodeURIComponent(token)}`,
        { method: 'POST', body: form }
      );
      const dados = await resposta.json();
      if (!resposta.ok) {
        return new Response(JSON.stringify({ error: dados }), {
          status: resposta.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data: dados?.data ?? dados }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida.' }), {
      status: 400,
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
