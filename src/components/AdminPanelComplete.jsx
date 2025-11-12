import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, Shield, Zap, FileText, Settings, AlertCircle, Loader, Search, Eye, EyeOff, TrendingUp, Activity, Lock, Server } from 'lucide-react'
import { toast } from 'sonner'

const AdminPanel = () => {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    dashboard: null,
    users: [],
    campaigns: [],
    security: [],
    subscriptions: [],
    tickets: [],
    auditLogs: [],
    domains: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current user
      const userRes = await fetch('/api/auth/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
      }

      // Verify user is admin
      if (user && user.role !== 'admin' && user.role !== 'main_admin') {
        window.location.href = '/dashboard'
        return
      }

      // Fetch all admin data
      const [
        dashboardRes,
        usersRes,
        campaignsRes,
        securityRes,
        subscriptionsRes,
        ticketsRes,
        auditRes,
        domainsRes
      ] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/users'),
        fetch('/api/admin/campaigns/details'),
        fetch('/api/admin/security/threats'),
        fetch('/api/admin/subscriptions'),
        fetch('/api/admin/support/tickets'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/domains')
      ])

      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null
      const usersData = usersRes.ok ? await usersRes.json() : []
      const campaignsData = campaignsRes.ok ? await campaignsRes.json() : []
      const securityData = securityRes.ok ? await securityRes.json() : []
      const subscriptionsData = subscriptionsRes.ok ? await subscriptionsRes.json() : []
      const ticketsData = ticketsRes.ok ? await ticketsRes.json() : []
      const auditData = auditRes.ok ? await auditRes.json() : []
      const domainsData = domainsRes.ok ? await domainsRes.json() : []

      setData({
        dashboard: dashboardData,
        users: Array.isArray(usersData) ? usersData : [],
        campaigns: Array.isArray(campaignsData) ? campaignsData : [],
        security: Array.isArray(securityData) ? securityData : [],
        subscriptions: Array.isArray(subscriptionsData) ? subscriptionsData : [],
        tickets: Array.isArray(ticketsData) ? ticketsData : [],
        auditLogs: Array.isArray(auditData) ? auditData : [],
        domains: Array.isArray(domainsData) ? domainsData : []
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-white text-lg">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  const isMainAdmin = user?.role === 'main_admin'

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400 text-sm sm:text-base">System management and monitoring</p>
        </div>
        <Button onClick={fetchAllData} variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
          <Loader className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 w-full bg-slate-800 border border-slate-700 p-1 overflow-x-auto">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
            <Zap className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
            <Lock className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Subs</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs sm:text-sm">
            <Activity className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-2">{data.dashboard?.total_users || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Total Campaigns</p>
                  <p className="text-3xl font-bold text-white mt-2">{data.dashboard?.total_campaigns || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Total Links</p>
                  <p className="text-3xl font-bold text-white mt-2">{data.dashboard?.total_links || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Active Threats</p>
                  <p className="text-3xl font-bold text-white mt-2">{data.dashboard?.active_threats || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
            <Button className="bg-blue-600 hover:bg-blue-700">Add User</Button>
          </div>

          <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Username</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Role</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map(u => (
                    <TableRow key={u.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">{u.username}</TableCell>
                      <TableCell className="text-slate-300">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          u.role === 'main_admin' ? 'bg-red-900 text-red-200' :
                          u.role === 'admin' ? 'bg-orange-900 text-orange-200' :
                          'bg-blue-900 text-blue-200'
                        }`}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          u.is_active ? 'bg-green-900 text-green-200' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Total Campaigns</p>
                <p className="text-2xl font-bold text-white mt-1">{data.campaigns.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{data.campaigns.filter(c => c.status === 'active').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Paused</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{data.campaigns.filter(c => c.status === 'paused').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Top CTR</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {Math.max(...data.campaigns.map(c => c.ctr || 0), 0).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Campaign Name</TableHead>
                    <TableHead className="text-slate-300">Owner</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Emails Sent</TableHead>
                    <TableHead className="text-slate-300">Opens</TableHead>
                    <TableHead className="text-slate-300">Clicks</TableHead>
                    <TableHead className="text-slate-300">CTR (%)</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.campaigns.map(c => (
                    <TableRow key={c.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">{c.name}</TableCell>
                      <TableCell className="text-slate-300">{c.owner_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          c.status === 'active' ? 'bg-green-900 text-green-200' :
                          c.status === 'paused' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{c.emails_sent || 0}</TableCell>
                      <TableCell className="text-slate-300">{c.opens || 0}</TableCell>
                      <TableCell className="text-slate-300">{c.clicks || 0}</TableCell>
                      <TableCell className="text-slate-300">{(c.ctr || 0).toFixed(2)}%</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Active Sessions</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{data.dashboard?.active_sessions || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Blocked IPs</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{data.security.filter(s => s.status === 'blocked').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Failed Logins (24h)</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{data.dashboard?.failed_logins_24h || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Active Threats</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{data.security.filter(s => s.severity === 'high').length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-white">Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">User / Email</TableHead>
                    <TableHead className="text-slate-300">IP Address</TableHead>
                    <TableHead className="text-slate-300">Event Type</TableHead>
                    <TableHead className="text-slate-300">Severity</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.security.map((s, idx) => (
                    <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-slate-300 text-sm">{new Date(s.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-white">{s.user_email || 'Unknown'}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">{s.ip_address}</TableCell>
                      <TableCell className="text-slate-300">{s.event_type}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          s.severity === 'high' ? 'bg-red-900 text-red-200' :
                          s.severity === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-blue-900 text-blue-200'
                        }`}>
                          {s.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          s.status === 'resolved' ? 'bg-green-900 text-green-200' :
                          s.status === 'blocked' ? 'bg-red-900 text-red-200' :
                          'bg-yellow-900 text-yellow-200'
                        }`}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          Block IP
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Total Subscribers</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{data.subscriptions.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Active Plans</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{data.subscriptions.filter(s => s.status === 'active').length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">MRR</p>
                <p className="text-2xl font-bold text-green-400 mt-1">${(data.subscriptions.reduce((sum, s) => sum + (s.monthly_amount || 0), 0)).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{data.subscriptions.filter(s => {
                  const expiry = new Date(s.expiry_date)
                  const soon = new Date()
                  soon.setDate(soon.getDate() + 7)
                  return expiry < soon && expiry > new Date()
                }).length}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-white">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Plan</TableHead>
                    <TableHead className="text-slate-300">Start Date</TableHead>
                    <TableHead className="text-slate-300">Expiry</TableHead>
                    <TableHead className="text-slate-300">Payment Status</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.subscriptions.map((s, idx) => (
                    <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white">{s.user_email || 'Unknown'}</TableCell>
                      <TableCell className="text-slate-300">{s.plan_name}</TableCell>
                      <TableCell className="text-slate-300 text-sm">{new Date(s.start_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-300 text-sm">{new Date(s.expiry_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          s.payment_status === 'paid' ? 'bg-green-900 text-green-200' :
                          s.payment_status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-red-900 text-red-200'
                        }`}>
                          {s.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">${s.monthly_amount || 0}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="mt-6 space-y-6">
          <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-white">Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Ticket ID</TableHead>
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Subject</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tickets.map((t, idx) => (
                    <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-mono text-sm">#{t.id}</TableCell>
                      <TableCell className="text-slate-300">{t.user_email}</TableCell>
                      <TableCell className="text-slate-300">{t.subject}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          t.status === 'open' ? 'bg-blue-900 text-blue-200' :
                          t.status === 'in_progress' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-green-900 text-green-200'
                        }`}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="mt-6 space-y-6">
          <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-white">Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">ID</TableHead>
                    <TableHead className="text-slate-300">User / Admin</TableHead>
                    <TableHead className="text-slate-300">Action</TableHead>
                    <TableHead className="text-slate-300">Resource</TableHead>
                    <TableHead className="text-slate-300">Timestamp</TableHead>
                    <TableHead className="text-slate-300">IP</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.auditLogs.map((log, idx) => (
                    <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-mono text-sm">#{log.id}</TableCell>
                      <TableCell className="text-slate-300">{log.user_email}</TableCell>
                      <TableCell className="text-slate-300">{log.action}</TableCell>
                      <TableCell className="text-slate-300">{log.resource}</TableCell>
                      <TableCell className="text-slate-300 text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">{log.ip_address}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          log.status === 'success' ? 'bg-green-900 text-green-200' :
                          'bg-red-900 text-red-200'
                        }`}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Domain Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Domain</TableHead>
                    <TableHead className="text-slate-300">IP</TableHead>
                    <TableHead className="text-slate-300">SSL Status</TableHead>
                    <TableHead className="text-slate-300">Verification</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Last Checked</TableHead>
                    <TableHead className="text-slate-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.domains.map((d, idx) => (
                    <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-mono text-sm">{d.domain}</TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">{d.ip_address}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          d.ssl_status === 'valid' ? 'bg-green-900 text-green-200' :
                          'bg-yellow-900 text-yellow-200'
                        }`}>
                          {d.ssl_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          d.verification === 'verified' ? 'bg-green-900 text-green-200' :
                          'bg-yellow-900 text-yellow-200'
                        }`}>
                          {d.verification}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          d.status === 'active' ? 'bg-green-900 text-green-200' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">{new Date(d.last_checked).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPanel

