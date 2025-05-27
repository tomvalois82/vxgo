
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
      
      // Using any to bypass deep type instantiation
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('uid', user.id);

      if (error) {
        throw error;
      }

      // Use the type guard to narrow down the data
      if (isStockVehicleArray(data)) {
        setVehicles(data);
      } else if (data !== null && data !== undefined) { 
        console.warn('Fetched stock data is not in expected StockVehicle[] format:', data);
        toast({ title: 'Aviso', description: 'Dados do estoque em formato inesperado.', variant: 'default' });
        setVehicles([]);
      } else { 
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
