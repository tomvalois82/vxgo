
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Definindo um tipo mais específico para o retorno dos veículos
export interface Vehicle {
  id: number;
  fabricante: string | null;
  modelo: string | null;
  ano: string | null;
  ano_fabricacao: string | null;
  valor: string | null;
  placa: string | null;
  created_at: string | null;
  km: string | null;
  cor: string | null;
  cambio: string | null;
  motor: string | null;
  foto: string | null;
  fotos: string[] | null;
  status: string | null;
  categoria: string | null;
}

export const useUserStockVehicles = () => {
  const { profile, isLoading: authLoading } = useAuth();

  const fetchUserStockVehicles = async () => {
    if (!profile || !profile.tbEstoque) {
      return [];
    }

    // A lista de colunas a serem selecionadas.
    const selectColumns = 'id, fabricante, modelo, ano, ano_fabricacao, valor, placa, created_at, km, cor, cambio, motor, foto, fotos, status, categoria';

    // Using any to bypass TypeScript strict typing for dynamic table names
    const { data, error } = await (supabase as any)
      .from(profile.tbEstoque)
      .select(selectColumns);

    if (error) {
      console.error('Error fetching user stock vehicles:', error);
      throw new Error(error.message);
    }
    return data as Vehicle[]; // Fazendo um cast para o tipo Vehicle[]
  };

  return useQuery<Vehicle[], Error>({
    queryKey: ['userStockVehicles', profile?.tbEstoque],
    queryFn: fetchUserStockVehicles,
    enabled: !authLoading && !!profile && !!profile.tbEstoque,
  });
};
