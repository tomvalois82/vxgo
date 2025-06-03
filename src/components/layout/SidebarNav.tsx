
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Car, Info, Link2, Settings, MessageCircle } from 'lucide-react';

const SidebarNav = () => {
  // Force component to only render when we have access to Router context
  const location = useLocation();
  
  const navLinks = [
    { to: '/', icon: <Car size={20} />, label: 'Estoque', exact: true },
    { to: '/atendimentos', icon: <MessageCircle size={20} />, label: 'Atendimentos', exact: false },
    { to: '/connections', icon: <Link2 size={20} />, label: 'Conexões', exact: false },
    { to: '/settings', icon: <Settings size={20} />, label: 'Configurações', exact: false },
    { to: '/about', icon: <Info size={20} />, label: 'Sobre', exact: false },
  ];

  return (
    <nav className="bg-white shadow-sm h-full px-4 py-6">
      <div className="flex flex-col space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-3 rounded-md transition-colors ${
                isActive
                  ? 'bg-carblue text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default SidebarNav;
