
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockVehicle } from '@/lib/crmTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useUserStockVehicles = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [userStockVehicles, setUserStockVehicles] = useState<StockVehicle[]>([]);
  const [isUserStockLoading, setIsUserStockLoading] = useState(false);

  const fetchUserStockVehicles = useCallback(async () => {
    if (!profile?.tbEstoque) {
      setUserStockVehicles([]);
      setIsUserStockLoading(false);
      return;
    }
    setIsUserStockLoading(true);
    try {
      const { data: stockData, error: stockError } = await supabase
        .from(profile.tbEstoque as any) // Ensure tbEstoque is a valid table name
        .select('id, modelo, fabricante')
        .eq('status', 'Em estoque');

      if (stockError) {
        console.error(`Error fetching stock vehicles from ${profile.tbEstoque}:`, stockError);
        setUserStockVehicles([]);
      } else if (stockData && Array.isArray(stockData)) {
        function isStockVehicle(item: any): item is StockVehicle {
          return (
            item &&
            typeof item === 'object' &&
            !('error' in item) &&
            typeof item.id === 'number' &&
            ('modelo' in item || item.modelo === null) &&
            ('fabricante' in item || item.fabricante === null)
          );
        }
        const validVehicles = stockData.filter(isStockVehicle);
        setUserStockVehicles(validVehicles);
      } else {
        setUserStockVehicles([]);
      }
    } catch (error: any) {
      console.error(`Error fetching stock vehicles from ${profile.tbEstoque}:`, error);
      setUserStockVehicles([]);
      toast({
        title: 'Erro ao carregar veículos do estoque',
        description: `Não foi possível carregar veículos da tabela ${profile.tbEstoque}. Detalhe: ${error.message}`,
        variant: 'default',
      });
    } finally {
      setIsUserStockLoading(false);
    }
  }, [profile?.tbEstoque, toast]);

  useEffect(() => {
    if (profile?.id && profile.tbEstoque) { // Ensure profile is loaded before fetching
      fetchUserStockVehicles();
    } else if (profile?.id && !profile.tbEstoque) {
      setUserStockVehicles([]);
      setIsUserStockLoading(false);
    }
  }, [profile?.id, profile?.tbEstoque, fetchUserStockVehicles]);

  return {
    userStockVehicles,
    isUserStockLoading,
    refetchUserStockVehicles: fetchUserStockVehicles,
  };
};
