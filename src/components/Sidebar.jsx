import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Link, Activity, FolderKanban, BarChart3,
  Globe, Shield, Settings, Zap, Users, X, ChevronLeft, ChevronRight,
  Bell, MessageSquare, Mail
} from 'lucide-react';
import { Badge } from './ui/Badge';
import Logo from './Logo';
import api from '../services/api';

const navGroups = [
  {
    label: 'Dashboard',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', isUser: true },
    ]
  },
  {
    label: 'Link Management',
    items: [
      { to: '/tracking-links', icon: Link, label: 'Tracking Links', isUser: true },
      { to: '/link-shortener', icon: Zap, label: 'Link Shortener', isUser: true },
      { to: '/campaigns', icon: FolderKanban, label: 'Campaigns', isUser: true },
      { to: '/purl-engine', icon: Mail, label: 'PURL & Email Intel', isUser: true },
    ]
  },
  {
    label: 'Analytics & Live Data',
    items: [
      { to: '/live-activity', icon: Activity, label: 'Live Activity', isUser: true },
      { to: '/analytics', icon: BarChart3, label: 'Analytics', isUser: true },
      { to: '/geography', icon: Globe, label: 'Geography', isUser: true },
    ]
  },
  {
    label: 'Account & Support',
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications', isUser: true, liveKey: 'unread' },
      { to: '/tickets', icon: MessageSquare, label: 'Support Tickets', isUser: true, liveKey: 'tickets' },
      { to: '/security', icon: Shield, label: 'Security', isUser: true },
      { to: '/settings', icon: Settings, label: 'Settings', isUser: true },
    ]
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin', icon: Users, label: 'Admin Panel', isAdmin: true },
    ]
  }
];

const Sidebar = ({ user, isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }) => {
  const isAdmin = user?.role === 'main_admin' || user?.role === 'admin';
  const location = useLocation();
  const [liveCounts, setLiveCounts] = useState({ unread: 0, tickets: 0 });

  // Fetch live badge counts (unread notifications + open support tickets)
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [notifRes, ticketRes] = await Promise.allSettled([
          api.notifications.getAll(),
          api.support.getTickets(),
        ]);
        const notifs = notifRes.status === 'fulfilled' ? (notifRes.value?.notifications || notifRes.value || []) : [];
        const tickets = ticketRes.status === 'fulfilled' ? (ticketRes.value?.tickets || ticketRes.value || []) : [];
        const unread = Array.isArray(notifs) ? notifs.filter(n => !n.is_read && !n.read).length : 0;
        const openTickets = Array.isArray(tickets) ? tickets.filter(t => t.status === 'open').length : 0;
        setLiveCounts({ unread, tickets: openTickets });
      } catch {
        // fail silently
      }
    };
    if (user) fetchCounts();
    // Refresh every 2 minutes
    const interval = setInterval(() => { if (user) fetchCounts(); }, 120000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle window resize for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobileOpen]);

  const baseClasses = "flex items-center p-2.5 transition-all duration-200 group relative";
  const activeClasses = "bg-[rgba(16,185,129,0.12)] text-[#10b981] font-semibold border-l-[3px] border-[#10b981] rounded-r-lg";
  const inactiveClasses = "text-muted-foreground hover:bg-[rgba(255,255,255,0.025)] hover:text-foreground border-l-[3px] border-transparent rounded-r-lg";

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-secondary border-r border-border transform transition-all duration-250 ease-in-out flex flex-col
          ${isMobileOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full'}
          lg:translate-x-0 ${isCollapsed ? 'lg:w-[64px]' : 'lg:w-[220px]'}
        `}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
          {!isCollapsed || isMobileOpen ? (
            <div className="flex-1 flex items-center justify-between">
              <NavLink to="/" className="flex-shrink-0" onClick={() => setIsMobileOpen(false)}>
                <Logo size="md" />
              </NavLink>
              <button
                className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <NavLink to="/" title="Home">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center font-bold text-white shadow-lg">
                  B
                </div>
              </NavLink>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {navGroups.map((group, idx) => {
            const filteredItems = group.items.filter(item => {
              if (item.isAdmin && !isAdmin) return false;
              return true;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="mb-6">
                {!isCollapsed || isMobileOpen ? (
                  <h3 className="nav-group-header px-5 mb-2 truncate">
                    {group.label}
                  </h3>
                ) : (
                  <div className="h-4 mb-2 mx-auto w-4 border-b border-border"></div>
                )}
                
                <ul className="space-y-1 pr-3">
                  {filteredItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                          onClick={() => setIsMobileOpen(false)}
                          title={isCollapsed && !isMobileOpen ? item.label : undefined}
                        >
                          <item.icon className={`shrink-0 ${isCollapsed && !isMobileOpen ? 'w-5 h-5 mx-auto' : 'w-[18px] h-[18px] mr-3'}`} />
                          
                          {(!isCollapsed || isMobileOpen) && (
                            <>
                              <span className="flex-1 text-[0.9rem] truncate">{item.label}</span>
                              {item.liveKey && liveCounts[item.liveKey] > 0 && (
                                <Badge className="ml-2 pointer-events-none bg-[#ef4444] text-white text-[10px] font-bold px-1.5 py-0 min-w-[18px] text-center">
                                  {liveCounts[item.liveKey] > 99 ? '99+' : liveCounts[item.liveKey]}
                                </Badge>
                              )}
                            </>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-end p-3 border-t border-border shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors w-full flex justify-center"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <div className="flex items-center w-full px-2"><ChevronLeft className="w-5 h-5 mr-2" /><span className="text-sm font-medium">Collapse</span></div>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
