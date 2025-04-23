
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
  fuelType: string;
  transmission: string;
  inStock: boolean;
  image?: string;
  description?: string;
  fotos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type CarFormData = Omit<Car, 'id' | 'createdAt' | 'updatedAt'>;
