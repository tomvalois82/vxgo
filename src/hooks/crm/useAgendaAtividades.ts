import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Atividade } from './useAtividades';

export interface AgendaAtividade extends Atividade {
  lead_nome?: string | null;
  lead_telefone?: string | null;
}

export interface AgendaFilters {
  concluida?: boolean | null; // null = all
  tipo?: string | null; // null = all
  id_usuario?: number | null; // null = all (only for managers)
}

export function useAgendaAtividades(selectedDate: Date, filters: AgendaFilters = {}) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const dateStr = selectedDate.toISOString().slice(0, 10);

  const query = useQuery<AgendaAtividade[]>({
    queryKey: ['agenda-atividades', dateStr, profile?.config, filters],
    queryFn: async () => {
      if (!profile?.config) return [];

      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;

      let q = supabase
        .from('atividade')
        .select('*, lead!atividade_id_lead_fkey(nome, telefone)')
        .gte('data_hora', startOfDay)
        .lte('data_hora', endOfDay)
        .order('data_hora', { ascending: true });

      // Filter by concluida
      if (filters.concluida !== null && filters.concluida !== undefined) {
        q = q.eq('concluida', filters.concluida);
      }

      // Filter by tipo
      if (filters.tipo) {
        q = q.eq('tipo', filters.tipo);
      }

      // Filter by user
      if (filters.id_usuario !== null && filters.id_usuario !== undefined) {
        q = q.eq('id_usuario', filters.id_usuario);
      }

      const { data, error } = await q;

      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        lead_nome: row.lead?.nome || null,
        lead_telefone: row.lead?.telefone || null,
        lead: undefined,
      })) as AgendaAtividade[];
    },
    enabled: !!profile?.config,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...fields }: { id: number; [key: string]: any }) => {
      const { error } = await supabase
        .from('atividade')
        .update(fields)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('atividade')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-atividades'] });
      queryClient.invalidateQueries({ queryKey: ['atividades'] });
    },
  });

  return {
    atividades: query.data || [],
    isLoading: query.isLoading,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
  };
}
