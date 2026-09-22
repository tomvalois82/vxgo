import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeadListItem {
  id: number;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  Origem: string | null;
  interesse: string | null;
  created_at: string;
  totalOportunidades: number;
}

interface UseLeadsListParams {
  search: string;
  page: number;
  pageSize: number;
}

interface LeadsListResult {
  leads: LeadListItem[];
  total: number;
}

/** Lista paginada de leads do config do usuário logado, com contagem de oportunidades */
export const useLeadsList = ({ search, page, pageSize }: UseLeadsListParams) => {
  const { profile, isLoading: authLoading } = useAuth();

  return useQuery<LeadsListResult, Error>({
    queryKey: ['leads-list', profile?.config, search, page, pageSize],
    enabled: !authLoading && !!profile?.config,
    queryFn: async () => {
      if (!profile?.config) return { leads: [], total: 0 };

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('lead')
        .select('id, nome, telefone, email, Origem, interesse, created_at', { count: 'exact' })
        .eq('config', profile.config);

      const termo = search.trim();
      if (termo) {
        const t = `%${termo}%`;
        query = query.or(`nome.ilike.${t},telefone.ilike.${t}`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);

      const leads = (data ?? []) as Omit<LeadListItem, 'totalOportunidades'>[];
      const ids = leads.map((l) => l.id);

      const contagem: Record<number, number> = {};
      if (ids.length > 0) {
        const { data: opps, error: oppError } = await supabase
          .from('opotunidade')
          .select('id, id_lead')
          .in('id_lead', ids);
        if (oppError) throw new Error(oppError.message);
        (opps ?? []).forEach((o) => {
          if (o.id_lead) contagem[o.id_lead] = (contagem[o.id_lead] ?? 0) + 1;
        });
      }

      return {
        leads: leads.map((l) => ({ ...l, totalOportunidades: contagem[l.id] ?? 0 })),
        total: count ?? 0,
      };
    },
  });
};
