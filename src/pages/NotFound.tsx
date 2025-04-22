
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-cardark mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Página não encontrada</p>
      <Link to="/">
        <Button>Voltar ao Estoque</Button>
      </Link>
    </div>
  );
};

export default NotFound;
