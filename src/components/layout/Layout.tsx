
import React from 'react';
import Header from './Header';
import SidebarNav from './SidebarNav';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-carlight flex flex-col">
      <Header />
      <div className="flex flex-1">
        <div className="w-64 hidden md:block">
          <SidebarNav />
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
