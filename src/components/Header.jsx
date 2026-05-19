import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, User, LogOut, Settings, LayoutDashboard, ChevronDown,
  Menu, Shield, CreditCard, Sparkles, Search
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import api from '../services/api';

const PLAN_COLORS = {
  enterprise: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  pro:        { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  starter:    { bg: 'rgba(34,211,238,0.12)', text: '#22d3ee', border: 'rgba(34,211,238,0.25)' },
};

const Header = ({ user, logout, pageTitle, setIsMobileOpen }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const response = await api.notifications?.getAll() || { notifications: [] };
        const data = response.notifications || response || [];
        const arr = Array.isArray(data) ? data : [];
        setNotifications(arr);
        setUnreadCount(arr.filter(n => !n.is_read).length);
      } catch {}
    };
    fetchNotifs();
  }, []);

  const handleLogout = () => { logout(); toast.info('Signed out.'); };

  const userInitials = (user?.username || user?.email || 'U').charAt(0).toUpperCase();
  const roleName = user?.role === 'main_admin' ? 'Main Admin' : user?.role === 'admin' ? 'Admin' : user?.plan_type || 'User';
  const planStyle = PLAN_COLORS[user?.plan_type] || PLAN_COLORS.starter;
  const isAdmin = user?.role === 'main_admin' || user?.role === 'admin';

  return (
    <header
      className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between px-4 sm:px-6"
      style={{
        background: 'rgba(4, 12, 30, 0.88)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        <div className="min-w-0">
          <h1 className="text-base font-semibold text-white/90 truncate" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: '-0.02em' }}>
            {pageTitle}
          </h1>
          <p className="hidden sm:block text-[10px] font-medium text-white/28 uppercase tracking-[0.12em] mt-px">
            Brain Link Tracker
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Campaigns quick link */}
        <div className="hidden md:block">
          <RouterLink
            to="/campaigns"
            className="btn-secondary text-xs h-8 px-3 flex items-center gap-1.5 !py-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Campaigns
          </RouterLink>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white"
                    style={{ boxShadow: '0 0 8px rgba(59,130,246,0.6)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-80 p-0 border-0"
            style={{
              background: 'rgba(8,15,38,0.97)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-white/5">
              <h4 className="text-sm font-semibold text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="badge-dim-blue text-[10px] px-1.5 py-0.5">{unreadCount} new</span>
              )}
            </div>

            <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-6 h-6 text-white/15 mx-auto mb-2" />
                  <p className="text-white/30 text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <RouterLink
                    key={n.id}
                    to="/notifications"
                    className="flex gap-3 p-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center ${!n.is_read ? 'bg-blue-500/15' : 'bg-white/5'}`}>
                      <Bell className={`w-3.5 h-3.5 ${!n.is_read ? 'text-blue-400' : 'text-white/30'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${!n.is_read ? 'font-semibold text-white/90' : 'text-white/50'}`}>{n.title}</p>
                      <p className="text-[10px] text-white/30 mt-0.5 truncate">{n.message}</p>
                    </div>
                  </RouterLink>
                ))
              )}
            </div>

            <div className="p-2">
              <RouterLink
                to="/notifications"
                className="block text-center text-xs font-semibold text-blue-400 hover:text-blue-300 py-1.5 rounded-lg hover:bg-blue-500/5 transition-colors"
              >
                View all notifications
              </RouterLink>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="w-px h-5 bg-white/8 mx-1 hidden sm:block" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/8"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar_url} alt={user?.username} />
                <AvatarFallback
                  className="text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[13px] font-semibold text-white/85 leading-none">{user?.username || 'User'}</span>
                <span
                  className="text-[10px] mt-0.5 px-1.5 py-px rounded-full font-semibold capitalize leading-none"
                  style={{ background: planStyle.bg, color: planStyle.text, border: `1px solid ${planStyle.border}` }}
                >
                  {roleName}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/30 hidden sm:block" />
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 border-0 p-1"
            style={{
              background: 'rgba(8,15,38,0.97)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div className="px-3 py-2.5 mb-1 rounded-lg bg-white/[0.03]">
              <p className="text-sm font-semibold text-white/90">{user?.username || 'User'}</p>
              <p className="text-xs text-white/35 mt-0.5 truncate">{user?.email}</p>
            </div>

            <DropdownMenuSeparator className="bg-white/[0.05] my-1" />

            <DropdownMenuGroup>
              {[
                { to: '/profile',  icon: User,       label: 'My Profile' },
                { to: '/settings', icon: Settings,    label: 'Settings' },
                { to: '/settings', icon: CreditCard,  label: 'Subscription' },
              ].map(item => (
                <DropdownMenuItem key={item.label} asChild className="cursor-pointer rounded-lg focus:bg-white/5">
                  <RouterLink to={item.to} className="flex items-center text-white/55 hover:text-white/85 text-sm">
                    <item.icon className="mr-2.5 h-4 w-4" />
                    {item.label}
                  </RouterLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            {isAdmin && (
              <>
                <DropdownMenuSeparator className="bg-white/[0.05] my-1" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-blue-500/10">
                  <RouterLink to="/admin" className="flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium">
                    <Shield className="mr-2.5 h-4 w-4" />
                    Admin Panel
                  </RouterLink>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator className="bg-white/[0.05] my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer rounded-lg text-red-400 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300 text-sm"
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
