
import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Search, PanelLeft } from 'lucide-react'; // Added PanelLeft for SidebarTrigger
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCars } from '@/contexts/CarContext';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar'; // Import SidebarTrigger

const Header = () => {
  const { setSearchTerm, searchTerm } = useCars();
  const { signOut, profile } = useAuth();

  return (
    <header className="bg-cardark text-white py-3 px-4 md:px-6 flex justify-between items-center shadow-md h-16 shrink-0">
      <div className="flex items-center space-x-2">
        {/* SidebarTrigger for mobile and desktop */}
        <SidebarTrigger className="text-white hover:text-carblue mr-2" />
        <Car size={24} className="text-carblue hidden sm:block" />
        <Link to="/" className="text-xl font-bold hidden sm:block">CarVault</Link>
      </div>
      <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar carros..."
            className="pl-9 bg-white/10 border-white/20 text-white placeholder-gray-400 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <Link to="/add-car">
          <Button className="bg-carblue hover:bg-carblue-dark h-9 px-3 text-sm md:px-4 md:text-base">
            Adicionar Carro
          </Button>
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/profile">
            <Button variant="ghost" className="text-white hover:text-carblue">
              {profile?.nome || 'Perfil'}
            </Button>
          </Link>
          <Button variant="ghost" className="text-white hover:text-carblue" onClick={signOut}>
            Sair
          </Button>
        </div>
        {/* Could add a dropdown for profile/logout on mobile if space is tight */}
      </div>
    </header>
  );
};

export default Header;
