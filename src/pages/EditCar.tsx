
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCars } from '@/contexts/CarContext';
import CarForm from '@/components/cars/CarForm';
import { CarFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

const EditCar = () => {
  const { id } = useParams<{ id: string }>();
  const { getCar, updateCar } = useCars();
  const navigate = useNavigate();

  const car = id ? getCar(id) : undefined;

  const handleUpdateCar = (data: Partial<CarFormData>) => {
    if (id) {
      updateCar(id, data);
      navigate(`/dashboard/car/${id}`);
    }
  };

  if (!car) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <h2 className="text-2xl font-bold mb-4">Carro não encontrado</h2>
        <Button onClick={() => navigate('/')}>Voltar ao Estoque</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">
            Editar {car.brand} {car.model}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboard/edit-car-pagina/${id}`)}
        >
          <FileText size={16} className="mr-1" />
          Editar Página
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <CarForm initialData={car} onSubmit={handleUpdateCar} isEditing />
      </div>
    </div>
  );
};

export default EditCar;
