
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Car, CarFormData } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { VehicleType } from '@/hooks/useFipeBrands';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from './AuthContext';

interface CarContextType {
  cars: Car[];
  addCar: (car: CarFormData & { fotos?: string[] }) => Promise<void>;
  updateCar: (id: string, car: Partial<CarFormData & { fotos?: string[] }>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  getCar: (id: string) => Car | undefined;
  filteredCars: Car[];
  setSearchTerm: (term: string) => void;
  searchTerm: string;
  refreshCars: () => Promise<void>;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

function mapSupabaseToCar(row: any): Car {
  let price = 0;
  if (row.valor) {
    const numericValue = row.valor.replace(/[^\d,]/g, '').replace(',', '.');
    price = parseFloat(numericValue);
  }

  let mileage = 0;
  if (row.km) {
    mileage = parseInt(row.km.replace(/\./g, ''));
  }

  return {
    id: String(row.id),
    vehicleType: (row.tipo_veiculo as VehicleType) || 'carros',
    brand: row.fabricante || '',
    model: row.modelo || '',
    year: Number(row.ano || 0),
    manufacturingYear: Number(row.ano_fabricacao || 0),
    price: isNaN(price) ? 0 : price,
    color: row.cor || '',
    mileage: isNaN(mileage) ? 0 : mileage,
    fuelType: row.motor || '',
    transmission: row.cambio || '',
    inStock: !row.status || row.status.toLowerCase() === 'em estoque',
    image: row.foto || '',
    description: row.observacao || '',
    characteristics: row.caracteristicas || '',
    video: row.video || '',
    cautionReport: row.cautelar || '',
    technicalSheet: row.ficha_tecnica || '',
    warranty: row.garantia || '',
    category: row.categoria || '',
    fotos: row.fotos || [],
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.created_at ? new Date(row.created_at) : new Date()
  };
}

function mapCarFormDataToSupabase(car: CarFormData) {
  const formattedPrice = car.price ? formatCurrency(car.price).replace('R$', 'R$ ').trim() : 'R$ 0,00';
  
  return {
    tipo_veiculo: car.vehicleType,
    fabricante: car.brand,
    modelo: car.model,
    ano: String(car.year),
    ano_fabricacao: String(car.manufacturingYear || car.year),
    valor: formattedPrice,
    cor: car.color,
    km: car.mileage ? car.mileage.toLocaleString('pt-BR') : '0',
    motor: car.fuelType,
    cambio: car.transmission,
    categoria: car.category || null,
    observacao: car.description || null,
    caracteristicas: car.characteristics || null,
    video: car.video || null,
    cautelar: car.cautionReport || null,
    ficha_tecnica: car.technicalSheet || null,
    garantia: car.warranty || null,
    status: car.inStock ? 'Em estoque' : 'Fora de estoque',
    foto: car.image || null
  };
}

export const CarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile } = useAuth();
  const [stockTable, setStockTable] = useState<string>('estoque');

  useEffect(() => {
    if (profile?.tbEstoque) {
      setStockTable(profile.tbEstoque);
      console.log('Using stock table:', profile.tbEstoque);
    } else {
      setStockTable('estoque');
      console.log('No custom stock table found, using default: estoque');
    }
  }, [profile]);

