import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Car, Settings, Info, LayoutList, Kanban } from 'lucide-react'; // Using Kanban icon for CRM
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button'; // For a potential logo/brand element

const navLinks = [
  { to: '/', icon: Car, label: 'Estoque', exact: true },
  { to: '/crm', icon: Kanban, label: 'CRM', exact: false },
  { to: '/settings', icon: Settings, label: 'Configurações', exact: false },
  { to: '/about', icon: Info, label: 'Sobre', exact: false },
];

const AppSidebar = () => {
  const location = useLocation(); // To determine active link

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-2 flex justify-center">
        {/* You can add a logo or brand name here */}
        {/* Example: <Button variant="ghost" className="text-lg font-semibold">CarVault</Button> */}
        {/* For now, keeping it minimal */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                // Check if current path matches, considering exact match for '/'
                const isActive = link.exact 
                                 ? location.pathname === link.to
                                 : location.pathname.startsWith(link.to) && (location.pathname === link.to || location.pathname.startsWith(link.to + '/'));
                                 
                // Special case for root, ensure it's exactly '/'
                const isRootActive = link.to === '/' && location.pathname === '/';


                return (
                  <SidebarMenuItem key={link.label}>
                    <NavLink to={link.to} end={link.exact} className="w-full">
                      <SidebarMenuButton 
                        isActive={link.to === '/' ? isRootActive : isActive} 
                        tooltip={link.label} 
                        className="w-full"
                      >
                        <IconComponent size={20} className="shrink-0" />
                        <span>{link.label}</span>
                      </SidebarMenuButton>
                    </NavLink>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter> ... </SidebarFooter> */}
    </Sidebar>
  );
};

export default AppSidebar;
