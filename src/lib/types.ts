
export interface Car {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export type CarFormData = Omit<Car, 'id' | 'createdAt' | 'updatedAt'>;
