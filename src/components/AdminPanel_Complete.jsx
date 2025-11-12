import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Shield,
  CreditCard,
  MessageSquare,
  FileText,
  Settings,
  ArrowLeft,
  Trash2,
  Edit,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react'
import { toast } from 'sonner'

const AdminPanel = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    dashboard: null,
    users: [],
    campaigns: [],
    threats: [],
    subscriptions: [],
    tickets: [],
    logs: [],
    domains: [],
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUserAndData()
  }, [])

  const fetchUserAndData = async () => {
    try {
      setLoading(true)

      // Fetch current user
      const userRes = await fetch('/api/auth/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)

        // Only main_admin and admin can access admin panel
        if (userData.role !== 'admin' && userData.role !== 'main_admin') {
          navigate('/dashboard')
          return
        }
      }

      // Fetch all admin data
      await Promise.all([
        fetchDashboardData(),
        fetchUsers(),
        fetchCampaigns(),
        fetchThreats(),
        fetchSubscriptions(),
        fetchTickets(),
        fetchLogs(),
        fetchDomains(),
      ])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin panel')
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) {
        const dashboardData = await res.json()
        setData(prev => ({ ...prev, dashboard: dashboardData }))
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const users = await res.json()
        setData(prev => ({ ...prev, users: Array.isArray(users) ? users : [] }))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns/details')
      if (res.ok) {
        const campaigns = await res.json()
        setData(prev => ({ ...prev, campaigns: Array.isArray(campaigns) ? campaigns : [] }))
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchThreats = async () => {
    try {
      const res = await fetch('/api/admin/security/threats')
      if (res.ok) {
        const threats = await res.json()
        setData(prev => ({ ...prev, threats: Array.isArray(threats) ? threats : [] }))
      }
    } catch (error) {
      console.error('Error fetching threats:', error)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/admin/subscriptions')
      if (res.ok) {
        const subs = await res.json()
        setData(prev => ({ ...prev, subscriptions: Array.isArray(subs) ? subs : [] }))
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/support/tickets')
      if (res.ok) {
        const tickets = await res.json()
        setData(prev => ({ ...prev, tickets: Array.isArray(tickets) ? tickets : [] }))
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs')
      if (res.ok) {
        const logs = await res.json()
        setData(prev => ({ ...prev, logs: Array.isArray(logs) ? logs : [] }))
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/admin/domains')
      if (res.ok) {
        const domains = await res.json()
        setData(prev => ({ ...prev, domains: Array.isArray(domains) ? domains : [] }))
      }
    } catch (error) {
      console.error('Error fetching domains:', error)
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user')
    } finally {
      setSaving(false)
    }
  }

  const deleteCampaign = async (campaignName) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/campaigns/${campaignName}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Campaign deleted successfully')
        fetchCampaigns()
      } else {
        toast.error('Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Error deleting campaign')
    } finally {
      setSaving(false)
    }
  }

  const resolveThreat = async (threatId) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/security/threats/${threatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      })
      if (res.ok) {
        toast.success('Threat resolved')
        fetchThreats()
      }
    } catch (error) {
      console.error('Error resolving threat:', error)
      toast.error('Error resolving threat')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-700 rounded w-1/3"></div>
          <div className="h-96 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user || (user.role !== 'admin' && user.role !== 'main_admin')) {
    return null
  }

  const isMainAdmin = user.role === 'main_admin'
  const filteredUsers = data.users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredCampaigns = data.campaigns.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            {isMainAdmin ? 'System Owner - Full Access' : 'Admin - Limited Access'}
          </p>
        </div>
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 w-full bg-slate-800 border border-slate-700 p-1 overflow-x-auto">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
            <LayoutDashboard className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Subs</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {data.dashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-2">{data.dashboard.total_users || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Total Campaigns</p>
                    <p className="text-3xl font-bold text-white mt-2">{data.dashboard.total_campaigns || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Total Links</p>
                    <p className="text-3xl font-bold text-white mt-2">{data.dashboard.total_links || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Active Threats</p>
                    <p className="text-3xl font-bold text-red-400 mt-2">{data.dashboard.active_threats || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Username</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.id} className="border-slate-700 hover:bg-slate-800">
                    <TableCell className="text-white">{u.username}</TableCell>
                    <TableCell className="text-slate-300">{u.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.role === 'main_admin' ? 'bg-red-900 text-red-200' :
                        u.role === 'admin' ? 'bg-orange-900 text-orange-200' :
                        'bg-blue-900 text-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        u.is_active ? 'bg-green-900 text-green-200' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {u.role !== 'main_admin' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(u.id)}
                            disabled={saving}
                            className="bg-red-900 hover:bg-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-6 space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Campaign
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Campaign Name</TableHead>
                  <TableHead className="text-slate-300">Owner</TableHead>
                  <TableHead className="text-slate-300">Links</TableHead>
                  <TableHead className="text-slate-300">Clicks</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map(c => (
                  <TableRow key={c.id} className="border-slate-700 hover:bg-slate-800">
                    <TableCell className="text-white">{c.name}</TableCell>
                    <TableCell className="text-slate-300">{c.owner_username || 'Unknown'}</TableCell>
                    <TableCell className="text-slate-300">{c.links_count || 0}</TableCell>
                    <TableCell className="text-slate-300">{c.total_clicks || 0}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        c.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCampaign(c.name)}
                          disabled={saving}
                          className="bg-red-900 hover:bg-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Threat Type</TableHead>
                  <TableHead className="text-slate-300">IP Address</TableHead>
                  <TableHead className="text-slate-300">Severity</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.threats.map(t => (
                  <TableRow key={t.id} className="border-slate-700 hover:bg-slate-800">
                    <TableCell className="text-white">{t.threat_type}</TableCell>
                    <TableCell className="text-slate-300 font-mono">{t.ip_address}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        t.severity === 'critical' ? 'bg-red-900 text-red-200' :
                        t.severity === 'high' ? 'bg-orange-900 text-orange-200' :
                        'bg-yellow-900 text-yellow-200'
                      }`}>
                        {t.severity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        t.status === 'resolved' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                      }`}>
                        {t.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t.status !== 'resolved' && (
                        <Button
                          size="sm"
                          onClick={() => resolveThreat(t.id)}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Plan</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.subscriptions.map(s => (
                  <TableRow key={s.id} className="border-slate-700 hover:bg-slate-800">
                    <TableCell className="text-white">{s.user_username}</TableCell>
                    <TableCell className="text-slate-300">{s.plan_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        s.is_active ? 'bg-green-900 text-green-200' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {s.is_active ? 'Active' : 'Expired'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-300">{new Date(s.expires_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="mt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Ticket ID</TableHead>
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Subject</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tickets.map(t => (
                  <TableRow key={t.id} className="border-slate-700 hover:bg-slate-800">
                    <TableCell className="text-white font-mono text-sm">{t.id}</TableCell>
                    <TableCell className="text-slate-300">{t.user_username}</TableCell>
                    <TableCell className="text-white">{t.subject}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        t.status === 'open' ? 'bg-red-900 text-red-200' :
                        t.status === 'in_progress' ? 'bg-yellow-900 text-yellow-200' :
                        'bg-green-900 text-green-200'
                      }`}>
                        {t.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-300">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Action</TableHead>
                  <TableHead className="text-slate-300">Resource</TableHead>
                  <TableHead className="text-slate-300">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.slice(0, 20).map((log, idx) => (
                  <TableRow key={idx} className="border-slate-700 hover:bg-slate-800">
                    <TableCell className="text-white">{log.user_username}</TableCell>
                    <TableCell className="text-slate-300">{log.action}</TableCell>
                    <TableCell className="text-slate-300">{log.resource_type}</TableCell>
                    <TableCell className="text-slate-300">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          {isMainAdmin ? (
            <Alert className="bg-blue-900/20 border-blue-700">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-400">
                As the system owner, you have full access to all system settings. Go to Settings tab to configure payments, integrations, and system parameters.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-yellow-900/20 border-yellow-700">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-400">
                As an admin, you have limited access to system settings. Contact the system owner to modify critical configurations.
              </AlertDescription>
            </Alert>
          )}

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-white font-semibold">{data.users.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Campaigns</p>
                <p className="text-white font-semibold">{data.campaigns.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Threats</p>
                <p className="text-red-400 font-semibold">{data.threats.filter(t => t.status !== 'resolved').length}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPanel

