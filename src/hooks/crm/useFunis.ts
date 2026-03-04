import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CrmFunil {
  id: number;
  titulo: string | null;
  ativo: boolean | null;
  config: number | null;
  created_at: string;
}

export function useFunis() {
  const { profile } = useAuth();
  const configId = profile?.config;

  return useQuery({
    queryKey: ['crm-funis', configId],
    queryFn: async () => {
      if (!configId) return [];
      const { data, error } = await supabase
        .from('crm_funil')
        .select('*')
        .eq('config', configId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CrmFunil[];
    },
    enabled: !!configId,
  });
}

export function useActiveFunis() {
  const { profile } = useAuth();
  const configId = profile?.config;

  return useQuery({
    queryKey: ['crm-funis-active', configId],
    queryFn: async () => {
      if (!configId) return [];
      const { data, error } = await supabase
        .from('crm_funil')
        .select('*')
        .eq('config', configId)
        .eq('ativo', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CrmFunil[];
    },
    enabled: !!configId,
  });
}

export function useCreateFunil() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (titulo: string) => {
      if (!profile?.config) throw new Error('Config não encontrada');
      const { error } = await supabase
        .from('crm_funil')
        .insert({ titulo, ativo: true, config: profile.config });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-funis'] });
      queryClient.invalidateQueries({ queryKey: ['crm-funis-active'] });
      toast({ title: 'Funil criado com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar funil', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateFunil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmFunil> & { id: number }) => {
      const { error } = await supabase
        .from('crm_funil')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-funis'] });
      queryClient.invalidateQueries({ queryKey: ['crm-funis-active'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar funil', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteFunil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // Check if any kanban column of this funnel has opportunities
      const { data: kanbanCols, error: colError } = await supabase
        .from('kanban')
        .select('id')
        .eq('crm_funil', id);
      if (colError) throw colError;

      if (kanbanCols && kanbanCols.length > 0) {
        const colIds = kanbanCols.map(c => c.id);
        const { data: opps, error: oppError } = await supabase
          .from('opotunidade')
          .select('id')
          .in('id_kanban', colIds)
          .limit(1);
        if (oppError) throw oppError;
        if (opps && opps.length > 0) {
          throw new Error('Não é possível excluir: existem oportunidades vinculadas a etapas deste funil.');
        }
      }

      // Delete kanban columns first
      if (kanbanCols && kanbanCols.length > 0) {
        const { error: delColError } = await supabase
          .from('kanban')
          .delete()
          .eq('crm_funil', id);
        if (delColError) throw delColError;
      }

      const { error } = await supabase
        .from('crm_funil')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-funis'] });
      queryClient.invalidateQueries({ queryKey: ['crm-funis-active'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
      toast({ title: 'Funil excluído com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir funil', description: error.message, variant: 'destructive' });
    },
  });
}
