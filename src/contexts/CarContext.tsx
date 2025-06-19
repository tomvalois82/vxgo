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

function isUrl(string: string): boolean {
  if (!string) return false;
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function getFileNameFromPublicUrl(url: string): string | null {
  if (!isUrl(url)) return url; // If it's not a URL, assume it's already a filename
  
  try {
    const parsedUrl = new URL(url);
    
    // For Supabase public URLs: https://project.supabase.co/storage/v1/object/public/bucket-name/filename
    const pathSegments = parsedUrl.pathname.split('/');
    
    // Find the index of 'public' in the path
    const publicIndex = pathSegments.indexOf('public');
    if (publicIndex !== -1 && publicIndex < pathSegments.length - 2) {
      // Skip 'public' and bucket name, get the rest as filename
      return pathSegments.slice(publicIndex + 2).join('/');
    }
    
    // Alternative approach: look for car-fotos specifically
    const bucketIndex = pathSegments.indexOf('car-fotos');
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      return pathSegments.slice(bucketIndex + 1).join('/');
    }
    
    // Fallback: return the last segment
    return pathSegments[pathSegments.length - 1] || null;
  } catch (e) {
    console.error("Error extracting filename from URL:", url, e);
    return null;
  }
}

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

  const carFotos: string[] = (row.fotos || []).map((foto: string) => {
    if (isUrl(foto)) {
      return foto;
    }
    // If it's a name, construct the public URL
    const { data } = supabase.storage.from("car-fotos").getPublicUrl(foto);
    return data.publicUrl || foto; // Fallback to name if URL construction fails
  });

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
    fotos: carFotos,
    idanuncioolx: row.idanuncioolx || [],
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.created_at ? new Date(row.created_at) : new Date()
  };
}

function mapCarFormDataToSupabase(car: CarFormData & { fotos?: string[] }) {
  const formattedPrice = car.price ? formatCurrency(car.price).replace('R$', 'R$ ').trim() : 'R$ 0,00';
  
  const fotosToSave = car.fotos || [];

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
    foto: fotosToSave.length > 0 ? fotosToSave[0] : null,
    idanuncioolx: car.idanuncioolx || null,
    fotos: fotosToSave,
  };
}

export const CarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile, isLoading: authLoading } = useAuth();
  const [stockTable, setStockTable] = useState<string>('');
  const [isLoadingCars, setIsLoadingCars] = useState(false);

  // Only set stock table when profile is loaded and has valid tbEstoque
  useEffect(() => {
    console.log('Profile changed:', profile);
    
    if (!authLoading && profile) {
      if (profile.tbEstoque && profile.tbEstoque.trim() !== '') {
        console.log('Setting stock table to:', profile.tbEstoque);
        setStockTable(profile.tbEstoque);
      } else {
        console.log('Invalid stock table, clearing cars');
        setStockTable('');
        setCars([]);
      }
    } else if (!authLoading && !profile) {
      console.log('No profile found, clearing data');
      setStockTable('');
      setCars([]);
    }
  }, [profile, authLoading]);

  const fetchCars = async () => {
    // Don't fetch if no valid stock table
    if (!stockTable || stockTable.trim() === '') {
      console.log('No valid stock table, skipping fetch');
      setCars([]);
      return;
    }
    
    console.log(`Fetching cars from table: ${stockTable}`);
    setIsLoadingCars(true);
    
    try {
      const { data, error } = await supabase
        .from(stockTable as any) // Cast to any for dynamic table name
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar veículos',
          description: error.message,
        });
        setCars([]);
        return;
      }
      
      setCars(data?.map(mapSupabaseToCar) || []);
    } catch (error: any) {
      console.error('Error fetching cars:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar veículos',
        description: 'Não foi possível carregar os dados do estoque.',
      });
      setCars([]);
    } finally {
      setIsLoadingCars(false);
    }
  };

  // Only fetch cars when we have a valid stock table and user
  useEffect(() => {
    if (user && stockTable && stockTable.trim() !== '' && !authLoading) {
      console.log('Conditions met for fetching cars - user:', !!user, 'stockTable:', stockTable, 'authLoading:', authLoading);
      fetchCars();
    } else {
      console.log('Conditions not met for fetching cars - user:', !!user, 'stockTable:', stockTable, 'authLoading:', authLoading);
      if (!authLoading) {
        setCars([]);
      }
    }
  }, [user, stockTable, authLoading]);

  const addCar = async (carData: CarFormData & { fotos?: string[] }) => {
    if (!user || !stockTable || stockTable.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar veículo',
        description: 'Tabela de estoque não encontrada. Entre em contato com o suporte.',
      });
      return;
    }

    const insertPayload = {
      ...mapCarFormDataToSupabase(carData),
      uid: user.id
    };
    
    insertPayload.foto = carData.fotos && carData.fotos.length > 0 ? carData.fotos[0] : null;

    const { error } = await supabase.from(stockTable as any).insert([insertPayload] as any); // Cast stockTable to any

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
    if (!user || !stockTable || stockTable.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar veículo',
        description: 'Tabela de estoque não encontrada. Entre em contato com o suporte.',
      });
      return;
    }

    const numericId = parseInt(id, 10);
    const mappedPayload = mapCarFormDataToSupabase(carData as CarFormData & { fotos?: string[] });
    
    if (carData.fotos !== undefined) {
      mappedPayload.foto = carData.fotos && carData.fotos.length > 0 ? carData.fotos[0] : null;
    }
    
    const updatePayload = {
      ...mappedPayload
    };

    const { error } = await supabase.from(stockTable as any).update(updatePayload as any).eq('id', numericId); // Cast stockTable to any

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
    if (!stockTable || stockTable.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir veículo',
        description: 'Tabela de estoque não encontrada. Entre em contato com o suporte.',
      });
      return;
    }
    
    const numericId = parseInt(id, 10);
    const carToDelete = cars.find(car => String(car.id) === String(id));
    
    // Delete photos from storage first
    if (carToDelete?.fotos?.length) {
      const photoFilesToDelete: string[] = [];
      for (const photoUrl of carToDelete.fotos) {
        const fileName = getFileNameFromPublicUrl(photoUrl);
        if (fileName) {
          photoFilesToDelete.push(fileName);
        } else {
          console.warn("Could not extract filename to delete from storage for URL:", photoUrl);
        }
      }
      
      if (photoFilesToDelete.length > 0) {
        console.log("Attempting to delete from storage:", photoFilesToDelete);
        const { error: storageError } = await supabase.storage
          .from('car-fotos')
          .remove(photoFilesToDelete);
            
        if (storageError) {
          console.error('Error deleting photos from storage:', storageError);
          toast({
            title: "Aviso: Erro ao deletar algumas fotos do armazenamento",
            description: storageError.message,
            variant: "default"
          });
        } else {
          console.log("Photos deleted from storage successfully:", photoFilesToDelete);
        }
      }
    }
    
    // Now delete the car record from database
    const { error } = await supabase.from(stockTable as any).delete().eq('id', numericId); // Cast stockTable to any

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir veículo',
        description: error.message,
      });
      throw error;
    }

    // Update local state optimistically
    setCars(prevCars => prevCars.filter(car => String(car.id) !== String(id)));
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
