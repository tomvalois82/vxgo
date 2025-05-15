
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
  idOlx?: string; // Novo campo
  createdAt: Date;
  updatedAt: Date;
}

export type CarFormData = Omit<Car, 'id' | 'createdAt' | 'updatedAt'>;

