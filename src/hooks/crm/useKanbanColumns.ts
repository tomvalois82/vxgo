
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KanbanColumnData } from '@/lib/crmTypes';
import { useToast } from '@/components/ui/use-toast';

export const useKanbanColumns = () => {
  const { toast } = useToast();
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumnData[]>([]);
  const [isLoadingKanbanColumns, setIsLoadingKanbanColumns] = useState(true);

  const fetchKanbanColumns = useCallback(async () => {
    setIsLoadingKanbanColumns(true);
    try {
      const { data, error } = await supabase
        .from('kanban')
        .select('id, descricao, posicao, created_at')
        .order('posicao', { ascending: true });

      if (error) throw error;
      setKanbanColumns(data || []);
    } catch (error: any) {
      console.error('Error fetching Kanban columns:', error);
      toast({
        title: 'Erro ao carregar colunas Kanban',
        description: error.message,
        variant: 'destructive',
      });
      setKanbanColumns([]);
    } finally {
      setIsLoadingKanbanColumns(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKanbanColumns();
  }, [fetchKanbanColumns]);

  return {
    kanbanColumns,
    isLoadingKanbanColumns,
    refetchKanbanColumns: fetchKanbanColumns,
  };
};
