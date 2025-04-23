
import { z } from 'zod';
import { currentYear } from './formConstants';

export const carFormSchema = z.object({
  vehicleType: z.enum(['carros', 'motos', 'caminhoes'] as const),
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  year: z.coerce.number().int().min(1950).max(currentYear + 1),
  manufacturingYear: z.coerce.number().int().min(1950).max(currentYear + 1),
  price: z.coerce.number().positive('Preço deve ser um valor positivo'),
  color: z.string().min(1, 'Cor é obrigatória'),
  mileage: z.coerce.number().min(0, 'Quilometragem não pode ser negativa'),
  fuelType: z.string().min(1, 'Tipo de combustível é obrigatório'),
  transmission: z.string().min(1, 'Tipo de transmissão é obrigatório'),
  inStock: z.boolean().default(true),
  description: z.string().optional(),
  characteristics: z.string().optional(),
  video: z.string().optional(),
  cautionReport: z.string().optional(),
  technicalSheet: z.string().optional(),
  warranty: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  image: z.string().optional(),
});

export type CarFormSchema = z.infer<typeof carFormSchema>;
