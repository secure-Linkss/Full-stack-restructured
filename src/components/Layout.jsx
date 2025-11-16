import './mobile-fixes.css'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'
import {
  LayoutDashboard,
  TrendingUp,
  Link2,
  Settings,
  Globe,
  Shield,
  Zap,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ShieldAlert,
  BarChart3,
  Bell,
  FolderKanban,
} from 'lucide-react'

const Layout = ({ children, user: propUser, logout: propLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(propUser || null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(!propUser)
  const [notificationCount, setNotificationCount] = useState(0)

  // Fetch user data if not provided via props
  useEffect(() => {
    if (propUser) {
      setUser(propUser)
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          }
        } else {
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        localStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [propUser])

  const handleLogout = async () => {
    if (propLogout) {
      propLogout()
    } else {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
        localStorage.removeItem('token')
        setUser(null)
        navigate('/login')
      } catch (error) {
        console.error('Error logging out:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-white text-xl">Please log in to continue</div>
      </div>
    )
  }

  // Determine if user is admin
  const isAdmin = user.role === 'admin' || user.role === 'main_admin'
  const isMainAdmin = user.role === 'main_admin'

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'campaigns', label: 'Campaigns', icon: FolderKanban, path: '/campaigns' },
    { id: 'links', label: 'Tracking Links', icon: Link2, path: '/links' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'geography', label: 'Geography', icon: Globe, path: '/geography' },
    { id: 'security', label: 'Security', icon: Shield, path: '/security' },
    { id: 'shortener', label: 'Link Shortener', icon: Zap, path: '/shortener' },
    { id: 'live-activity', label: 'Live Activity', icon: TrendingUp, path: '/live-activity' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications', badge: notificationCount > 0 ? notificationCount : null },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ]

  const currentPath = location.pathname
  const Logo = ({ size = 'md' }) => {
    const sizes = {
      sm: 'text-lg',
      md: 'text-2xl',
      lg: 'text-3xl'
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50"></div>
          <Shield className={`relative h-8 w-8 text-blue-400`} />
        </div>
        <div>
          <h1 className={`${sizes[size]} font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent`}>
            Brain Link
          </h1>
          <p className="text-xs text-slate-400 -mt-1">Tracker Pro</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-slate-900 border-r border-slate-800">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Logo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
            return (
              <Button
                key={item.id}
                onClick={() => navigate(item.path)}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
                {item.badge && (
                  <Badge 
                    variant={item.path === '/notifications' && notificationCount > 0 ? "destructive" : "secondary"} 
                    className={`ml-auto text-xs ${
                      item.path === '/notifications' && notificationCount > 0 
                        ? 'bg-red-600 text-white' 
                        : 'bg-slate-600 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            )
          })}
        </nav>

        {/* Admin Panel - Desktop */}
        {isAdmin && (
          <div className="p-4 border-t border-slate-800">
            <Button
              onClick={() => navigate('/admin')}
              variant="ghost"
              className={`w-full justify-start ${
                currentPath === '/admin' || currentPath.startsWith('/admin/')
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="mr-3 h-4 w-4" />
              Admin Panel
              {isMainAdmin && (
                <Badge className="ml-auto bg-red-700 text-white text-xs">OWNER</Badge>
              )}
            </Button>
          </div>
        )}

        {/* User Profile - Desktop */}
        <div className="p-4 border-t border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white truncate">{user.username || user.email}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-56">
              <div className="px-2 py-2 border-b border-slate-700">
                <p className="text-sm font-medium text-white">{user.username || user.email}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
                <Badge className="mt-2 text-xs" variant="outline">
                  {user.plan_type || 'free'} plan
                </Badge>
              </div>
              <DropdownMenuItem onClick={() => navigate('/profile')} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile & Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <Logo size="sm" />
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-500 text-blue-400 bg-slate-800 text-xs px-2 py-1">
              {user?.role === 'main_admin' ? 'Main Admin' :
               user?.role === 'admin' ? 'Admin' : 'Member'}
            </Badge>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-800">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {user.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-56">
                  <div className="px-2 py-2 border-b border-slate-700">
                    <p className="text-sm font-medium text-white">{user.username || user.email}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <Badge className="mt-2 text-xs" variant="outline">
                      {user.plan_type || 'free'} plan
                    </Badge>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-slate-900 border-b border-slate-800 px-6 py-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-blue-500 text-blue-400 bg-slate-800">
              <UserIcon className="h-3 w-3 mr-1" />
              A1
            </Badge>
            {user && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  user.role === 'main_admin'
                    ? 'border-purple-500 text-purple-400 bg-purple-900/20'
                    : user.role === 'admin'
                    ? 'border-blue-500 text-blue-400 bg-blue-900/20'
                    : 'border-green-500 text-green-400 bg-green-900/20'
                }`}
              >
                {user.role === 'main_admin' ? 'Main Admin' :
                 user.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5 text-slate-400 cursor-pointer hover:text-white" onClick={() => navigate('/notifications')} />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-56">
                  <div className="px-2 py-2 border-b border-slate-700">
                    <p className="text-sm font-medium text-white">{user.username || user.email}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <Badge className="mt-2 text-xs" variant="outline">
                      {user.plan_type || 'free'} plan
                    </Badge>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <Logo size="sm" />
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
                  return (
                    <Button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path)
                        setMobileMenuOpen(false)
                      }}
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                      {item.badge && (
                        <Badge 
                          variant={item.path === '/notifications' && notificationCount > 0 ? "destructive" : "secondary"} 
                          className={`ml-auto text-xs ${
                            item.path === '/notifications' && notificationCount > 0 
                              ? 'bg-red-600 text-white' 
                              : 'bg-slate-600 text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  )
                })}
              </nav>

              {isAdmin && (
                <div className="p-4 border-t border-slate-800">
                  <Button
                    onClick={() => {
                      navigate('/admin')
                      setMobileMenuOpen(false)
                    }}
                    variant="ghost"
                    className={`w-full justify-start ${
                      currentPath === '/admin' || currentPath.startsWith('/admin/')
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ShieldAlert className="mr-3 h-4 w-4" />
                    Admin Panel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout