import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeadOportunidade {
  id: number;
  titulo: string | null;
  valor: number | null;
  status: string | null;
  created_at: string;
  etapa: string | null;
  funil: string | null;
}

/** Oportunidades de um lead com a etapa e o funil correspondentes */
export const useLeadOportunidades = (leadId: number | null) => {
  return useQuery<LeadOportunidade[], Error>({
    queryKey: ['lead-oportunidades', leadId],
    enabled: !!leadId,
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('opotunidade')
        .select('id, titulo, valor, status, created_at, kanban:id_kanban (descricao, crm_funil:crm_funil (titulo))')
        .eq('id_lead', leadId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []).map((o: Record<string, unknown>) => {
        const kanban = (Array.isArray(o.kanban) ? o.kanban[0] : o.kanban) as
          | { descricao: string | null; crm_funil: { titulo: string | null } | { titulo: string | null }[] | null }
          | null;
        const funil = kanban
          ? (Array.isArray(kanban.crm_funil) ? kanban.crm_funil[0] : kanban.crm_funil)
          : null;
        return {
          id: o.id as number,
          titulo: (o.titulo as string | null) ?? null,
          valor: (o.valor as number | null) ?? null,
          status: (o.status as string | null) ?? null,
          created_at: o.created_at as string,
          etapa: kanban?.descricao ?? null,
          funil: funil?.titulo ?? null,
        };
      });
    },
  });
};
