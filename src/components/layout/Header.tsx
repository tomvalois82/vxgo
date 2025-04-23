import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCars } from '@/contexts/CarContext';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { setSearchTerm, searchTerm } = useCars();
  const { signOut, profile } = useAuth();

  return (
    <header className="bg-cardark text-white py-4 px-6 flex justify-between items-center shadow-md">
      <div className="flex items-center space-x-2">
        <Car size={24} className="text-carblue" />
        <Link to="/" className="text-xl font-bold">CarVault</Link>
      </div>
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar carros..."
            className="pl-9 bg-white/10 border-white/20 text-white placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/add-car">
          <Button className="bg-carblue hover:bg-carblue-dark">
            Adicionar Carro
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/profile">
            <Button variant="ghost" className="text-white hover:text-carblue">
              {profile?.nome || 'Perfil'}
            </Button>
          </Link>
          <Button variant="ghost" className="text-white hover:text-carblue" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
