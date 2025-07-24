
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FollowupLead {
  id: number;
  nome: string | null;
  telefone: string | null;
  Origem: string | null;
  session_id_whatsaap: string | null;
  session_id_olx: string | null;
  intervencao: string | null;
  stop: boolean | null;
  folowup: number | null;
  proximofolowup: string | null;
  config: number | null;
}

interface UseFollowupOptions {
  searchTerm?: string;
  showActiveOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';
}

interface FollowupResult {
  data: FollowupLead[];
  count: number;
  maxFollowupMessages: number;
}

export const useFollowup = (options: UseFollowupOptions = {}) => {
  const { profile, isLoading: authLoading } = useAuth();
  const { searchTerm, showActiveOnly = false, page = 1, pageSize = 50, sortOrder = 'asc' } = options;

  const fetchFollowupData = async (): Promise<FollowupResult> => {
    if (!profile || !profile.config) {
      return { data: [], count: 0, maxFollowupMessages: 0 };
    }

    // First, get the config data to know the max number of followup messages
    const { data: configData, error: configError } = await supabase
      .from('config')
      .select('*')
      .eq('id', profile.config)
      .single();

    if (configError) {
      console.error('Error fetching config data:', configError);
      throw new Error(configError.message);
    }

    // Calculate max followup messages from the mensagens_folowup field
    let maxFollowupMessages = 0;
    if (configData && (configData as any).mensagens_folowup) {
      if (Array.isArray((configData as any).mensagens_folowup)) {
        maxFollowupMessages = (configData as any).mensagens_folowup.length;
      }
    }

    // Then get the leads data
    let query = supabase
      .from('lead')
      .select('id, nome, telefone, Origem, session_id_whatsaap, session_id_olx, intervencao, stop, folowup, proximofolowup, config', { count: 'exact' })
      .eq('config', profile.config);

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(`nome.ilike.${term},telefone.ilike.${term},session_id_whatsaap.ilike.${term},session_id_olx.ilike.${term}`);
    }

    // Apply active followup filter
    if (showActiveOnly) {
      query = query.gte('proximofolowup', new Date().toISOString());
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Order by proximofolowup
    query = query.order('proximofolowup', { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching followup data:', error);
      throw new Error(error.message);
    }

    return { 
      data: data as FollowupLead[], 
      count: count || 0, 
      maxFollowupMessages 
    };
  };

  return useQuery<FollowupResult, Error>({
    queryKey: ['followup', profile?.config, searchTerm, showActiveOnly, page, pageSize, sortOrder],
    queryFn: fetchFollowupData,
    enabled: !authLoading && !!profile && !!profile.config,
  });
};
