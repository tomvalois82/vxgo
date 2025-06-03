import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCars } from '@/contexts/CarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, ArrowLeft, Car } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
const CarDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    getCar,
    deleteCar
  } = useCars();
  const car = id ? getCar(id) : undefined;
  if (!car) {
    return <div className="flex flex-col items-center justify-center py-10">
        <h2 className="text-2xl font-bold mb-4">Carro não encontrado</h2>
        <Link to="/">
          <Button>Voltar ao Estoque</Button>
        </Link>
      </div>;
  }
  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir o ${car.brand} ${car.model}?`)) {
      deleteCar(car.id);
      navigate('/');
    }
  };
  return <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">
            {car.brand} {car.model}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Link to={`/edit-car/${car.id}`}>
            <Button variant="outline" className="flex items-center gap-1">
              <Edit size={16} />
              <span>Editar</span>
            </Button>
          </Link>
          <Button variant="outline" className="flex items-center gap-1 text-carred hover:text-white hover:bg-carred" onClick={handleDelete}>
            <Trash2 size={16} />
            <span>Excluir</span>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {car.image ? <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full w-full bg-gray-200">
                  <Car size={96} className="text-gray-400" />
                </div>}
            </div>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Descrição</h2>
              <p className="text-gray-700">{car.description || "Sem descrição disponível."}</p>

              <Separator className="my-6" />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Informações Gerais</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-sm">Marca:</div>
                      <div className="text-sm font-medium">{car.brand}</div>
                      
                      <div className="text-sm">Modelo:</div>
                      <div className="text-sm font-medium">{car.model}</div>
                      
                      <div className="text-sm">Ano:</div>
                      <div className="text-sm font-medium">{car.year}</div>
                      
                      <div className="text-sm">Cor:</div>
                      <div className="text-sm font-medium">{car.color}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Especificações</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-sm">Motor:</div>
                      <div className="text-sm font-medium">{car.fuelType}</div>
                      
                      <div className="text-sm">Transmissão:</div>
                      <div className="text-sm font-medium">{car.transmission}</div>
                      
                      <div className="text-sm">Quilometragem:</div>
                      <div className="text-sm font-medium">{car.mileage} km</div>
                      
                      <div className="text-sm">Status:</div>
                      <div className="text-sm font-medium">
                        {car.inStock ? <Badge className="bg-green-500 hover:bg-green-600">Em estoque</Badge> : <Badge variant="destructive">Fora de estoque</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-3xl font-bold">{formatCurrency(car.price)}</div>
                
                <div className="text-sm text-gray-500">
                  <div>Data de cadastro:</div>
                  <div>{new Date(car.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
                
                <div className="text-sm text-gray-500">
                  <div>Última atualização:</div>
                  <div>{new Date(car.updatedAt).toLocaleDateString('pt-BR')}</div>
                </div>
                
                
                
                <div className="flex flex-col gap-2">
                  
                  
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default CarDetail;