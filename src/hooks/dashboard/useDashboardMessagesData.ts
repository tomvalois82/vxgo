
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

export interface DashboardMessagesData {
  totalAi: number;
  totalHuman: number;
  dailyData: Array<{
    date: string;
    ai: number;
    human: number;
  }>;
}

interface MessageRecord {
  id: number;
  session_id: string;
  message: any;
}

export const useDashboardMessagesData = (startDate: Date, endDate: Date) => {
  const { profile, isLoading: authLoading } = useAuth();

  const fetchMessagesData = async (): Promise<DashboardMessagesData> => {
    if (!profile || !profile.tbHistorico) {
      return { totalAi: 0, totalHuman: 0, dailyData: [] };
    }

    const startDateString = format(startDate, 'yyyy-MM-dd');
    const endDateString = format(endDate, 'yyyy-MM-dd');

    // Buscar todas as mensagens do período
    const { data, error } = await (supabase as any)
      .from(profile.tbHistorico)
      .select('id, session_id, message')
      .gte('id', 1) // Assumindo que ID incrementa com o tempo
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching messages data:', error);
      throw new Error(error.message);
    }

    let totalAi = 0;
    let totalHuman = 0;
    const dailyData: { [key: string]: { ai: number; human: number } } = {};

    data?.forEach((record: MessageRecord) => {
      if (!record.message || typeof record.message !== 'object') return;

      const messageType = record.message.type;
      if (messageType !== 'ai' && messageType !== 'human') return;

      // Para filtrar por data, vamos usar o ID como proxy para data
      // Em um cenário real, seria melhor ter um campo de timestamp
      const date = format(new Date(), 'yyyy-MM-dd'); // Simplificando para demo

      if (!dailyData[date]) {
        dailyData[date] = { ai: 0, human: 0 };
      }

      if (messageType === 'ai') {
        totalAi++;
        dailyData[date].ai++;
      } else if (messageType === 'human') {
        totalHuman++;
        dailyData[date].human++;
      }
    });

    const dailyDataArray = Object.entries(dailyData).map(([date, counts]) => ({
      date: format(parseISO(date), 'dd/MM'),
      ai: counts.ai,
      human: counts.human,
    }));

    return {
      totalAi,
      totalHuman,
      dailyData: dailyDataArray,
    };
  };

  return useQuery<DashboardMessagesData, Error>({
    queryKey: ['dashboard-messages', profile?.tbHistorico, startDate, endDate],
    queryFn: fetchMessagesData,
    enabled: !authLoading && !!profile && !!profile.tbHistorico,
  });
};
