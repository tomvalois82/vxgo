
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCars } from '@/contexts/CarContext';
import CarForm from '@/components/cars/CarForm';
import { CarFormData } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AddCar = () => {
  const { addCar } = useCars();
  const navigate = useNavigate();

  const handleAddCar = async (data: Partial<CarFormData>) => {
    await addCar(data as CarFormData);
    navigate('/');
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Adicionar Novo Veículo</h1>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <CarForm onSubmit={handleAddCar} />
      </div>
    </div>
  );
};

export default AddCar;
