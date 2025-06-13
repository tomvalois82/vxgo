
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useDashboardStockData = () => {
  const { profile, isLoading: authLoading } = useAuth();

  const fetchStockData = async () => {
    if (!profile || !profile.tbEstoque) {
      return { total: 0 };
    }

    const { count, error } = await (supabase as any)
      .from(profile.tbEstoque)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching stock data:', error);
      throw new Error(error.message);
    }

    return { total: count || 0 };
  };

  return useQuery({
    queryKey: ['dashboard-stock', profile?.tbEstoque],
    queryFn: fetchStockData,
    enabled: !authLoading && !!profile && !!profile.tbEstoque,
  });
};
