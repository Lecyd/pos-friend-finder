import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, ShoppingCart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  React.useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      {!isMobile && (
        <div className="shrink-0">
          <AppSidebar />
        </div>
      )}

      {/* Sidebar mobile */}
      {isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="p-0 w-64 border-r-0">
            <VisuallyHidden.Root>
              <SheetTitle>Menu de navigation</SheetTitle>
            </VisuallyHidden.Root>
            <AppSidebar />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {isMobile && (
          <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
            <Button variant="ghost" size="icon" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold tracking-tight">Gestion Ventes</span>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
