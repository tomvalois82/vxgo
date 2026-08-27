import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VeiculoResumo {
  id: number;
  modelo: string | null;
  fabricante: string | null;
  ano: string | null;
  cor: string | null;
}

/**
 * Busca veículos do estoque do usuário pelos ids informados.
 * Usado para montar o filtro de interesse do CRM.
 */
export const useVeiculosPorIds = (ids: number[]) => {
  const { profile, isLoading: authLoading } = useAuth();
  const idsOrdenados = [...new Set(ids)].sort((a, b) => a - b);
  const chave = idsOrdenados.join(',');

  return useQuery<VeiculoResumo[], Error>({
    queryKey: ['veiculos-por-ids', profile?.tbEstoque, chave],
    queryFn: async () => {
      if (!profile?.tbEstoque || idsOrdenados.length === 0) return [];
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            in: (col: string, values: number[]) => Promise<{ data: VeiculoResumo[] | null; error: Error | null }>;
          };
        };
      })
        .from(profile.tbEstoque)
        .select('id, modelo, fabricante, ano, cor')
        .in('id', idsOrdenados);
      if (error) throw error;
      return data || [];
    },
    enabled: !authLoading && !!profile?.tbEstoque && idsOrdenados.length > 0,
  });
};
