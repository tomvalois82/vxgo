
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { StockVehicle } from '@/lib/types';

// Type guard to check if the data is an array of StockVehicle
function isStockVehicleArray(data: unknown): data is StockVehicle[] {
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    typeof item === 'object' && item !== null &&
    'id' in item &&
    'modelo' in item && 
    'fabricante' in item 
  );
}

export function useUserStockVehicles() {
  const { user, profile } = useAuth();
  const [vehicles, setVehicles] = useState<StockVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserStock = useCallback(async () => {
    if (!user || !profile || !profile.tbEstoque) {
      setVehicles([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const tableName = profile.tbEstoque as keyof Database['public']['Tables'];
      
      // Remove the explicit cast on the await supabase call
      // Let Supabase infer the type for rawData and error
      const { data: rawData, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('uid', user.id);

      if (error) {
        throw error;
      }

      // Use the type guard to narrow down rawData
      if (rawData && isStockVehicleArray(rawData)) {
        setVehicles(rawData);
      } else if (rawData) { // rawData is not null, but not in the expected format
        console.warn('Fetched stock data is not in expected StockVehicle[] format:', rawData);
        toast({ title: 'Aviso', description: 'Dados do estoque em formato inesperado.', variant: 'default' });
        setVehicles([]);
      } else { // rawData is null
        setVehicles([]);
      }
    } catch (error: any) {
      console.error('Error fetching user stock:', error);
      toast({ title: 'Erro ao buscar estoque', description: error.message, variant: 'destructive' });
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchUserStock();
  }, [fetchUserStock]);

  return { vehicles, isLoadingUserStock: isLoading, refetchUserStock: fetchUserStock };
}
