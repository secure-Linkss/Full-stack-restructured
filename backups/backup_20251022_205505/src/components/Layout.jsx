import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Link2,
  Activity,
  Target,
  BarChart3,
  Globe,
  Shield,
  Settings,
  Scissors,
  Bell,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react'
import Logo from './Logo'

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Fetch notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      // Fetch notification count
      const countResponse = await fetch("/api/notifications/count")
      if (countResponse.ok) {
        const countData = await countResponse.json()
        setNotificationCount(countData.count || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: '1' },
    { path: '/tracking-links', label: 'Tracking Links', icon: Link2, badge: '2' },
    { path: '/live-activity', label: 'Live Activity', icon: Activity, badge: '3' },
    { path: '/campaign', label: 'Campaign', icon: Target, badge: '4' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, badge: '5' },
    { path: '/geography', label: 'Geography', icon: Globe, badge: '6' },
    { path: '/security', label: 'Security', icon: Shield, badge: '7' },
    { path: '/settings', label: 'Settings', icon: Settings, badge: '8' },
    { path: '/link-shortener', label: 'Link Shortener', icon: Scissors, badge: '9' },
    { path: '/notifications', label: 'Notifications', icon: Bell, badge: notificationCount > 0 ? notificationCount.toString() : '11' },
    { path: '/admin-panel', label: 'Admin Panel', icon: User, badge: '10' },
  ]

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="hidden md:flex w-64 bg-slate-800 border-r border-slate-700 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <Logo size="md" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start text-left ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => navigate(item.path)}
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
      </div>

      {/* Mobile Sidebar */}
      <div className={`
        md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo & Mobile Close Button */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start text-left ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => {
                  navigate(item.path)
                  setMobileMenuOpen(false)
                }}
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-700 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <Logo size="sm" />
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-500 text-blue-400 bg-slate-700 text-xs px-2 py-1">
              {user?.role === 'main_admin' ? 'Main Admin' :
               user?.role === 'admin' ? 'Admin' : 'Member'}
            </Badge>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-700">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {user.email?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-48">
                  <DropdownMenuItem onClick={onLogout} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-slate-800 border-b border-slate-700 px-6 py-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-blue-500 text-blue-400 bg-slate-700">
              <User className="h-3 w-3 mr-1" />
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
            <Bell className="h-5 w-5 text-slate-400" />
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
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-48">
                  <DropdownMenuItem onClick={onLogout} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
