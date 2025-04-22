
import React from 'react';
import { useCars } from '@/contexts/CarContext';
import { Car as CarType } from '@/lib/types';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Edit, Trash2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

const CarList = () => {
  const { filteredCars, deleteCar } = useCars();

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
  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir o ${car.brand} ${car.model}?`)) {
      onDelete(car.id);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
        {car.image ? (
          <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-200">
            <Car size={64} className="text-gray-400" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <Link to={`/car/${car.id}`}>
          <h3 className="text-xl font-bold hover:text-carblue transition-colors">
            {car.brand} {car.model}
          </h3>
        </Link>
        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-semibold text-cardark">
            {formatCurrency(car.price)}
          </span>
          <span className="text-gray-600">
            {car.year} • {car.mileage} km
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
        <Link to={`/edit-car/${car.id}`}>
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
