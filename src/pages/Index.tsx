
import React from 'react';
import CarList from '@/components/cars/CarList';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { profile, isLoading: authLoading } = useAuth();

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Estoque de Veículos</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-carblue mb-4"></div>
          <p className="text-lg text-gray-600">Carregando Estoque</p>
        </div>
      </div>
    );
  }

  // Check if stock table is valid
  if (!profile?.tbEstoque || profile.tbEstoque.trim() === '') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Estoque de Veículos</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-lg text-red-600 font-medium">
              Estoque não localizado, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
