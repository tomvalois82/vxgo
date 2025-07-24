
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useUpdateLead = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateLead = async (leadId: number, field: string, value: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('lead')
        .update({ [field]: value })
        .eq('id', leadId);

      if (error) {
        console.error(`Error updating lead ${field}:`, error);
        toast({
          title: 'Erro',
          description: `Não foi possível atualizar o ${field === 'nome' ? 'nome' : 'interesse'}`,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Sucesso',
        description: `${field === 'nome' ? 'Nome' : 'Interesse'} atualizado com sucesso`,
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['followup'] });

      return true;
    } catch (error) {
      console.error(`Error in updateLead ${field}:`, error);
      toast({
        title: 'Erro',
        description: `Erro inesperado ao atualizar o ${field === 'nome' ? 'nome' : 'interesse'}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateLead,
    isLoading,
  };
};
