
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Definindo um tipo mais específico para o retorno dos veículos
export interface Vehicle {
  id: string; // ou number, dependendo do schema
  nome: string | null;
  marca: string | null;
  modelo: string | null;
  ano_modelo: number | null;
  valor: number | null;
  vendido: boolean | null;
  placa: string | null;
  created_at: string | null;
  km: number | null;
  renavam: string | null;
  cor: string | null;
  cidade_auto: string | null;
  cambio: string | null;
  combustivel: string | null;
  imagem_principal_url: string | null;
  todas_imagens_urls: string[] | null;
  // Adicione outros campos conforme necessário
}

export const useUserStockVehicles = () => {
  const { profile, isLoading: authLoading } = useAuth();

  const fetchUserStockVehicles = async () => {
    if (!profile || !profile.tbEstoque) {
      return [];
    }

    // A lista de colunas a serem selecionadas.
    const selectColumns = 'id, nome, marca, modelo, ano_modelo, valor, vendido, placa, created_at, km, renavam, cor, cidade_auto, cambio, combustivel, imagem_principal_url, todas_imagens_urls';

    // Usando any para contornar o problema de tipagem com tabelas dinâmicas
    const { data, error } = await supabase
      .from(profile.tbEstoque as string)
      .select(selectColumns) as { data: any[], error: any };

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
