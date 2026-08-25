import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface KanbanColumn {
  id: number;
  descricao: string | null;
  cor: string | null;
  posicao: number | null;
  padrao: boolean | null;
  visivel: boolean | null;
  created_at: string;
}

export interface Oportunidade {
  id: number;
  titulo: string | null;
  resumo: string | null;
  status: string | null;
  valor: number | null;
  id_kanban: number | null;
  id_lead: number | null;
  id_usuario: number | null;
  idEstoque: number | null;
  created_at: string;
  data_criacao: string | null;
  ultima_interacao: string | null;
  outro_interesse: string[] | null;
  lead?: { nome: string | null; telefone: string | null; Origem?: string | null } | null;
  estoque?: { modelo: string | null; fabricante: string | null } | null;
  usuario?: { id: number; nome: string | null; foto: string | null } | null;
}

export function useKanbanColumns(funilId?: number | null) {
  return useQuery({
    queryKey: ['kanban-columns', funilId],
    queryFn: async () => {
      if (!funilId) return [];
      const { data, error } = await supabase
        .from('kanban')
        .select('*')
        .eq('crm_funil', funilId)
        .order('posicao', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as KanbanColumn[];
    },
    enabled: !!funilId,
  });
}

export function useKanbanOportunidades() {
  return useQuery({
    queryKey: ['kanban-oportunidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opotunidade')
        .select('*, lead:id_lead(nome, telefone, Origem), usuario:id_usuario(id, nome, foto)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        lead: Array.isArray(d.lead) ? d.lead[0] ?? null : d.lead,
        usuario: Array.isArray(d.usuario) ? d.usuario[0] ?? null : d.usuario,
      })) as Oportunidade[];
    },
  });
}

export function useUpdateKanbanColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (column: Partial<KanbanColumn> & { id: number }) => {
      const { id, ...updates } = column;
      const { error } = await supabase
        .from('kanban')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar coluna', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreateKanbanColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (column: { descricao: string; cor: string; posicao: number; visivel: boolean; crm_funil?: number }) => {
      const { error } = await supabase
        .from('kanban')
        .insert({ ...column, padrao: false });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
      toast({ title: 'Coluna criada com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar coluna', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteKanbanColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Check if there are opportunities linked
      const { data: opps, error: checkError } = await supabase
        .from('opotunidade')
        .select('id')
        .eq('id_kanban', id)
        .limit(1);
      if (checkError) throw checkError;
      if (opps && opps.length > 0) {
        throw new Error('Não é possível excluir: existem oportunidades vinculadas a esta coluna.');
      }
      const { error } = await supabase.from('kanban').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
      toast({ title: 'Coluna excluída com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir coluna', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCreateOportunidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opp: {
      titulo?: string;
      resumo?: string;
      valor?: number | null;
      status?: string;
      obs?: string;
      id_kanban?: number;
      id_lead?: number;
      id_usuario?: number;
      idEstoque?: number | null;
    }) => {
      const { error } = await supabase
        .from('opotunidade')
        .insert({
          ...opp,
          data_criacao: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-oportunidades'] });
      toast({ title: 'Oportunidade criada com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar oportunidade', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMoveOportunidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, id_kanban }: { id: number; id_kanban: number }) => {
      const { data, error } = await supabase
        .from('opotunidade')
        .update({ id_kanban })
        .eq('id', id)
        .select('id, id_kanban')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Oportunidade não encontrada para mover.');
      return data;
    },
    onMutate: async ({ id, id_kanban }) => {
      await queryClient.cancelQueries({ queryKey: ['kanban-oportunidades'] });
      const oportunidadesAnteriores = queryClient.getQueryData<Oportunidade[]>(['kanban-oportunidades']);

      queryClient.setQueryData<Oportunidade[]>(['kanban-oportunidades'], (current) =>
        current?.map((opp) => (opp.id === id ? { ...opp, id_kanban } : opp)) ?? current,
      );

      return { oportunidadesAnteriores };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-oportunidades'] });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.oportunidadesAnteriores) {
        queryClient.setQueryData(['kanban-oportunidades'], context.oportunidadesAnteriores);
      }
      toast({ title: 'Erro ao mover oportunidade', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteOportunidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('opotunidade')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-oportunidades'] });
      toast({ title: 'Oportunidade excluída com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir oportunidade', description: error.message, variant: 'destructive' });
    },
  });
}

export function useBulkUpdateKanbanPositions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: number; posicao: number }[]) => {
      // Update each column position
      const promises = updates.map(({ id, posicao }) =>
        supabase.from('kanban').update({ posicao }).eq('id', id)
      );
      const results = await Promise.all(promises);
      const err = results.find(r => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao reordenar', description: error.message, variant: 'destructive' });
    },
  });
}
