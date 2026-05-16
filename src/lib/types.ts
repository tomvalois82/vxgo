
import { VehicleType } from "@/hooks/useFipeBrands";

export interface Car {
  id: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: number;
  price: number;
  color: string;
  mileage: number;
  fuelType: string; // motor
  transmission: string; // cambio
  inStock: boolean;
  image?: string; // This will be removed from the form but kept in type for backward compatibility
  description?: string; // observacao
  characteristics?: string; // caracteristica
  video?: string;
  warranty?: string; // garantia
  technicalSheet?: string; // ficha_tecnica
  cautionReport?: string; // cautelar
  category?: string;
  manufacturingYear?: number; // ano_fabricacao
  fotos?: string[];
  idanuncioolx?: string[]; // Novo campo array
  pgCapa?: string[];
  pgCaixa1?: string;
  pgCaixa2?: string;
  pgCaixa3?: string;
  pgCaixa4?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CarFormData = Omit<Car, 'id' | 'createdAt' | 'updatedAt'>;

export interface StockVehicle {
  id: number; // From 'estoque' table, 'id' is typically a number (bigint)
  modelo: string | null;
  fabricante: string | null;
  ano?: string | null;
  ano_fabricacao?: string | null;
  cambio?: string | null;
  caracteristicas?: string | null;
  categoria?: string | null;
  cautelar?: string | null;
  config?: number | null;
  cor?: string | null;
  created_at?: string; // timestamp with time zone
  ficha_tecnica?: string | null;
  foto?: string | null;
  fotos?: string[] | null;
  garantia?: string | null;
  idEstoqueBubble?: string | null;
  idanuncioolx?: string[] | null; // Novo campo array
  km?: string | null;
  motor?: string | null;
  observacao?: string | null;
  status?: string | null;
  tipo_veiculo?: string | null;
  uid?: string | null; // This is the user's auth ID, not the vehicle's primary key in some contexts
  usuario?: number | null;
  valor?: string | null;
  video?: string | null;
}
