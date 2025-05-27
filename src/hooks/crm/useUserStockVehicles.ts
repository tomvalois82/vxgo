
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
// A importação do tipo Database é feita implicitamente pelo client do Supabase ou deve vir de um local único.
// Removendo importações duplicadas ou redefinições locais se houver.
// Se 'Database' for de 'src/integrations/supabase/types.ts', certifique-se de que está correto.
// import { Database } from '@/integrations/supabase/types'; // Removido se for duplicado ou causar conflito

// Definindo um tipo mais específico para o retorno dos veículos, se necessário,
// ou confiando na inferência de tipo do Supabase.
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
      // console.log('Profile or tbEstoque not available');
      return [];
    }

    // console.log(`Fetching vehicles from table: ${profile.tbEstoque}`);

    // A lista de colunas a serem selecionadas.
    const selectColumns = 'id, nome, marca, modelo, ano_modelo, valor, vendido, placa, created_at, km, renavam, cor, cidade_auto, cambio, combustivel, imagem_principal_url, todas_imagens_urls';

    const { data, error } = await supabase
      .from(profile.tbEstoque as string) // Cast para string para evitar erro de tipo se tbEstoque for um tipo mais restrito que não bate com o esperado pelo .from()
      .select(selectColumns);

    if (error) {
      console.error('Error fetching user stock vehicles:', error);
      throw new Error(error.message);
    }
    // console.log('Fetched vehicles:', data);
    return data as Vehicle[]; // Fazendo um cast para o tipo Vehicle[]
  };

  return useQuery<Vehicle[], Error>({
    queryKey: ['userStockVehicles', profile?.tbEstoque],
    queryFn: fetchUserStockVehicles,
    enabled: !authLoading && !!profile && !!profile.tbEstoque,
    // staleTime: 1000 * 60 * 5, // 5 minutes
    // cacheTime: 1000 * 60 * 10, // 10 minutes
  });
};
