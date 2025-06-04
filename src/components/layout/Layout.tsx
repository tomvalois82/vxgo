
import React, { useState, useEffect } from 'react';
import Header from './Header';
import SidebarNav from './SidebarNav';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fechar menu mobile quando a tela aumentar
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-carlight flex flex-col w-full">
      <Header onToggleMobileMenu={handleToggleMobileMenu} />
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <div className={`hidden md:block transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}>
          <SidebarNav 
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
            isMobile={false}
          />
        </div>

        {/* Mobile Sidebar */}
        <SidebarNav 
          isMobile={true}
          isOpen={isMobileMenuOpen}
          onClose={handleCloseMobileMenu}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
