import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
