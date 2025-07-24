
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useUpdateFollowup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateFollowup = async (leadId: number, followupValue: number) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('lead')
        .update({ folowup: followupValue })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead followup:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a mensagem de followup',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Followup atualizado',
        description: `Mensagem de followup alterada para ${followupValue}`,
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['followup'] });

      return true;
    } catch (error) {
      console.error('Error in updateFollowup:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar o followup',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateFollowup,
    isLoading,
  };
};
