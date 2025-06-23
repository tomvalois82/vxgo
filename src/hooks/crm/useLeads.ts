
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Lead {
  id: number;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  session_id_whatsaap: string | null;
  session_id_olx: string | null;
  interesse: string | null;
  Origem: string | null;
  created_at: string;
  config: number | null;
  idUsuario: number | null;
  intervencao: string | null;
  stop: boolean | null;
}

export const useLeads = (searchTerm?: string) => {
  const { profile, isLoading: authLoading } = useAuth();

  const fetchLeads = async () => {
    if (!profile || !profile.config) {
      return [];
    }

    let query = supabase
      .from('lead')
      .select('*')
      .eq('config', profile.config);

    // Apply search filter if searchTerm is provided
    if (searchTerm && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(`nome.ilike.${term},telefone.ilike.${term},session_id_whatsaap.ilike.${term}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      throw new Error(error.message);
    }

    return data as Lead[];
  };

  return useQuery<Lead[], Error>({
    queryKey: ['leads', profile?.config, searchTerm],
    queryFn: fetchLeads,
    enabled: !authLoading && !!profile && !!profile.config,
  });
};
