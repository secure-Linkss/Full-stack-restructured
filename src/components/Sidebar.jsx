import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Link, Activity, FolderKanban, BarChart3,
  Globe, Shield, Settings, Zap, Users, MessageSquare, X, DollarSign, FileText, Lock
} from 'lucide-react';
import { Badge } from './ui/badge';
import Logo from './Logo';

const navItems = [
  // User Dashboard Links
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', count: 1, isUser: true },
  { to: '/tracking-links', icon: Link, label: 'Tracking Links', count: 2, isUser: true },
  { to: '/live-activity', icon: Activity, label: 'Live Activity', count: 3, isUser: true },
  { to: '/campaigns', icon: FolderKanban, label: 'Campaigns', count: 4, isUser: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', count: 5, isUser: true },
  { to: '/geography', icon: Globe, label: 'Geography', count: 6, isUser: true },
  { to: '/security', icon: Shield, label: 'Security', count: 7, isUser: true },
  { to: '/settings', icon: Settings, label: 'Settings', count: 8, isUser: true },
  { to: '/link-shortener', icon: Zap, label: 'Link Shortener', count: 9, isUser: true },
  
  // Admin Panel Links (grouped under a single Admin Panel route for now)
  { to: '/admin', icon: Users, label: 'Admin Panel', isAdmin: true },
];

const Sidebar = ({ user, isMobileOpen, setIsMobileOpen }) => {
  const isAdmin = user?.role === 'main_admin' || user?.role === 'admin';

  const filteredNavItems = navItems.filter(item => {
    if (item.isAdmin && !isAdmin) return false;
    return true;
  });

  const baseClasses = "flex items-center p-3 rounded-lg transition-colors duration-200";
  const activeClasses = "bg-primary/10 text-primary font-semibold";
  const inactiveClasses = "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden ${isMobileOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between h-16 mb-6">
            <Logo size="md" />
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-3">
              User Dashboard
            </h3>
            {filteredNavItems.filter(item => !item.isAdmin).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
                }
                onClick={() => setIsMobileOpen(false)} // Close sidebar on mobile after click
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="flex-1">{item.label}</span>
                {item.count && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.count}
                  </Badge>
                )}
              </NavLink>
            ))}

            {isAdmin && (
              <>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-3 pt-4 border-t border-border">
                  Admin Panel
                </h3>
                {filteredNavItems.filter(item => item.isAdmin).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
                    }
                    onClick={() => setIsMobileOpen(false)} // Close sidebar on mobile after click
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* Footer/User Info (Optional) */}
          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">© 2024 Brain Link Tracker</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
