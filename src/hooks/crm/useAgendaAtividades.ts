import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Atividade } from './useAtividades';

export function useAgendaAtividades(selectedDate: Date) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const dateStr = selectedDate.toISOString().slice(0, 10);

  const query = useQuery<Atividade[]>({
    queryKey: ['agenda-atividades', dateStr, profile?.config],
    queryFn: async () => {
      if (!profile?.config) return [];

      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;

      const { data, error } = await supabase
        .from('atividade')
        .select('*')
        .gte('data_hora', startOfDay)
        .lte('data_hora', endOfDay)
        .order('data_hora', { ascending: true });

      if (error) throw error;
      return (data || []) as Atividade[];
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
