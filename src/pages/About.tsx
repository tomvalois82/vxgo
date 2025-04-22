
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sobre o Sistema</h1>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">CarVault</h2>
          <p className="text-gray-600 mb-4">
            Sistema de gerenciamento de estoque para lojas de carros, desenvolvido com React e Tailwind CSS.
          </p>
          <h3 className="text-lg font-medium mt-4 mb-2">Funcionalidades:</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Cadastro de veículos</li>
            <li>Edição de informações</li>
            <li>Busca e filtragem</li>
            <li>Visualização detalhada</li>
            <li>Gestão de estoque</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
