import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '../components/ui/sonner';
import { Menu } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription
} from '../components/ui/sheet';

export const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleSidebar={() => setIsSidebarCollapsed(prev => !prev)} 
        />
      </div>

      {/* Mobile Navigation - Floating Button & Sheet */}
      <div className="lg:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700"
              aria-label="Open Navigation"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-slate-900 border-r-slate-800 text-slate-100">
             <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
             <SheetDescription className="sr-only">Main navigation sidebar</SheetDescription>
             {/* Pass isMobile prop to Sidebar to adjust its layout */}
             <Sidebar isMobile onLinkClick={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <Header />
        <main className="flex-1 overflow-auto p-4 lg:p-6 relative w-full">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
};
