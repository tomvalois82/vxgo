import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Atividade {
  id: number;
  id_oportunidade: number | null;
  id_lead: number | null;
  id_usuario: number | null;
  tipo: string | null;
  descricao: string | null;
  obs: string | null;
  data_hora: string | null;
  concluida: boolean | null;
  created_at: string;
}

export type AtividadeInsert = Omit<Atividade, 'id' | 'created_at'>;

export function useAtividades(oppId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery<Atividade[]>({
    queryKey: ['atividades', oppId],
    queryFn: async () => {
      if (!oppId) return [];
      const { data, error } = await supabase
        .from('atividade')
        .select('*')
        .eq('id_oportunidade', oppId)
        .order('data_hora', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as Atividade[];
    },
    enabled: !!oppId,
  });

  const createMutation = useMutation({
    mutationFn: async (atividade: AtividadeInsert) => {
      const { data, error } = await supabase
        .from('atividade')
        .insert(atividade)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atividades', oppId] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['atividades', oppId] });
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
      queryClient.invalidateQueries({ queryKey: ['atividades', oppId] });
    },
  });

  return {
    atividades: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

export type AtividadeStatusKanban = 'sem' | 'atrasada' | 'em-dia';

// Busca todas as atividades pendentes (concluida=false) e agrupa por id_oportunidade
export function useAtividadesStatusByOportunidade(oppIds: number[]) {
  return useQuery<Record<number, AtividadeStatusKanban>>({
    queryKey: ['atividades-status-kanban', oppIds.slice().sort((a, b) => a - b)],
    queryFn: async () => {
      const result: Record<number, AtividadeStatusKanban> = {};
      if (oppIds.length === 0) return result;
      const { data, error } = await supabase
        .from('atividade')
        .select('id_oportunidade, data_hora, concluida')
        .in('id_oportunidade', oppIds)
        .eq('concluida', false);
      if (error) throw error;
      const agora = Date.now();
      const porOpp: Record<number, { temAtrasada: boolean; temFutura: boolean }> = {};
      (data || []).forEach((a: { id_oportunidade: number | null; data_hora: string | null }) => {
        if (!a.id_oportunidade) return;
        const entry = porOpp[a.id_oportunidade] || { temAtrasada: false, temFutura: false };
        if (a.data_hora) {
          const ts = new Date(a.data_hora).getTime();
          if (ts < agora) entry.temAtrasada = true;
          else entry.temFutura = true;
        } else {
          entry.temFutura = true;
        }
        porOpp[a.id_oportunidade] = entry;
      });
      oppIds.forEach((id) => {
        const entry = porOpp[id];
        if (!entry) result[id] = 'sem';
        else if (entry.temAtrasada) result[id] = 'atrasada';
        else result[id] = 'em-dia';
      });
      return result;
    },
    enabled: oppIds.length > 0,
  });
}
