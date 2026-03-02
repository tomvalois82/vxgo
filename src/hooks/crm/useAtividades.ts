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
