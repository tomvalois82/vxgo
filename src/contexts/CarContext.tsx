import React, { createContext, useContext, useState, useEffect } from 'react';
import { Car, CarFormData } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { VehicleType } from '@/hooks/useFipeBrands';

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
  return {
    id: String(row.id),
    vehicleType: (row.tipo_veiculo as VehicleType) || 'carros',
    brand: row.fabricante || '',
    model: row.modelo || '',
    year: Number(row.ano || 0),
    manufacturingYear: Number(row.ano_fabricacao || 0),
    price: Number(row.valor) || 0,
    color: row.cor || '',
    mileage: Number(row.km) || 0,
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
  return {
    tipo_veiculo: car.vehicleType,
    fabricante: car.brand,
    modelo: car.model,
    ano: String(car.year),
    ano_fabricacao: String(car.manufacturingYear || car.year),
    valor: car.price ? `R$ ${car.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0',
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
  const [loading, setLoading] = useState(false);

  const fetchCars = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('estoque_iputinga')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar veículos',
        description: error.message,
      });
      setLoading(false);
      return;
    }
    setCars(data?.map(mapSupabaseToCar) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const addCar = async (carData: CarFormData & { fotos?: string[] }) => {
    const insertPayload = {
      ...mapCarFormDataToSupabase(carData),
      fotos: carData.fotos ?? null,
    };

    const { error } = await supabase.from('estoque_iputinga').insert([insertPayload]);
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
    const numericId = parseInt(id, 10);

    const updatePayload = {
      ...mapCarFormDataToSupabase(carData as CarFormData),
      fotos: carData.fotos ?? null,
    };

    const { error } = await supabase
      .from('estoque_iputinga')
      .update(updatePayload)
      .eq('id', numericId);

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
    const numericId = parseInt(id, 10);
    
    const { error } = await supabase.from('estoque_iputinga').delete().eq('id', numericId);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir veículo',
        description: error.message,
      });
      return;
    }
    await fetchCars();
    toast({ title: 'Veículo removido com sucesso!' });
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
