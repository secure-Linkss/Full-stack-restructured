import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children, user, logout, pageTitle }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-page text-foreground font-body">
      <Sidebar 
        user={user} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div 
        className={`flex-1 flex flex-col transition-all duration-250 ease-in-out w-full
          ${isCollapsed ? 'lg:ml-[64px]' : 'lg:ml-[220px]'}
        `}
      >
        <Header 
          user={user} 
          logout={logout} 
          setIsMobileOpen={setIsMobileOpen} 
          pageTitle={pageTitle} 
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full flex flex-col">
          <div className="flex flex-col gap-6 w-full max-w-full flex-1">
            {children}
          </div>
        </main>

        <Footer isPublic={false} />
      </div>
    </div>
  );
};

export default Layout;