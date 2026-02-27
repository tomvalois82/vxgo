import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ConfigUser {
  id: number;
  nome: string | null;
}

export function useConfigUsers() {
  const { profile, isLoading: authLoading } = useAuth();

  return useQuery<ConfigUser[]>({
    queryKey: ['config-users', profile?.config],
    queryFn: async () => {
      if (!profile?.config) return [];
      const { data, error } = await supabase
        .from('usuario')
        .select('id, nome')
        .eq('config', profile.config)
        .eq('ativo', true);
      if (error) throw error;
      return (data || []) as ConfigUser[];
    },
    enabled: !authLoading && !!profile?.config,
  });
}
