
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useUpdateProximoFollowup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProximoFollowup = async (leadId: number, proximoFollowup: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('lead')
        .update({ proximofolowup: proximoFollowup })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead proximofolowup:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o próximo followup',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Followup atualizado',
        description: 'Próximo followup foi atualizado com sucesso',
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['followup'] });

      return true;
    } catch (error) {
      console.error('Error in updateProximoFollowup:', error);
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

  const setToNow = async (leadId: number) => {
    const now = new Date().toISOString();
    return await updateProximoFollowup(leadId, now);
  };

  const addTime = async (leadId: number, currentDate: string, additionalTime: string) => {
    try {
      // Parse the additional time (HH:MM:SS format)
      const [hours, minutes, seconds] = additionalTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        toast({
          title: 'Erro',
          description: 'Formato de tempo inválido. Use HH:MM:SS',
          variant: 'destructive',
        });
        return false;
      }

      // Calculate new date
      const currentDateTime = new Date(currentDate);
      currentDateTime.setHours(currentDateTime.getHours() + hours);
      currentDateTime.setMinutes(currentDateTime.getMinutes() + minutes);
      currentDateTime.setSeconds(currentDateTime.getSeconds() + seconds);

      return await updateProximoFollowup(leadId, currentDateTime.toISOString());
    } catch (error) {
      console.error('Error adding time:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao calcular novo horário',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    setToNow,
    addTime,
    isLoading,
  };
};
