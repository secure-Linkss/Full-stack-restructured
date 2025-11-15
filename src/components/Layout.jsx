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
import {
  LayoutDashboard,
  TrendingUp,
  Link2,
  Settings,
  Globe,
  Shield,
  Zap,
  LogOut,
  User,
  Menu,
  X,
  ShieldAlert,
  BarChart3,
  Bell,
} from 'lucide-react'

const Layout = ({ children, user: propUser, logout: propLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(propUser || null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(!propUser)

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
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white text-xl">Please log in to continue</div>
      </div>
    )
  }

  // Determine if user is admin (admin or main_admin)
  const isAdmin = user.role === 'admin' || user.role === 'main_admin'
  const isMainAdmin = user.role === 'main_admin'

  // Personal tabs (visible to all roles)
  const personalTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'campaigns', label: 'Campaigns', icon: TrendingUp, path: '/campaigns' },
    { id: 'links', label: 'Tracking Links', icon: Link2, path: '/links' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'geography', label: 'Geography', icon: Globe, path: '/geography' },
    { id: 'security', label: 'Security', icon: Shield, path: '/security' },
    { id: 'shortener', label: 'Link Shortener', icon: Zap, path: '/shortener' },
    { id: 'live-activity', label: 'Live Activity', icon: TrendingUp, path: '/live-activity' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ]

  // Admin panel tab (only visible to admin and main_admin)
  const adminTab = {
    id: 'admin',
    label: 'Admin Panel',
    icon: isMainAdmin ? ShieldAlert : Shield,
    path: '/admin',
  }

  // Determine current tab
  const currentPath = location.pathname
  const currentTab = personalTabs.find(tab => currentPath.startsWith(tab.path))?.id ||
                     (currentPath.startsWith('/admin') ? 'admin' : null)

  // Get user initials for avatar
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    return user.email?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'
  }

  // Get role badge color
  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'main_admin':
        return 'bg-red-600'
      case 'admin':
        return 'bg-orange-600'
      case 'member':
        return 'bg-blue-600'
      default:
        return 'bg-slate-600'
    }
  }

  // Get role display name
  const getRoleDisplayName = () => {
    switch (user.role) {
      case 'main_admin':
        return 'Main Admin'
      case 'admin':
        return 'Admin'
      case 'member':
        return 'Member'
      default:
        return 'User'
    }
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-blue-400">Brain Link</h1>
          <p className="text-xs text-slate-400 mt-1">Tracker Pro</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${getRoleBadgeColor()} flex items-center justify-center font-bold text-sm hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500`}>
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
              <span className="inline-block text-xs px-2 py-1 mt-1 bg-slate-700 rounded">
                {getRoleDisplayName()}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Tabs */}
        <div className="flex-1 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-3">
            Personal Dashboard
          </p>
          {personalTabs.map(tab => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  navigate(tab.path)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Admin Panel Tab - Only for admin and main_admin */}
        {isAdmin && (
          <div className="p-4 border-t border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-3">
              System Management
            </p>
            <button
              onClick={() => {
                navigate(adminTab.path)
                setMobileMenuOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                currentTab === 'admin'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <adminTab.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-semibold">{adminTab.label}</span>
              {isMainAdmin && <span className="ml-auto text-xs bg-red-700 px-2 py-1 rounded">OWNER</span>}
            </button>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Mobile & Desktop */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Title */}
          <div className="hidden md:block flex-1">
            <h2 className="text-lg font-semibold text-white">
              {currentTab === 'admin' ? 'Admin Panel' : 'Dashboard'}
            </h2>
          </div>

          {/* Profile Dropdown - Desktop */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`w-10 h-10 rounded-full ${getRoleBadgeColor()} flex items-center justify-center font-bold text-sm hover:opacity-80 transition-opacity`}>
                  {getInitials()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white w-56 z-50">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="font-semibold text-sm">{user.username}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                  <span className={`inline-block text-xs px-2 py-1 mt-2 ${getRoleBadgeColor()} rounded`}>
                    {getRoleDisplayName()}
                  </span>
                </div>

                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-slate-700" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:bg-slate-700 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Profile Dropdown - Mobile */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`w-10 h-10 rounded-full ${getRoleBadgeColor()} flex items-center justify-center font-bold text-sm hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                  {getInitials()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white w-48 z-50">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="font-semibold text-sm">{user.username}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>

                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                    >
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="bg-slate-700" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:bg-slate-700 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 space-y-2 max-h-96 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-3">
              Personal Dashboard
            </p>
            {personalTabs.map(tab => {
              const Icon = tab.icon
              const isActive = currentTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    navigate(tab.path)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              )
            })}

            {isAdmin && (
              <>
                <div className="my-3 border-t border-slate-700"></div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-3">
                  System Management
                </p>
                <button
                  onClick={() => {
                    navigate(adminTab.path)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    currentTab === 'admin'
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <adminTab.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">{adminTab.label}</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-900">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
