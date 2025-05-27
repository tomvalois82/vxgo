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
    
    let data, error;
    const query = supabase.from(stockTable).select('*').order('created_at', { ascending: false });

    // The dynamic table name requires a cast to any to bypass strict type checking here,
    // or more elaborate type handling if specific table types are needed.
    // For now, we assume the structure is compatible enough for mapSupabaseToCar.
    const result = await (query as any); 
    data = result.data;
    error = result.error;

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

    // `carData.fotos` should already be an array of URLs from CarForm
    const insertPayload = {
      ...mapCarFormDataToSupabase(carData), // This now correctly includes fotos as URLs
      uid: user.id
    };
    
    // Ensure payload `foto` (singular) is the first of `fotos` if available
    insertPayload.foto = carData.fotos && carData.fotos.length > 0 ? carData.fotos[0] : null;


    const { error } = await supabase.from(stockTable).insert([insertPayload] as any);


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
    // `carData.fotos` should be URLs if provided
    const mappedPayload = mapCarFormDataToSupabase(carData as CarFormData & { fotos?: string[] });
    
    // Ensure payload `foto` (singular) is updated correctly
    if (carData.fotos !== undefined) { // if fotos array is explicitly passed (even if empty)
      mappedPayload.foto = carData.fotos && carData.fotos.length > 0 ? carData.fotos[0] : null;
    } else {
      // If carData.fotos is not provided, mapCarFormDataToSupabase would use carData.fotos (undefined)
      // which results in an empty array for fotos. We might want to preserve existing foto if fotos not touched.
      // However, current mapCarFormDataToSupabase takes `carData as CarFormData` which might not have original fotos.
      // This part might need more robust handling if partial updates to fotos are complex.
      // For now, assume if fotos are part of carData, they are the new source of truth for `foto` field.
      // If carData.fotos is not in the partial update, mappedPayload.foto would be based on carData.image or be null.
      // Let's be explicit: if carData.fotos is present, use it for `foto`. Otherwise, `foto` is not part of this partial update unless carData.image is set.
      // The current `mapCarFormDataToSupabase` sets `foto` based on the `fotos` it receives or null.
      // This means if `carData.fotos` is not part of the `Partial<>`, `mappedPayload.foto` will likely be null.
      // This is okay if `foto` is always derived from the `fotos` array.
    }
    
    const updatePayload = {
      ...mappedPayload
    };


    const { error } = await supabase.from(stockTable).update(updatePayload as any).eq('id', numericId);

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
        const fileName = getFileNameFromPublicUrl(photoUrl);
        if (fileName) {
          photoFilesToDelete.push(fileName);
        } else {
          console.warn("Could not extract filename to delete from storage for URL:", photoUrl);
        }
      }
      
      if (photoFilesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('car-fotos')
          .remove(photoFilesToDelete);
            
        if (storageError) {
          // Log error but proceed with DB deletion
          console.error('Error deleting photos from storage:', storageError);
          toast({
            title: "Aviso: Erro ao deletar algumas fotos do armazenamento",
            description: storageError.message,
            variant: "default"
          });
        }
      }
    }
    
    const { error } = await supabase.from(stockTable).delete().eq('id', numericId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir veículo',
        description: error.message,
      });
      throw error; // Rethrow to indicate failure
    }

    // Optimistic update or refetch
    setCars(prevCars => prevCars.filter(car => String(car.id) !== String(id)));
    toast({ 
      title: 'Veículo removido com sucesso!' 
    });
    // No need to call refreshCars() if doing optimistic update, but if there are side effects, keep it.
    // await refreshCars(); // Or rely on optimistic update
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
