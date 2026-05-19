import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Link, Activity, FolderKanban, BarChart3,
  Globe, Shield, Settings, Zap, Users, X, ChevronLeft, ChevronRight,
  Bell, MessageSquare, Mail, ChevronDown
} from 'lucide-react';
import Logo from './Logo';
import api from '../services/api';

const navGroups = [
  {
    label: 'Dashboard',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    ]
  },
  {
    label: 'Link Management',
    items: [
      { to: '/tracking-links', icon: Link,          label: 'Tracking Links' },
      { to: '/link-shortener', icon: Zap,            label: 'Link Shortener' },
      { to: '/campaigns',      icon: FolderKanban,   label: 'Campaigns' },
      { to: '/purl-engine',    icon: Mail,            label: 'PURL & Email Intel' },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/live-activity', icon: Activity,  label: 'Live Activity' },
      { to: '/analytics',     icon: BarChart3, label: 'Analytics' },
      { to: '/geography',     icon: Globe,     label: 'Geography' },
    ]
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', icon: Bell,          label: 'Notifications', liveKey: 'unread' },
      { to: '/tickets',       icon: MessageSquare, label: 'Support Tickets', liveKey: 'tickets' },
      { to: '/security',      icon: Shield,        label: 'Security' },
      { to: '/settings',      icon: Settings,      label: 'Settings' },
    ]
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin', icon: Users, label: 'Admin Panel', isAdmin: true },
    ],
    isAdminGroup: true,
  }
];

const sidebarVariants = {
  open:    { width: 220, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed:  { width: 64,  transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

const itemVariants = {
  hidden:  { opacity: 0, x: -10 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, duration: 0.2 } }),
};

const Sidebar = ({ user, isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }) => {
  const isAdmin = user?.role === 'main_admin' || user?.role === 'admin';
  const location = useLocation();
  const [liveCounts, setLiveCounts] = useState({ unread: 0, tickets: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [notifRes, ticketRes] = await Promise.allSettled([
          api.notifications.getAll(),
          api.support.getTickets(),
        ]);
        const notifs  = notifRes.status  === 'fulfilled' ? (notifRes.value?.notifications  || notifRes.value  || []) : [];
        const tickets = ticketRes.status === 'fulfilled' ? (ticketRes.value?.tickets || ticketRes.value || []) : [];
        const unread     = Array.isArray(notifs)  ? notifs.filter(n  => !n.is_read && !n.read).length : 0;
        const openTickets = Array.isArray(tickets) ? tickets.filter(t => t.status === 'open').length : 0;
        setLiveCounts({ unread, tickets: openTickets });
      } catch {}
    };
    if (user) fetchCounts();
    const interval = setInterval(() => { if (user) fetchCounts(); }, 120000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setIsMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setIsMobileOpen]);

  const showText = !isCollapsed || isMobileOpen;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          transition-all duration-250 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full'}
          lg:translate-x-0 ${isCollapsed ? 'lg:w-[64px]' : 'lg:w-[220px]'}
        `}
        style={{
          background: 'linear-gradient(180deg, #050d1f 0%, #040c1e 60%, #050e22 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo header */}
        <div
          className="flex items-center h-16 px-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {showText ? (
            <div className="flex-1 flex items-center justify-between">
              <NavLink to="/" onClick={() => setIsMobileOpen(false)} className="flex-shrink-0">
                <Logo size="md" />
              </NavLink>
              <button
                className="lg:hidden p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <NavLink to="/" title="Home">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    boxShadow: '0 0 16px rgba(59,130,246,0.35)',
                  }}
                >
                  B
                </motion.div>
              </NavLink>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {navGroups.map((group, gIdx) => {
            if (group.isAdminGroup && !isAdmin) return null;
            return (
              <div key={gIdx} className="mb-4">
                {showText && (
                  <p className="nav-group-header px-4 mb-1.5">{group.label}</p>
                )}
                {!showText && (
                  <div className="mx-3 mb-2 h-px bg-white/5" />
                )}

                <ul className="space-y-0.5 px-2">
                  {group.items.map((item, iIdx) => {
                    if (item.isAdmin && !isAdmin) return null;
                    const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                    const count = item.liveKey ? liveCounts[item.liveKey] : 0;

                    return (
                      <motion.li
                        key={item.to}
                        custom={iIdx}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <NavLink
                          to={item.to}
                          onClick={() => setIsMobileOpen(false)}
                          title={!showText ? item.label : undefined}
                          className={`
                            nav-item w-full
                            ${isActive ? 'nav-item-active' : 'nav-item-inactive'}
                            ${!showText ? 'justify-center px-0' : ''}
                          `}
                        >
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}>
                            <item.icon
                              className={`shrink-0 ${showText ? 'w-4 h-4 mr-3' : 'w-[18px] h-[18px]'} ${isActive ? 'text-blue-400' : ''}`}
                            />
                          </motion.div>

                          {showText && (
                            <>
                              <span className="flex-1 text-[0.875rem] truncate">{item.label}</span>
                              {count > 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-1.5 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-blue-500/80 px-1 text-[10px] font-bold text-white"
                                >
                                  {count > 99 ? '99+' : count}
                                </motion.span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div
          className="hidden lg:flex items-center p-3 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors text-xs font-medium"
          >
            {isCollapsed
              ? <ChevronRight className="w-4 h-4" />
              : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>
            }
          </motion.button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
