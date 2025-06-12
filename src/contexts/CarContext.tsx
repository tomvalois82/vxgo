
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CarFormData } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';
import { convertToWords, convertFromWords } from '@/lib/formUtils';
import { VehicleType } from '@/hooks/useFipeBrands';

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
  vehicleType: VehicleType;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CarContextType {
  cars: Car[];
  filteredCars: Car[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  getCar: (id: string) => Car | undefined;
  addCar: (car: CarFormData & { fotos?: string[] }) => Promise<void>;
  updateCar: (id: string, car: CarFormData & { fotos?: string[] }) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  isLoading: boolean;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

export function CarProvider({ children }: { children: React.ReactNode }) {
  const [cars, setCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  // Filter cars based on search term
  const filteredCars = cars.filter(car => 
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.year.toString().includes(searchTerm)
  );

  useEffect(() => {
    async function fetchCars() {
      if (!profile || !profile.tbEstoque) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from(profile.tbEstoque as any)
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          const typedCars = data.map((car: any) => {
            let price = 0;
            if (typeof car.valor === 'string') {
              price = convertFromWords(car.valor);
            } else if (typeof car.valor === 'number') {
              price = car.valor;
            }
            
            // Ensure vehicleType is properly typed
            let vehicleType: VehicleType = 'carros';
            if (car.tipo_veiculo === 'motos' || car.tipo_veiculo === 'caminhoes') {
              vehicleType = car.tipo_veiculo;
            }
            
            return {
              id: car.id.toString(),
              brand: car.marca || car.fabricante || '',
              model: car.modelo || '',
              year: parseInt(car.ano_modelo || car.ano || '0'),
              manufacturingYear: parseInt(car.ano_fabricacao || '0'),
              price: price,
              color: car.cor || '',
              mileage: parseInt(car.km || '0'),
              fuelType: car.combustivel || car.motor || '',
              transmission: car.cambio || '',
              inStock: car.disponivel_estoque !== false,
              characteristics: car.caracteristicas || '',
              fotos: car.fotos || [],
              idanuncioolx: car.idanuncioolx || [],
              video: car.video || '',
              cautionReport: car.cautelar || '',
              technicalSheet: car.ficha_tecnica || '',
              warranty: car.garantia || '',
              category: car.categoria || '',
              vehicleType: vehicleType,
              image: car.foto,
              description: car.observacao,
              createdAt: new Date(car.created_at),
              updatedAt: new Date(car.created_at),
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
        .from(profile.tbEstoque as any)
        .insert([mappedCar])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newCar = data[0];
        let vehicleType: VehicleType = 'carros';
        if (newCar.tipo_veiculo === 'motos' || newCar.tipo_veiculo === 'caminhoes') {
          vehicleType = newCar.tipo_veiculo;
        }

        setCars([...cars, {
          id: newCar.id.toString(),
          brand: newCar.marca || newCar.fabricante,
          model: newCar.modelo,
          year: parseInt(newCar.ano_modelo || newCar.ano || '0'),
          manufacturingYear: parseInt(newCar.ano_fabricacao || '0'),
          price: convertFromWords(newCar.valor),
          color: newCar.cor,
          mileage: parseInt(newCar.km || '0'),
          fuelType: newCar.combustivel || newCar.motor,
          transmission: newCar.cambio,
          inStock: newCar.disponivel_estoque !== false,
          characteristics: newCar.caracteristicas,
          fotos: newCar.fotos || [],
          idanuncioolx: newCar.idanuncioolx || [],
          video: newCar.video,
          cautionReport: newCar.cautelar,
          technicalSheet: newCar.ficha_tecnica,
          warranty: newCar.garantia,
          category: newCar.categoria,
          vehicleType: vehicleType,
          image: newCar.foto,
          description: newCar.observacao,
          createdAt: new Date(newCar.created_at),
          updatedAt: new Date(newCar.created_at),
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
        .from(profile.tbEstoque as any)
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
              manufacturingYear: car.manufacturingYear || car.year,
              price: car.price,
              color: car.color,
              mileage: car.mileage,
              fuelType: car.fuelType,
              transmission: car.transmission,
              inStock: car.inStock,
              characteristics: car.characteristics || '',
              fotos: car.fotos || [],
              idanuncioolx: car.idanuncioolx || [],
              video: car.video || '',
              cautionReport: car.cautionReport || '',
              technicalSheet: car.technicalSheet || '',
              warranty: car.warranty || '',
              category: car.category || '',
              vehicleType: car.vehicleType,
              image: car.fotos?.[0],
              description: car.characteristics,
              createdAt: c.createdAt,
              updatedAt: new Date(),
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
        .from(profile.tbEstoque as any)
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
      fabricante: formData.brand,
      modelo: formData.model,
      ano_modelo: formData.year,
      ano: formData.year,
      ano_fabricacao: formData.manufacturingYear,
      valor: convertToWords(formData.price),
      cor: formData.color,
      km: formData.mileage.toString(),
      combustivel: formData.fuelType,
      motor: formData.fuelType,
      cambio: formData.transmission,
      disponivel_estoque: formData.inStock,
      caracteristicas: formData.characteristics,
      observacao: formData.characteristics,
      fotos: formData.fotos,
      foto: formData.fotos?.[0],
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
    filteredCars,
    searchTerm,
    setSearchTerm,
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
