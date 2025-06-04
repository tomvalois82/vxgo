
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useToggleLeadAutomation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleAutomation = async (leadId: number, currentStopValue: boolean) => {
    setIsLoading(true);
    
    try {
      const newStopValue = !currentStopValue;
      
      const { error } = await supabase
        .from('lead')
        .update({ stop: newStopValue })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead automation:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível alterar o status da automação',
          variant: 'destructive',
        });
        return false;
      }

      const actionText = newStopValue ? 'pausada' : 'liberada';
      toast({
        title: 'Automação alterada',
        description: `Automação ${actionText} para este cliente`,
      });

      return true;
    } catch (error) {
      console.error('Error in toggleAutomation:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao alterar a automação',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleAutomation,
    isLoading,
  };
};
