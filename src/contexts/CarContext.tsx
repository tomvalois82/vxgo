import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CarFormData } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';
import { convertToWords, convertFromWords, formatCurrency } from '@/lib/formUtils';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  manufacturingYear: number;
  price: number;
  color: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  inStock: boolean;
  characteristics: string;
  fotos: string[];
  idanuncioolx: string[];
  video: string;
  cautionReport: string;
  technicalSheet: string;
  warranty: string;
  category: string;
  vehicleType: string;
}

interface CarContextType {
  cars: Car[];
  getCar: (id: string) => Car | undefined;
  addCar: (car: CarFormData & { fotos?: string[] }) => Promise<void>;
  updateCar: (id: string, car: CarFormData & { fotos?: string[] }) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  isLoading: boolean;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

export function CarProvider({ children }: { children: React.ReactNode }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    async function fetchCars() {
      if (!profile || !profile.tbEstoque) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from(profile.tbEstoque)
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          const typedCars = data.map(car => {
            let price = 0;
            if (typeof car.valor === 'string') {
              price = convertFromWords(car.valor);
            } else if (typeof car.valor === 'number') {
              price = car.valor;
            }
            
            return {
              id: car.id,
              brand: car.marca,
              model: car.modelo,
              year: car.ano_modelo,
              manufacturingYear: car.ano_fabricacao,
              price: price,
              color: car.cor,
              mileage: car.km,
              fuelType: car.combustivel,
              transmission: car.cambio,
              inStock: car.disponivel_estoque,
              characteristics: car.caracteristicas,
              fotos: car.fotos || [],
              idanuncioolx: car.idanuncioolx || [],
              video: car.video,
              cautionReport: car.cautelar,
              technicalSheet: car.ficha_tecnica,
              warranty: car.garantia,
              category: car.categoria,
              vehicleType: car.tipo_veiculo,
            } as Car;
          });
          setCars(typedCars);
        }
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar carros',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCars();
  }, [profile]);

  const getCar = (id: string): Car | undefined => {
    return cars.find((car) => car.id === id);
  };

  const addCar = async (car: CarFormData & { fotos?: string[] }) => {
    if (!profile || !profile.tbEstoque) {
      toast({
        title: 'Erro',
        description: 'Tabela de estoque não configurada.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const mappedCar = mapCarFormDataToSupabase(car);

      const { data, error } = await supabase
        .from(profile.tbEstoque)
        .insert([mappedCar])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newCar = data[0];
        setCars([...cars, {
          id: newCar.id,
          brand: newCar.marca,
          model: newCar.modelo,
          year: newCar.ano_modelo,
          manufacturingYear: newCar.ano_fabricacao,
          price: convertFromWords(newCar.valor),
          color: newCar.cor,
          mileage: newCar.km,
          fuelType: newCar.combustivel,
          transmission: newCar.cambio,
          inStock: newCar.disponivel_estoque,
          characteristics: newCar.caracteristicas,
          fotos: newCar.fotos || [],
          idanuncioolx: newCar.idanuncioolx || [],
          video: newCar.video,
          cautionReport: newCar.cautelar,
          technicalSheet: newCar.ficha_tecnica,
          warranty: newCar.garantia,
          category: newCar.categoria,
          vehicleType: newCar.tipo_veiculo,
        }]);
        toast({
          title: 'Carro adicionado',
          description: 'Carro adicionado com sucesso!',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar carro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateCar = async (id: string, car: CarFormData & { fotos?: string[] }) => {
    if (!profile || !profile.tbEstoque) {
      toast({
        title: 'Erro',
        description: 'Tabela de estoque não configurada.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const mappedCar = mapCarFormDataToSupabase(car);

      const { error } = await supabase
        .from(profile.tbEstoque)
        .update(mappedCar)
        .eq('id', id);

      if (error) {
        throw error;
      }

      setCars(
        cars.map((c) =>
          c.id === id
            ? {
              id: id,
              brand: car.brand,
              model: car.model,
              year: car.year,
              manufacturingYear: car.manufacturingYear,
              price: car.price,
              color: car.color,
              mileage: car.mileage,
              fuelType: car.fuelType,
              transmission: car.transmission,
              inStock: car.inStock,
              characteristics: car.characteristics,
              fotos: car.fotos || [],
              idanuncioolx: car.idanuncioolx || [],
              video: car.video,
              cautionReport: car.cautionReport,
              technicalSheet: car.technicalSheet,
              warranty: car.warranty,
              category: car.category,
              vehicleType: car.vehicleType,
            }
            : c
        )
      );
      toast({
        title: 'Carro atualizado',
        description: 'Carro atualizado com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar carro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteCar = async (id: string) => {
    if (!profile || !profile.tbEstoque) {
      toast({
        title: 'Erro',
        description: 'Tabela de estoque não configurada.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from(profile.tbEstoque)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setCars(cars.filter((car) => car.id !== id));
      toast({
        title: 'Carro removido',
        description: 'Carro removido com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover carro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const mapCarFormDataToSupabase = (formData: CarFormData): any => {
    return {
      marca: formData.brand,
      modelo: formData.model,
      ano_modelo: formData.year,
      ano_fabricacao: formData.manufacturingYear,
      valor: convertToWords(formData.price), // Save as words instead of formatted currency
      cor: formData.color,
      km: formData.mileage,
      combustivel: formData.fuelType,
      cambio: formData.transmission,
      disponivel_estoque: formData.inStock,
      caracteristicas: formData.characteristics,
      fotos: formData.fotos,
      idanuncioolx: formData.idanuncioolx,
      video: formData.video,
      cautelar: formData.cautionReport,
      ficha_tecnica: formData.technicalSheet,
      garantia: formData.warranty,
      categoria: formData.category,
      tipo_veiculo: formData.vehicleType,
    };
  };

  const value: CarContextType = {
    cars,
    getCar,
    addCar,
    updateCar,
    deleteCar,
    isLoading,
  };

  return <CarContext.Provider value={value}>{children}</CarContext.Provider>;
}

export function useCars() {
  const context = useContext(CarContext);
  if (!context) {
    throw new Error('useCars must be used within a CarProvider');
  }
  return context;
}
