
import { useQuery } from "@tanstack/react-query";

export type VehicleType = "carros" | "motos" | "caminhoes";

interface FipeBrand {
  codigo: string;
  nome: string;
}

async function fetchFipeBrands(type: VehicleType): Promise<FipeBrand[]> {
  const response = await fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas`);
  if (!response.ok) {
    throw new Error('Erro ao buscar marcas');
  }
  return response.json();
}

export function useFipeBrands(type: VehicleType | null) {
  return useQuery({
    queryKey: ['fipe-brands', type],
    queryFn: () => type ? fetchFipeBrands(type) : Promise.resolve([]),
    enabled: !!type,
  });
}
