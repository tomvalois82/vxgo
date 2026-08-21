import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OportunidadeDetail {
  id: number;
  titulo: string | null;
  resumo: string | null;
  obs: string | null;
  status: string | null;
  valor: number | null;
  id_kanban: number | null;
  id_lead: number | null;
  id_usuario: number | null;
  idEstoque: number | null;
  motivo_perda: string | null;
  data_finalizado: string | null;
  origem: string | null;
  created_at: string;
  data_criacao: string | null;
  ultima_interacao: string | null;
  lead?: {
    id: number;
    nome: string | null;
    telefone: string | null;
    email: string | null;
    Origem: string | null;
    session_id_whatsaap: string | null;
    session_id_olx: string | null;
  } | null;
  usuario?: {
    id: number;
    nome: string | null;
  } | null;
}

export function useOportunidadeDetail(oppId: number | null) {
  return useQuery({
    queryKey: ['oportunidade-detail', oppId],
    queryFn: async () => {
      if (!oppId) return null;
      const { data, error } = await supabase
        .from('opotunidade')
        .select(`
          *,
          lead:id_lead (id, nome, telefone, email, Origem),
          usuario:id_usuario (id, nome)
        `)
        .eq('id', oppId)
        .single();
      if (error) throw error;
      return data as unknown as OportunidadeDetail;
    },
    enabled: !!oppId,
  });
}
