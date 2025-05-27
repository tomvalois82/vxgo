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
  if (!isUrl(url)) return null; // Or return url if we expect names sometimes
  try {
    const parsedUrl = new URL(url);
    // Example URL: https://<project_ref>.supabase.co/storage/v1/object/public/car-fotos/filename.jpg
    const pathSegments = parsedUrl.pathname.split('/');
    // The filename is the last segment after the bucket name "car-fotos"
    // Find "car-fotos" and take the rest, or just take the last segment if structure is guaranteed
    const bucketNameIndex = pathSegments.indexOf('car-fotos');
    if (bucketNameIndex !== -1 && bucketNameIndex < pathSegments.length -1) {
      return pathSegments.slice(bucketNameIndex + 1).join('/');
    }
    // Fallback for simpler paths or if bucket name isn't in fixed position as expected
    return pathSegments.pop() || null;
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
    image: row.foto || '', // This 'image' (singular) might also need URL conversion if it's just a name
    description: row.observacao || '',
    characteristics: row.caracteristicas || '',
    video: row.video || '',
    cautionReport: row.cautelar || '',
    technicalSheet: row.ficha_tecnica || '',
    warranty: row.garantia || '',
    category: row.categoria || '',
    fotos: carFotos, // Now guaranteed to be URLs
    idOlx: row.idOlx || undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.created_at ? new Date(row.created_at) : new Date()
  };
}

function mapCarFormDataToSupabase(car: CarFormData & { fotos?: string[] }) {
  const formattedPrice = car.price ? formatCurrency(car.price).replace('R$', 'R$ ').trim() : 'R$ 0,00';
  
  // Ensure 'fotos' are URLs. CarFormData should already provide them as URLs from CarForm.
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
    // 'foto' (singular, cover image) logic: if it's part of 'fotos', pick one. If separate, ensure it's also a URL or handled.
    // For simplicity, assuming `car.image` (if used for cover) is also a URL or needs similar handling.
    // The CarForm doesn't explicitly set a single `image` field anymore, it relies on `fotos`.
    // Let's ensure `foto` (singular) is the first of `fotos` or null.
    foto: fotosToSave.length > 0 ? fotosToSave[0] : null,
    idOlx: car.idOlx || null,
    fotos: fotosToSave, // Save the array of URLs
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

  const addCar = async (carData: CarFormData & { fotos?: string[] }) => {
    if (!user || !stockTable) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar veículo',
        description: 'Você precisa estar logado para adicionar veículos.',
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
    if (!user || !stockTable) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar veículo',
        description: 'Você precisa estar logado para atualizar veículos.',
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
    if (!stockTable) return;
    
    const numericId = parseInt(id, 10);
    const carToDelete = cars.find(car => String(car.id) === String(id));
    
    if (carToDelete?.fotos?.length) {
      const photoFilesToDelete: string[] = [];
      for (const photoUrl of carToDelete.fotos) {
        const fileName = getFileNameFromPublicUrl(photoUrl); // This needs to extract from full URL
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
    
    const { error } = await supabase.from(stockTable as any).delete().eq('id', numericId); // Cast stockTable to any

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir veículo',
        description: error.message,
      });
      throw error;
    }

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
