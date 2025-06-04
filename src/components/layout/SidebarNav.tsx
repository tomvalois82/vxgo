
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Car, Link2, Settings, MessageCircle, Users, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface SidebarNavProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ 
  isCollapsed = false, 
  onToggleCollapse,
  isMobile = false,
  isOpen = true,
  onClose
}) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  
  const navLinks = [
    { to: '/', icon: <Car size={20} />, label: 'Estoque', exact: true },
    { to: '/atendimentos', icon: <MessageCircle size={20} />, label: 'Atendimentos', exact: false },
    { to: '/connections', icon: <Link2 size={20} />, label: 'Conexões', exact: false },
    { to: '/settings', icon: <Settings size={20} />, label: 'Configurações', exact: false },
  ];

  // Adicionar link de usuários apenas para super administradores
  if (profile?.superadm) {
    navLinks.push({
      to: '/users',
      icon: <Users size={20} />,
      label: 'Usuários',
      exact: false
    });
  }

  const handleProfileClick = () => {
    window.location.href = '/profile';
    if (isMobile && onClose) onClose();
  };

  const handleSignOut = () => {
    signOut();
    if (isMobile && onClose) onClose();
  };

  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Sidebar */}
        <nav className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header com botão de fechar */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-lg font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 px-4 py-6">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.exact}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
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
            </div>

            {/* Fixed Bottom Items - Perfil e Sair */}
            <div className="border-t px-4 py-4">
              <div className="flex flex-col space-y-1">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-3 px-4 py-3 rounded-md transition-colors text-carblue hover:bg-blue-50 w-full text-left"
                >
                  <User size={20} />
                  <span>Perfil</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-4 py-3 rounded-md transition-colors text-carblue hover:bg-blue-50 w-full text-left"
                >
                  <LogOut size={20} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </>
    );
  }

  // Desktop sidebar
  return (
    <nav className={`bg-white shadow-sm h-full transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Toggle button */}
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100"
          >
            <Menu size={20} />
          </Button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-md transition-colors group relative ${
                    isActive
                      ? 'bg-carblue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                title={isCollapsed ? link.label : undefined}
              >
                {link.icon}
                {!isCollapsed && <span>{link.label}</span>}
                
                {/* Tooltip para modo colapsado */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {link.label}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Fixed Bottom Items - Perfil e Sair */}
        <div className="border-t px-4 py-4">
          <div className="flex flex-col space-y-1">
            <button
              onClick={handleProfileClick}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-md transition-colors text-carblue hover:bg-blue-50 w-full text-left group relative`}
              title={isCollapsed ? 'Perfil' : undefined}
            >
              <User size={20} />
              {!isCollapsed && <span>Perfil</span>}
              
              {/* Tooltip para modo colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Perfil
                </div>
              )}
            </button>
            
            <button
              onClick={handleSignOut}
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-md transition-colors text-carblue hover:bg-blue-50 w-full text-left group relative`}
              title={isCollapsed ? 'Sair' : undefined}
            >
              <LogOut size={20} />
              {!isCollapsed && <span>Sair</span>}
              
              {/* Tooltip para modo colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Sair
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SidebarNav;
