
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FollowupLead {
  id: number;
  nome: string | null;
  Origem: string | null;
  session_id_whatsaap: string | null;
  session_id_olx: string | null;
  intervencao: string | null;
  stop: boolean | null;
  folowup: number | null;
  proximofolowup: string | null;
  config: number | null;
}

export const useFollowup = () => {
  const { profile, isLoading: authLoading } = useAuth();

  const fetchFollowupData = async () => {
    if (!profile || !profile.config) {
      return [];
    }

    const { data, error } = await supabase
      .from('lead')
      .select('id, nome, Origem, session_id_whatsaap, session_id_olx, intervencao, stop, folowup, proximofolowup, config')
      .eq('config', profile.config)
      .order('proximofolowup', { ascending: true });

    if (error) {
      console.error('Error fetching followup data:', error);
      throw new Error(error.message);
    }

    return data as FollowupLead[];
  };

  return useQuery<FollowupLead[], Error>({
    queryKey: ['followup', profile?.config],
    queryFn: fetchFollowupData,
    enabled: !authLoading && !!profile && !!profile.config,
  });
};
