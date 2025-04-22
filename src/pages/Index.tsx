
import React from 'react';
import CarList from '@/components/cars/CarList';

const Index = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Estoque de Veículos</h1>
      </div>
      <CarList />
    </div>
  );
};

export default Index;
