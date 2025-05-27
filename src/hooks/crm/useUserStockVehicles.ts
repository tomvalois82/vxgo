
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js'; // Added this import
import type { Database } from '@/integrations/supabase/types'; // Import Database type
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { StockVehicle } from '@/lib/types'; // StockVehicle type should now be found

// Type guard to check if the data is an array of StockVehicle
// This ensures that 'id', 'modelo', and 'fabricante' are present
function isStockVehicleArray(data: any): data is StockVehicle[] {
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    typeof item === 'object' && item !== null &&
    'id' in item &&
    'modelo' in item && // modelo can be null, 'in' operator checks for presence
    'fabricante' in item // fabricante can be null, 'in' operator checks for presence
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
      // Cast profile.tbEstoque to a valid table name type for Supabase
      const tableName = profile.tbEstoque as keyof Database['public']['Tables'];
      
      // Type assertion added to the awaited expression to help TypeScript resolve complex types
      const { data, error } = (await supabase
        .from(tableName)
        .select('*')
        .eq('uid', user.id)) as { data: StockVehicle[] | null; error: PostgrestError | null };

      if (error) {
        throw error;
      }

      if (data && isStockVehicleArray(data)) {
        setVehicles(data);
      } else if (data) {
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
