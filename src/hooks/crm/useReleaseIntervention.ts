
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useReleaseIntervention = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const releaseInterventionMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const { error } = await supabase
        .from('lead')
        .update({ intervencao: null })
        .eq('id', leadId);

      if (error) {
        throw new Error(error.message);
      }
      
      return leadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "Atendimento liberado",
        description: "A IA pode retomar o atendimento automaticamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao liberar atendimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    releaseIntervention: releaseInterventionMutation.mutateAsync,
    isLoading: releaseInterventionMutation.isPending,
  };
};
