
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCars } from '@/contexts/CarContext';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    setSearchTerm,
    searchTerm
  } = useCars();
  const {
    signOut,
    profile
  } = useAuth();

  return (
    <header className="text-white py-4 px-6 flex justify-between items-center shadow-md" style={{ backgroundColor: '#030f1d' }}>
      {/* Mobile menu button + Logo */}
      <div className="flex items-center space-x-4">
        {/* Botão hamburger - apenas mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMobileMenu}
          className="md:hidden text-white hover:text-carblue p-2"
        >
          <Menu size={20} />
        </Button>

        {/* Logo - responsiva */}
        <img 
          src="/lovable-uploads/34823516-601b-400c-8c83-fcd390078e2a.png" 
          alt="VGO Logo" 
          className="w-20 h-10 md:w-[141px] md:h-[75px] object-contain"
        />
      </div>

      {/* Campo de pesquisa - oculto em mobile */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            type="text" 
            placeholder="Buscar carros..." 
            className="pl-9 bg-white/10 border-white/20 text-white placeholder-gray-400" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Botões de ação - desktop */}
      <div className="hidden md:flex items-center gap-4">
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

      {/* Botão adicionar carro - mobile */}
      <div className="md:hidden">
        <Link to="/add-car">
          <Button size="sm" className="bg-carblue hover:bg-carblue-dark">
            + Carro
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
