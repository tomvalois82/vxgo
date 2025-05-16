
import React from 'react';
import Header from './Header';
import AppSidebar from './AppSidebar'; // Changed from SidebarNav
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';

const Layout = () => {
  return (
    <SidebarProvider defaultOpen={true}> {/* Default to open on desktop, true or false as preferred */}
      <div className="min-h-screen bg-carlight flex w-full"> {/* w-full is important for SidebarProvider */}
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden"> {/* Main content wrapper */}
          <Header /> {/* Header will contain the SidebarTrigger */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-background"> {/* Added bg-background for consistency */}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
