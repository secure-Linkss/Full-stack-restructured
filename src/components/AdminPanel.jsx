import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Users, Shield, Globe, Wallet, MessageSquare, Database,
  Plus, Trash2, Edit, CheckCircle, XCircle, AlertCircle,
  Loader, Eye, EyeOff, Copy, RefreshCw, Download, Upload,
  BarChart3, TrendingUp, Activity, Settings, TestTube,
  Mail, Key, Lock, Smartphone, Monitor, CreditCard
} from 'lucide-react'
import { toast } from 'sonner'

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Overview Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLinks: 0,
    totalClicks: 0,
    totalRevenue: 0,
    activeCampaigns: 0
  })

  // Users Management
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    role: 'member',
    plan_type: 'free'
  })

  // Domain Management
  const [domains, setDomains] = useState([])
  const [domainDialogOpen, setDomainDialogOpen] = useState(false)
  const [newDomain, setNewDomain] = useState({
    domain: '',
    is_active: true,
    is_default: false
  })

  // Crypto Wallets
  const [wallets, setWallets] = useState([])
  const [walletDialogOpen, setWalletDialogOpen] = useState(false)
  const [newWallet, setNewWallet] = useState({
    wallet_type: 'BTC',
    wallet_address: '',
    is_active: true
  })

  // System Config
  const [systemConfig, setSystemConfig] = useState({
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_enabled: false,
    maintenance_mode: false,
    enable_registrations: true,
    max_links_per_user: 100,
    company_name: 'Brain Link Tracker Pro',
    company_logo_url: ''
  })

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState([])
  const [securityLogs, setSecurityLogs] = useState([])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      const [statsRes, usersRes, domainsRes, walletsRes, configRes, logsRes, securityRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/domains', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/wallets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/system-config', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/activity-logs', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/security-logs', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(Array.isArray(data) ? data : data.users || [])
      }

      if (domainsRes.ok) {
        const data = await domainsRes.json()
        setDomains(Array.isArray(data) ? data : data.domains || [])
      }

      if (walletsRes.ok) {
        const data = await walletsRes.json()
        setWallets(Array.isArray(data) ? data : data.wallets || [])
      }

      if (configRes.ok) {
        const data = await configRes.json()
        setSystemConfig(prev => ({ ...prev, ...data }))
      }

      if (logsRes.ok) {
        const data = await logsRes.json()
        setActivityLogs(Array.isArray(data) ? data : data.logs || [])
      }

      if (securityRes.ok) {
        const data = await securityRes.json()
        setSecurityLogs(Array.isArray(data) ? data : data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  // User Management Functions
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error('Email and password are required')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })

      if (!response.ok) throw new Error('Failed to create user')
      
      toast.success('User created successfully')
      setNewUser({ email: '', username: '', password: '', role: 'member', plan_type: 'free' })
      setUserDialogOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete user')
      
      toast.success('User deleted successfully')
      fetchAllData()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) throw new Error('Failed to update user role')
      
      toast.success('User role updated successfully')
      fetchAllData()
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    }
  }

  // Domain Management Functions
  const handleCreateDomain = async () => {
    if (!newDomain.domain) {
      toast.error('Domain is required')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDomain)
      })

      if (!response.ok) throw new Error('Failed to create domain')
      
      toast.success('Domain added successfully')
      setNewDomain({ domain: '', is_active: true, is_default: false })
      setDomainDialogOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error creating domain:', error)
      toast.error('Failed to create domain')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/domains/${domainId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete domain')
      
      toast.success('Domain deleted successfully')
      fetchAllData()
    } catch (error) {
      console.error('Error deleting domain:', error)
      toast.error('Failed to delete domain')
    }
  }

  const handleToggleDomain = async (domainId, isActive) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/domains/${domainId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: isActive })
      })

      if (!response.ok) throw new Error('Failed to toggle domain')
      
      toast.success(`Domain ${isActive ? 'activated' : 'deactivated'}`)
      fetchAllData()
    } catch (error) {
      console.error('Error toggling domain:', error)
      toast.error('Failed to toggle domain')
    }
  }

  // Wallet Management Functions
  const handleCreateWallet = async () => {
    if (!newWallet.wallet_address) {
      toast.error('Wallet address is required')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newWallet)
      })

      if (!response.ok) throw new Error('Failed to create wallet')
      
      toast.success('Wallet added successfully')
      setNewWallet({ wallet_type: 'BTC', wallet_address: '', is_active: true })
      setWalletDialogOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Error creating wallet:', error)
      toast.error('Failed to create wallet')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWallet = async (walletId) => {
    if (!window.confirm('Are you sure you want to delete this wallet?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/wallets/${walletId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to delete wallet')
      
      toast.success('Wallet deleted successfully')
      fetchAllData()
    } catch (error) {
      console.error('Error deleting wallet:', error)
      toast.error('Failed to delete wallet')
    }
  }

  // System Config Functions
  const handleSaveSystemConfig = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(systemConfig)
      })

      if (!response.ok) throw new Error('Failed to save system config')
      
      toast.success('System configuration saved successfully')
    } catch (error) {
      console.error('Error saving system config:', error)
      toast.error('Failed to save system config')
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/test-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bot_token: systemConfig.telegram_bot_token,
          chat_id: systemConfig.telegram_chat_id
        })
      })

      if (!response.ok) throw new Error('Failed to test Telegram')
      
      toast.success('Test message sent successfully')
    } catch (error) {
      console.error('Error testing Telegram:', error)
      toast.error('Failed to test Telegram connection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Admin Panel...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-slate-400">Manage users, domains, payments, and system configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <BarChart3 className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Users className="h-4 w-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="domains" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Globe className="h-4 w-4 mr-2" /> Domains
          </TabsTrigger>
          <TabsTrigger value="wallets" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Wallet className="h-4 w-4 mr-2" /> Wallets
          </TabsTrigger>
          <TabsTrigger value="telegram" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <MessageSquare className="h-4 w-4 mr-2" /> Telegram
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Settings className="h-4 w-4 mr-2" /> System
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Activity className="h-4 w-4 mr-2" /> Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
                    <p className="text-sm text-green-400 mt-1">{stats.activeUsers} active</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase">Total Links</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.totalLinks}</p>
                    <p className="text-sm text-slate-400 mt-1">{stats.activeCampaigns} campaigns</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase">Total Clicks</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.totalClicks.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase">Total Revenue</p>
                    <p className="text-3xl font-bold text-white mt-1">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase">Domains</p>
                    <p className="text-3xl font-bold text-white mt-1">{domains.length}</p>
                    <p className="text-sm text-green-400 mt-1">{domains.filter(d => d.is_active).length} active</p>
                  </div>
                  <Globe className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase">Crypto Wallets</p>
                    <p className="text-3xl font-bold text-white mt-1">{wallets.length}</p>
                    <p className="text-sm text-green-400 mt-1">{wallets.filter(w => w.is_active).length} active</p>
                  </div>
                  <Wallet className="h-8 w-8 text-cyan-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">User Management</CardTitle>
                <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-white">Email *</Label>
                        <Input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Username</Label>
                        <Input
                          value={newUser.username}
                          onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Password *</Label>
                        <Input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Role</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="main_admin">Main Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Plan Type</Label>
                        <Select value={newUser.plan_type} onValueChange={(value) => setNewUser(prev => ({ ...prev, plan_type: value }))}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUserDialogOpen(false)} className="bg-slate-700 border-slate-600 text-white">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400 font-medium">User</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Email</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Role</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Plan</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                      <th className="text-left p-3 text-slate-400 font-medium">Joined</th>
                      <th className="text-right p-3 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="p-3 text-white">{user.username || 'N/A'}</td>
                        <td className="p-3 text-white">{user.email}</td>
                        <td className="p-3">
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-[130px] bg-slate-700 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="main_admin">Main Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <Badge className="bg-blue-600">{user.plan_type || 'free'}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={user.is_active ? 'bg-green-600' : 'bg-slate-600'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-400">{user.created_at}</td>
                        <td className="p-3 text-right">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Domain Management</CardTitle>
                <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Domain
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add New Domain</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-white">Domain *</Label>
                        <Input
                          placeholder="example.com"
                          value={newDomain.domain}
                          onChange={(e) => setNewDomain(prev => ({ ...prev, domain: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Active</Label>
                        <Switch
                          checked={newDomain.is_active}
                          onCheckedChange={(checked) => setNewDomain(prev => ({ ...prev, is_active: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Set as Default</Label>
                        <Switch
                          checked={newDomain.is_default}
                          onCheckedChange={(checked) => setNewDomain(prev => ({ ...prev, is_default: checked }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDomainDialogOpen(false)} className="bg-slate-700 border-slate-600 text-white">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDomain} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Add Domain
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {domains.map((domain) => (
                  <div key={domain.id} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">{domain.domain}</p>
                          <p className="text-sm text-slate-400">Added {domain.created_at}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {domain.is_default && (
                          <Badge className="bg-purple-600">Default</Badge>
                        )}
                        <Switch
                          checked={domain.is_active}
                          onCheckedChange={(checked) => handleToggleDomain(domain.id, checked)}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleDeleteDomain(domain.id)}
                          className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Crypto Wallet Management</CardTitle>
                <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add Crypto Wallet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-white">Wallet Type</Label>
                        <Select value={newWallet.wallet_type} onValueChange={(value) => setNewWallet(prev => ({ ...prev, wallet_type: value }))}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                            <SelectItem value="USDT_TRC20">USDT (TRC20)</SelectItem>
                            <SelectItem value="USDT_ERC20">USDT (ERC20)</SelectItem>
                            <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Wallet Address *</Label>
                        <Input
                          placeholder="Enter wallet address"
                          value={newWallet.wallet_address}
                          onChange={(e) => setNewWallet(prev => ({ ...prev, wallet_address: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Active</Label>
                        <Switch
                          checked={newWallet.is_active}
                          onCheckedChange={(checked) => setNewWallet(prev => ({ ...prev, is_active: checked }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setWalletDialogOpen(false)} className="bg-slate-700 border-slate-600 text-white">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateWallet} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Add Wallet
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-cyan-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{wallet.wallet_type}</p>
                            <Badge className={wallet.is_active ? 'bg-green-600' : 'bg-slate-600'}>
                              {wallet.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400 font-mono">{wallet.wallet_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(wallet.wallet_address)
                            toast.success('Wallet address copied')
                          }}
                          className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleDeleteWallet(wallet.id)}
                          className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Tab */}
        <TabsContent value="telegram" className="mt-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Telegram Bot Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Enable Telegram Notifications</Label>
                  <p className="text-sm text-slate-400">Receive system alerts via Telegram</p>
                </div>
                <Switch
                  checked={systemConfig.telegram_enabled}
                  onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, telegram_enabled: checked }))}
                />
              </div>

              <div>
                <Label className="text-white">Bot Token</Label>
                <Input
                  placeholder="Enter your Telegram bot token"
                  value={systemConfig.telegram_bot_token}
                  onChange={(e) => setSystemConfig(prev => ({ ...prev, telegram_bot_token: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-sm text-slate-500 mt-1">Get your bot token from @BotFather</p>
              </div>

              <div>
                <Label className="text-white">Chat ID</Label>
                <Input
                  placeholder="Enter admin group chat ID"
                  value={systemConfig.telegram_chat_id}
                  onChange={(e) => setSystemConfig(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-sm text-slate-500 mt-1">Send /start to your bot to get the chat ID</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleTestTelegram}
                  disabled={saving}
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button
                  onClick={handleSaveSystemConfig}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="mt-4">
          <div className="space-y-4">
            {/* Stripe Configuration */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Stripe Payment Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable Stripe Payments</Label>
                  <Switch
                    checked={systemConfig.stripe_enabled}
                    onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, stripe_enabled: checked }))}
                  />
                </div>
                <div>
                  <Label className="text-white">Publishable Key</Label>
                  <Input
                    placeholder="pk_live_..."
                    value={systemConfig.stripe_publishable_key}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Secret Key</Label>
                  <Input
                    type="password"
                    placeholder="sk_live_..."
                    value={systemConfig.stripe_secret_key}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SMTP Configuration */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">SMTP Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable SMTP</Label>
                  <Switch
                    checked={systemConfig.smtp_enabled}
                    onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, smtp_enabled: checked }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">SMTP Host</Label>
                    <Input
                      placeholder="smtp.gmail.com"
                      value={systemConfig.smtp_host}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">SMTP Port</Label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={systemConfig.smtp_port}
                      onChange={(e) => setSystemConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white">SMTP Username</Label>
                  <Input
                    value={systemConfig.smtp_user}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">SMTP Password</Label>
                  <Input
                    type="password"
                    value={systemConfig.smtp_password}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* General Settings */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Maintenance Mode</Label>
                    <p className="text-sm text-slate-400">Disable site access for maintenance</p>
                  </div>
                  <Switch
                    checked={systemConfig.maintenance_mode}
                    onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, maintenance_mode: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Registrations</Label>
                    <p className="text-sm text-slate-400">Allow new user registrations</p>
                  </div>
                  <Switch
                    checked={systemConfig.enable_registrations}
                    onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, enable_registrations: checked }))}
                  />
                </div>
                <div>
                  <Label className="text-white">Max Links Per User</Label>
                  <Input
                    type="number"
                    value={systemConfig.max_links_per_user}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, max_links_per_user: parseInt(e.target.value) }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Company Name</Label>
                  <Input
                    value={systemConfig.company_name}
                    onChange={(e) => setSystemConfig(prev => ({ ...prev, company_name: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSaveSystemConfig}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Save All System Configuration
            </Button>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity Logs */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {activityLogs.map((log, index) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                      <div className="flex items-start gap-3">
                        <Activity className="h-4 w-4 text-blue-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-white text-sm">{log.action}</p>
                          <p className="text-xs text-slate-400">{log.user} • {log.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Logs */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Security Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {securityLogs.map((log, index) => (
                    <div key={index} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                      <div className="flex items-start gap-3">
                        <Shield className="h-4 w-4 text-red-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-white text-sm">{log.event}</p>
                          <p className="text-xs text-slate-400">{log.ip_address} • {log.timestamp}</p>
                        </div>
                        <Badge className={log.severity === 'high' ? 'bg-red-600' : 'bg-yellow-600'}>
                          {log.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPanel