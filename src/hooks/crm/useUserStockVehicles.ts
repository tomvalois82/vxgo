
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
      
      // Explicitly cast the result of the Supabase query.
      // We cast `data` to `any` to prevent deep type instantiation errors.
      // The `isStockVehicleArray` type guard will then ensure type safety.
      const { data: rawData, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('uid', user.id) as { data: any; error: PostgrestError | null };

      if (error) {
        throw error;
      }

      // Use the type guard to narrow down rawData (which is 'any' at this point)
      if (isStockVehicleArray(rawData)) {
        // Inside this block, rawData is confirmed to be StockVehicle[]
        setVehicles(rawData);
      } else if (rawData !== null && rawData !== undefined) { 
        // rawData is not null/undefined, but not in the expected format
        console.warn('Fetched stock data is not in expected StockVehicle[] format:', rawData);
        toast({ title: 'Aviso', description: 'Dados do estoque em formato inesperado.', variant: 'default' });
        setVehicles([]);
      } else { 
        // rawData is null or undefined
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
