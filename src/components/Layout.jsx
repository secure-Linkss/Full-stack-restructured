import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

const Layout = ({ children, user, logout, pageTitle }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen text-foreground font-body" style={{ background: '#040c1e' }}>
      <Sidebar
        user={user}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-250 ease-in-out w-full min-w-0
          ${isCollapsed ? 'lg:ml-[64px]' : 'lg:ml-[220px]'}
        `}
      >
        <Header
          user={user}
          logout={logout}
          setIsMobileOpen={setIsMobileOpen}
          pageTitle={pageTitle}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 w-full flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6 w-full max-w-full flex-1"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer isPublic={false} />
      </div>
    </div>
  );
};

export default Layout;
