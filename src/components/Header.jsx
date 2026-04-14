import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Bell, User, LogOut, Settings, LayoutDashboard, MessageSquare, ChevronDown, Menu, Shield, CreditCard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import api from '../services/api';

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
      } catch (error) {
        // fail silently for header
      }
    };
    fetchNotifs();
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out.');
  };

  const userRole = user?.role === 'main_admin' ? 'Main Admin' : user?.role;
  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      
      {/* Left Side: Mobile Menu Button and Page Title */}
      <div className="flex items-center">
        <button
          className="lg:hidden p-2 mr-3 text-muted-foreground hover:text-foreground transition-colors hover:bg-white/5 rounded-md"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg lg:text-xl font-heading text-foreground tracking-tight">{pageTitle}</h1>
          <p className="hidden sm:block text-xs font-medium text-muted-foreground mt-0.5 tracking-wider uppercase">
            Workspace Overview
          </p>
        </div>
      </div>

      {/* Right Side: Actions and User Profile */}
      <div className="flex items-center space-x-3 lg:space-x-4">
        
        {/* Quick Action Button */}
        <div className="hidden md:block">
           <button className="btn-primary text-sm shadow-sm">
             <LayoutDashboard className="w-4 h-4 mr-1.5" />
             Create Campaign
           </button>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative group p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-white/5 rounded-full outline-none">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.5)] border border-[#141d2e]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border shadow-2xl p-0">
            <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/50 rounded-t-sm">
              <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
              {unreadCount > 0 && (
                <span className="badge-dim-blue text-[10px] px-1.5 py-0.5">{unreadCount} New</span>
              )}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-text-muted-foreground text-xs">No notifications yet.</p>
                </div>
              ) : (
                notifications.slice(0, 4).map(notification => (
                  <RouterLink 
                    key={notification.id} 
                    to="/notifications" 
                    className={`p-3 border-b border-border flex gap-3 hover:bg-white/5 transition-colors ${!notification.is_read ? 'bg-[rgba(59,130,246,0.03)]' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                       {notification.type === 'security' ? <Shield className="w-4 h-4 text-[#ef4444]" /> : <Bell className={`w-4 h-4 ${!notification.is_read ? 'text-[#3b82f6]' : 'text-muted-foreground'}`} />}
                    </div>
                    <div>
                      <p className={`text-xs ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{notification.message}</p>
                    </div>
                  </RouterLink>
                ))
              )}
            </div>
            <div className="p-2 border-t border-border bg-secondary/30 rounded-b-sm">
              <RouterLink to="/notifications" className="block text-center text-xs font-semibold text-[#3b82f6] hover:underline py-1">
                View All Notifications
              </RouterLink>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-border">
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarImage src={user?.avatar_url || 'https://i.pravatar.cc/150?img=11'} alt={user?.username} />
                <AvatarFallback className="bg-gradient-to-br from-[#10b981] to-[#3b82f6] text-white text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start px-1">
                <span className="text-[13px] font-medium text-foreground leading-none mb-1">{user?.username || 'Admin User'}</span>
                <span className="text-[11px] text-muted-foreground capitalize leading-none">{userRole || 'Super Admin'}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 bg-card border-border shadow-2xl" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3 bg-secondary/50 rounded-t-sm m-1">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">{user?.username || 'Admin User'}</p>
                <p className="text-xs leading-none text-muted-foreground pt-1">
                  {user?.email || 'admin@enterprise.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer rounded-md">
                <RouterLink to="/profile" className="flex items-center text-muted-foreground hover:text-foreground">
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer rounded-md">
                <RouterLink to="/settings" className="flex items-center text-muted-foreground hover:text-foreground">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer rounded-md">
                <RouterLink to="/settings" className="flex items-center text-muted-foreground hover:text-foreground">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>My Subscription</span>
                </RouterLink>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {user?.role === 'main_admin' || user?.role === 'admin' ? (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuGroup className="p-1">
                  <DropdownMenuItem asChild className="focus:bg-[rgba(16,185,129,0.1)] cursor-pointer rounded-md">
                    <RouterLink to="/admin" className="flex items-center text-[#10b981]">
                      <Shield className="mr-2 h-4 w-4" />
                      <span className="font-medium">System Administration</span>
                    </RouterLink>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}

            <DropdownMenuSeparator className="bg-border" />
            <div className="p-1">
               <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#ef4444] focus:bg-[rgba(239,68,68,0.1)] focus:text-[#ef4444] rounded-md">
                 <LogOut className="mr-2 h-4 w-4" />
                 <span className="font-medium">Sign Out</span>
               </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