  const fetchCars = async () => {
    if (!stockTable) return;
    
    console.log(`Fetching cars from table: ${stockTable}`);
    
    // Handle each supported table explicitly to satisfy TypeScript
    let data, error;
    
    if (stockTable === 'estoque') {
      const result = await supabase
        .from('estoque')
        .select('*')
        .order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    } else if (stockTable === 'estoque_iputinga') {
      const result = await supabase
        .from('estoque_iputinga')
        .select('*')
        .order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    } else {
      // Fallback to default table if none match
      const result = await supabase
        .from('estoque')
        .select('*')
        .order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar veículos',
        description: error.message,
      });
      return;
    }
    setCars(data?.map(mapSupabaseToCar) || []);
  };

  useEffect(() => {
    if (user && stockTable) {
      fetchCars();
    } else {
      setCars([]);
    }
  }, [user, stockTable]);

  const addCar = async (car: CarFormData & { fotos?: string[] }) => {
    if (!user || !stockTable) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar veículo',
        description: 'Você precisa estar logado para adicionar veículos.',
      });
      return;
    }

    const insertPayload = {
      ...mapCarFormDataToSupabase(car),
      fotos: car.fotos ?? null,
      uid: user.id
    };

    let error;
    if (stockTable === 'estoque') {
      const result = await supabase
        .from('estoque')
        .insert([insertPayload]);
      error = result.error;
    } else if (stockTable === 'estoque_iputinga') {
      const result = await supabase
        .from('estoque_iputinga')
        .insert([insertPayload]);
      error = result.error;
    } else {
      // Fallback to default
      const result = await supabase
        .from('estoque')
        .insert([insertPayload]);
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar veículo',
        description: error.message,
      });
      return;
    }
    await fetchCars();
    toast({ title: 'Veículo adicionado com sucesso!' });
  };

  const updateCar = async (id: string, carData: Partial<CarFormData & { fotos?: string[] }>) => {
    if (!user || !stockTable) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar veículo',
        description: 'Você precisa estar logado para atualizar veículos.',
      });
      return;
    }

    const numericId = parseInt(id, 10);
    const updatePayload = {
      ...mapCarFormDataToSupabase(carData as CarFormData),
      fotos: carData.fotos ?? null,
    };

    let error;
    if (stockTable === 'estoque') {
      const result = await supabase
        .from('estoque')
        .update(updatePayload)
        .eq('id', numericId);
      error = result.error;
    } else if (stockTable === 'estoque_iputinga') {
      const result = await supabase
        .from('estoque_iputinga')
        .update(updatePayload)
        .eq('id', numericId);
      error = result.error;
    } else {
      // Fallback to default
      const result = await supabase
        .from('estoque')
        .update(updatePayload)
        .eq('id', numericId);
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar veículo',
        description: error.message,
      });
      return;
    }
    await fetchCars();
    toast({ title: 'Veículo atualizado com sucesso!' });
  };

  const deleteCar = async (id: string) => {
    if (!stockTable) return;
    
    const numericId = parseInt(id, 10);
    const carToDelete = cars.find(car => String(car.id) === String(id));
    
    if (carToDelete?.fotos?.length) {
      for (const photo of carToDelete.fotos) {
        const { error: storageError } = await supabase.storage
          .from('car-fotos')
          .remove([photo]);
          
        if (storageError) {
          console.error('Error deleting photo:', storageError);
        }
      }
    }
    
    let error;
    if (stockTable === 'estoque') {
      const result = await supabase
        .from('estoque')
        .delete()
        .eq('id', numericId);
      error = result.error;
    } else if (stockTable === 'estoque_iputinga') {
      const result = await supabase
        .from('estoque_iputinga')
        .delete()
        .eq('id', numericId);
      error = result.error;
    } else {
      // Fallback to default
      const result = await supabase
        .from('estoque')
        .delete()
        .eq('id', numericId);
      error = result.error;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir veículo',
        description: error.message,
      });
      throw error;
    }

    await refreshCars();
    toast({ 
      title: 'Veículo removido com sucesso!' 
    });
  };

  const getCar = (id: string) => cars.find((car) => String(car.id) === String(id));

  const filteredCars = cars.filter((car) => {
    const searchFields = `${car.brand} ${car.model} ${car.year} ${car.color}`.toLowerCase();
    return searchFields.includes(searchTerm.toLowerCase());
  });

  const refreshCars = fetchCars;

  return (
    <CarContext.Provider
      value={{
        cars,
        addCar,
        updateCar,
        deleteCar,
        getCar,
        filteredCars,
        setSearchTerm,
        searchTerm,
        refreshCars,
      }}
    >
      {children}
    </CarContext.Provider>
  );
};

export const useCars = () => {
  const context = useContext(CarContext);
  if (context === undefined) {
    throw new Error('useCars must be used within a CarProvider');
  }
  return context;
};
