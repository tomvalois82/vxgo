
import React from 'react';
import { useCars } from '@/contexts/CarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Car as CarType } from '@/lib/types';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Edit, Trash2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const CarList = () => {
  const { filteredCars, deleteCar } = useCars();
  const { profile } = useAuth();

  // Don't render anything if no valid stock table
  if (!profile?.tbEstoque || profile.tbEstoque.trim() === '') {
    return null;
  }

  if (filteredCars.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-medium text-gray-600">Nenhum carro encontrado</h2>
        <p className="text-gray-500 mt-2">Adicione carros ao estoque ou tente uma busca diferente.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCars.map((car) => (
        <CarCard key={car.id} car={car} onDelete={deleteCar} />
      ))}
    </div>
  );
};

const CarCard = ({ car, onDelete }: { car: CarType; onDelete: (id: string) => void }) => {
  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o ${car.brand} ${car.model}?`)) {
      try {
        await onDelete(car.id);
        // Toast for success is now handled in CarContext's deleteCar after optimistic update
      } catch (error) {
        // Error toast is also handled in CarContext if the error is thrown
        // However, a local catch can provide more specific UI feedback if needed or prevent unhandled promise rejections.
        // For now, relying on CarContext's error handling.
        console.error("Error caught in CarCard handleDelete:", error);
        // If CarContext rethrows, this might be redundant or could be a place for a generic fallback toast.
        // toast({
        //   variant: "destructive",
        //   title: "Erro ao excluir",
        //   description: "Não foi possível excluir o veículo. Tente novamente.",
        // });
      }
    }
  };

  const getFirstImage = () => {
    // `car.fotos` should be an array of full URLs.
    if (car.fotos && car.fotos.length > 0 && car.fotos[0]) {
      return car.fotos[0];
    }
    // `car.image` is a fallback, ideally also a full URL.
    // This field is populated from the 'foto' column in the database,
    // which `mapCarFormDataToSupabase` sets as the first URL from the 'fotos' array.
    if (car.image) { 
      return car.image;
    }
    return null; // Return null if no image is available
  };

  const imageUrl = getFirstImage();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${car.brand} ${car.model}`} 
            className="w-full h-full object-cover"
            onError={(e) => { 
              // Optional: handle broken image links, e.g., show placeholder
              console.warn(`Error loading image: ${imageUrl}`, e);
              (e.target as HTMLImageElement).style.display = 'none'; // Hide broken image
              // Or replace with a placeholder: (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-200">
            <Car size={64} className="text-gray-400" />
          </div>
        )}
         {!imageUrl && ( // Show the placeholder if imageUrl is null and the img tag itself wasn't rendered
            <div className="flex items-center justify-center h-full w-full bg-gray-200 absolute top-0 left-0 -z-10">
               <Car size={64} className="text-gray-400" />
            </div>
        )}
      </div>
      <CardContent className="p-4">
        <Link to={`/dashboard/car/${car.id}`}>
          <h3 className="text-xl font-bold hover:text-carblue transition-colors">
            {car.brand} {car.model}
          </h3>
        </Link>
        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-semibold text-cardark">
            {formatCurrency(car.price)}
          </span>
          <span className="text-gray-600">
            {car.year} • {car.mileage.toLocaleString('pt-BR')} km
          </span>
        </div>
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Combustível:</span>
            <span className="font-medium">{car.fuelType}</span>
          </div>
          <div className="flex justify-between">
            <span>Transmissão:</span>
            <span className="font-medium">{car.transmission}</span>
          </div>
          <div className="flex justify-between">
            <span>Cor:</span>
            <span className="font-medium">{car.color}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4 flex justify-between">
        <Link to={`/dashboard/edit-car/${car.id}`}>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Edit size={16} />
            <span>Editar</span>
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 text-carred hover:text-white hover:bg-carred"
          onClick={handleDelete}
        >
          <Trash2 size={16} />
          <span>Excluir</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CarList;
