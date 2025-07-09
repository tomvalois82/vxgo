
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

export interface DashboardLeadsData {
  total: number;
  dailyData: Array<{
    date: string;
    count: number;
  }>;
}

export const useDashboardLeadsData = (startDate: Date, endDate: Date) => {
  const { profile, isLoading: authLoading } = useAuth();

  const fetchLeadsData = async (): Promise<DashboardLeadsData> => {
    if (!profile || !profile.config) {
      return { total: 0, dailyData: [] };
    }

    const startDateString = format(startDate, 'yyyy-MM-dd');
    const endDateString = format(endDate, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('lead')
      .select('created_at')
      .eq('config', profile.config)
      .gte('created_at', startDateString)
      .lte('created_at', endDateString + 'T23:59:59.999Z')
      .not('nome', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching leads data:', error);
      throw new Error(error.message);
    }

    // Agrupar leads por data
    const dailyData: { [key: string]: number } = {};
    
    data?.forEach((lead) => {
      const date = format(parseISO(lead.created_at), 'yyyy-MM-dd');
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    const dailyDataArray = Object.entries(dailyData).map(([date, count]) => ({
      date: format(parseISO(date), 'dd/MM'),
      count,
    }));

    return {
      total: data?.length || 0,
      dailyData: dailyDataArray,
    };
  };

  return useQuery<DashboardLeadsData, Error>({
    queryKey: ['dashboard-leads', profile?.config, startDate, endDate],
    queryFn: fetchLeadsData,
    enabled: !authLoading && !!profile && !!profile.config,
  });
};
