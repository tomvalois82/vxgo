
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast'; // Updated import path for shadcn toast
import type { StockVehicle } from '@/lib/types'; // Assuming StockVehicle is defined here

// Type guard to check if the data is an array of StockVehicle
// This ensures that 'id', 'modelo', and 'fabricante' are present as per the error message
function isStockVehicleArray(data: any): data is StockVehicle[] {
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
      setIsLoading(false); // Ensure loading is set to false
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from(profile.tbEstoque)
        .select('*')
        .eq('uid', user.id);

      if (error) {
        throw error;
      }

      // Line 42 (approximately) would be the setVehicles call.
      // The fix is to use the type guard before setting state.
      if (data && isStockVehicleArray(data)) {
        setVehicles(data);
      } else if (data) {
        // Data is present but not in the expected format
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
  }, [user, profile]); // Removed tbEstoque from dependency array as it's part of profile

  useEffect(() => {
    fetchUserStock();
  }, [fetchUserStock]);

  return { vehicles, isLoadingUserStock: isLoading, refetchUserStock: fetchUserStock };
}
