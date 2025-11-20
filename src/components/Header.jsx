import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Bell, User, LogOut, Settings, LayoutDashboard, MessageSquare, ChevronDown, Menu } from 'lucide-react';
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

const Header = ({ user, logout, pageTitle, setIsMobileOpen }) => {
  const handleLogout = () => {
    logout();
    toast.info('You have been logged out.');
  };

  // Mock data for unread count
  const unreadNotifications = 12; 
  const userRole = user?.role === 'main_admin' ? 'Main Admin' : user?.role;
  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      
      {/* Left Side: Mobile Menu Button and Page Title */}
      <div className="flex items-center">
        <button
          className="lg:hidden p-2 mr-4 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Right Side: Notifications and User Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications Icon */}
        <RouterLink to="/notifications" className="relative">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Bell className="h-5 w-5" />
          </Button>
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </RouterLink>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 p-1 rounded-full hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || 'https://i.pravatar.cc/150?img=1'} alt={user?.username} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">{user?.username || 'User'}</span>
                <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.username || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <RouterLink to="/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <RouterLink to="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <RouterLink to="/notifications" className="flex items-center cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="ml-auto text-xs font-bold text-red-500">{unreadNotifications}</span>
                  )}
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <RouterLink to="/tickets" className="flex items-center cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Support</span>
                </RouterLink>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {user?.role === 'main_admin' || user?.role === 'admin' ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <RouterLink to="/admin" className="flex items-center cursor-pointer text-primary">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </RouterLink>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
