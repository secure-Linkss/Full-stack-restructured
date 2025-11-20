import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';

const Layout = ({ children, user, logout, pageTitle }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar user={user} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      <div className="flex-1 flex flex-col lg:ml-64">
        <Header 
          user={user} 
          logout={logout} 
          setIsMobileOpen={setIsMobileOpen} 
          pageTitle={pageTitle} 
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Toaster is now in App.jsx to be globally available */}
    </div>
  );
};

export default Layout;
