
import { supabase } from '@/integrations/supabase/client';
import { ActivityData } from '@/lib/crmTypes';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';


export const useActivitiesData = () => {
  const { toast } = useToast();
  const { profile } = useAuth(); // For id_usuario if needed when adding activity

  const getActivitiesForOpportunity = async (opportunityId: number): Promise<ActivityData[]> => {
    try {
      const { data, error } = await supabase
        .from('atividade')
        .select('*')
        .eq('id_oportunidade', opportunityId)
        .order('data_hora', { ascending: false });
      if (error) throw error;
      return (data as ActivityData[]) || [];
    } catch (error: any) {
      toast({ title: 'Erro ao carregar atividades', description: error.message, variant: 'destructive' });
      return [];
    }
  };

  const addActivity = async (activity: Omit<ActivityData, 'id' | 'created_at'>): Promise<ActivityData | null> => {
     const activityPayload = { ...activity, id_usuario: activity.id_usuario || profile?.id };
    try {
      const { data, error } = await supabase
        .from('atividade')
        .insert([activityPayload])
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Atividade adicionada.' });
      return data as ActivityData;
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar atividade', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateActivity = async (activityId: number, updates: Partial<ActivityData>): Promise<boolean> => {
    try {
      const { error } = await supabase.from('atividade').update(updates).eq('id', activityId);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Atividade atualizada.' });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar atividade', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteActivity = async (activityId: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from('atividade').delete().eq('id', activityId);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Atividade excluída.' });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao excluir atividade', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  return {
    getActivitiesForOpportunity,
    addActivity,
    updateActivity,
    deleteActivity,
  };
};
