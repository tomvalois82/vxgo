
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast'; // Assuming this is the correct path for use-toast
import type { StockVehicle } from '@/lib/types';
import type { Database } from '@/integrations/supabase/types';


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
      const tableName = profile.tbEstoque as string; // Explicitly type as string

      // Explicitly list all fields from StockVehicle type to help with type inference
      const columnsToSelect = 'id, modelo, fabricante, ano, ano_fabricacao, cambio, caracteristicas, categoria, cautelar, config, cor, created_at, ficha_tecnica, foto, fotos, garantia, idEstoqueBubble, idOlx, km, motor, observacao, status, tipo_veiculo, uid, usuario, valor, video';
      
      const { data, error } = await supabase
        .from(tableName)
        .select(columnsToSelect)
        .eq('uid', user.id);

      if (error) {
        throw error;
      }

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

