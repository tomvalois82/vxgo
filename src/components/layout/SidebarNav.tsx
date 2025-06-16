
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Users, MessageSquare, Settings, LogOut, ChevronLeft, Menu, X, BarChart3, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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
  isOpen = false,
  onClose
}) => {
  const location = useLocation();
  const {
    signOut,
    profile
  } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  const navItems = [{
    icon: BarChart3,
    label: 'Dashboard',
    href: '/'
  }, {
    icon: Car,
    label: 'Estoque',
    href: '/estoque'
  }, {
    icon: MessageSquare,
    label: 'Atendimentos',
    href: '/atendimentos'
  }, {
    icon: LinkIcon,
    label: 'Conexões',
    href: '/connections'
  }, {
    icon: Settings,
    label: 'Configurações',
    href: '/settings'
  }, ...(profile?.superadm ? [{
    icon: Users,
    label: 'Usuários',
    href: '/users'
  }] : [])];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  if (isMobile) {
    return <>
        {/* Overlay */}
        {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onClose} />}
        
        {/* Mobile Sidebar */}
        <div className={cn("fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 md:hidden", isOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex items-center justify-between p-4 border-b">
            <img src="/lovable-uploads/34823516-601b-400c-8c83-fcd390078e2a.png" alt="VGO Logo" className="w-20 h-10 object-contain" />
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X size={20} />
            </Button>
          </div>
          
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map(item => <Link key={item.href} to={item.href} onClick={onClose} className={cn("flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isActive(item.href) ? "bg-carblue text-white" : "text-gray-700 hover:bg-gray-100")}>
                <item.icon size={20} className="flex-shrink-0" />
                <span>{item.label}</span>
              </Link>)}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-gray-700 hover:bg-gray-100">
              <LogOut size={20} className="mr-3 flex-shrink-0" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </>;
  }

  return <div className={cn("h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out", isCollapsed ? "w-16" : "w-64")}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && <img alt="VGO Logo" className="w-20 h-10 object-contain" src="/lovable-uploads/90ec18c4-c6ef-487a-b294-948d4398f496.png" />}
        <Button variant="ghost" size="sm" onClick={onToggleCollapse} className={cn("p-2 hover:bg-gray-100", isCollapsed && "w-full justify-center")}>
          <ChevronLeft size={20} className={cn("transition-transform duration-200 flex-shrink-0", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => <Link key={item.href} to={item.href} className={cn("flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors", isCollapsed ? "justify-center" : "space-x-3", isActive(item.href) ? "bg-carblue text-white" : "text-gray-700 hover:bg-gray-100")}>
            <item.icon size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>)}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" onClick={handleSignOut} className={cn("w-full text-gray-700 hover:bg-gray-100", isCollapsed ? "justify-center p-2" : "justify-start")}>
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </div>;
};

export default SidebarNav;
