import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FolderKanban,
  Shield,
  CreditCard,
  MessageSquare,
  FileText,
  Settings,
  LayoutDashboard,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  Download,
  RefreshCw,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';onUp,
} from 'lucide-react';onUp,
} from 'lucide-react';TrendingUp,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminPanel = () => {
  // State Management
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboardStats, setDashboardStats] = useState(null)
  const [users, setUsers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [systemDeleteDialog, setSystemDeleteDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(nul  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'member',
    status: 'active',
  });  const [securityThreats, setSecurityThreats] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [supportTickets, setSupportTickets] = useState([])
  const [domains, setDomains] = useState([])
  
  // Additional state for enhanced features
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [selectedThreat, setSelectedThreat] = useState(null)
  const [selectedSubscription, setSelectedSubscription] = useState(    const [selectedSupportTicket, setSelectedSupportTicket] = useState(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);

  useEffect(() => {
    loadDashboardStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'campaigns') {
      loadCampaigns()
    } else if (activeTab === 'audit') {
      loadAuditLogs()
    } else if (activeTab === 'security') {
      loadSecurityThreats()
    } else if (activeTab === 'subscriptions') {
      loadSubscriptions()
    } else if (activeTab === 'support') {
      loadSupportTickets()
    } else if (activeTab === 'settings') {
      loadDomains()
    }
  }, [activeTab])

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDashboardStats(data)
      }
    } catch (error) {
      setError('Failed to load dashboard stats')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      setError('Failed to load users')
    }
  }

  const loadCampaigns = async () => {
          const response = await fetch('/api/admin/campaigns/details');tails', {        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      setError('Failed to load campaigns')
    }
  }

  const loadAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data)
      }
    } catch (error) {
      setError('Failed to load audit logs')
    }
  }

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSuccess('User deleted successfully')
        setDeleteDialogOpen(false)
        loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete user')
      }
    } catch (error) {
      setError('Error deleting user')
    }
  }

  const deleteAllSystemData = async () => {
    try {
      const response = await fetch('/api/admin/system/delete-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSuccess('All system data deleted successfully')
        setSystemDeleteDialog(false)
        setConfirmText('')
        loadDashboardStats()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete system data')
      }
    } catch (error) {
      setError('Error deleting system data')
    }
  }

  const createUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        setSuccess('User created successfully')
        setShowCreateUserDialog(false)
        setNewUser({
          username: '',
          email: '',
          password: '',
          role: 'member',
          status: 'active'
        })
        loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create user')
      }
    } catch (error) {
      setError('Error creating user')
    }
  }

  const exportAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'audit_logs.csv'
        a.click()
        setSuccess('Audit logs exported successfully')
      }
    } catch (error) {
      setError('Failed to export audit logs')
    }
  }

  const getRoleBadge = (role) => {
    const colors = {
      'main_admin': 'bg-purple-500',
      'assistant_admin': 'bg-blue-500',
      'admin': 'bg-blue-400',
      'member': 'bg-gray-500'
    }
    return <Badge className={colors[role] || 'bg-gray-500'}>{role}</Badge>
  }

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'bg-yellow-500',
      'active': 'bg-green-500',
      'suspended': 'bg-red-500',
      'expired': 'bg-orange-500'
    }
    return <Badge className={colors[status] || 'bg-gray-500'}>{status}</Badge>
  }

  const loadSecurityThreats = async () => {
    try {
      const response = await fetch('/api/admin/security/threats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSecurityThreats(data.threats || [])
      }
    } catch (error) {
      setError('Failed to load security threats')
    }
  }

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      setError('Failed to load subscriptions')
    }
  }

    const loadDomains = async () => {
    try {
      const response = await fetch("/api/admin/domains", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      }
    } catch (error) {
      setError("Failed to load domains");
    }
  };

  const toggleCampaignExpansion = (campaignId) => {
    setExpandedCampaignId(expandedCampaignId === campaignId ? null : campaignId);
  };

  const toggleCampaignExpansion = (campaignId) => {
    setExpandedCampaignId(expandedCampaignId === campaignId ? null : campaignId);
  };

  const loadSupportTickets = async () => {
    try {
      const response = await fetch('/api/admin/support/tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSupportTickets(data.tickets || [])
      }
    } catch (error) {
      setError('Failed to load support tickets')
    }
  }

  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Responsive */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">Admin Panel</h1>
          <p className="text-sm sm:text-base text-slate-400">Enterprise-grade administration dashboard</p>
        </div>

        {/* Alerts - Mobile Responsive */}
        {error && (
          <Alert className="mb-4 border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400 text-sm sm:text-base">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 bg-green-500/10">
            <AlertDescription className="text-green-400 text-sm sm:text-base">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Tabs - Mobile Responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Tab List - Horizontal Scroll on Mobile */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="bg-slate-800 border-slate-700 p-1 flex w-max min-w-full gap-1 sm:grid sm:grid-cols-8 sm:w-full">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-700 flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap min-w-[70px] sm:min-w-0">
                <LayoutDashboard className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-slate-700 flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap min-w-[70px] sm:min-w-0">
                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-slate-700 flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap min-w-[70px] sm:min-w-0">
                <FolderKanban className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Campaigns</span>
                <span className="sm:hidden">Camp</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-slate-700 flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap min-w-[70px] sm:min-w-0">
                <Shield className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Security</span>
                <span className="sm:hidden">Sec</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="data-[state=active]:bg-slate-700 flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap min-w-[70px] sm:min-w-0">
                <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Subs</span>
                <span className="sm:hidden">Sub</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-slate-700 flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap min-w-[70px] sm:min-w-0">
                <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Support</span>
                <span className="sm:hidden">Supp</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-slate-700 flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap min-w-[70px] sm:min-w-0">
                <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Audit</span>
                <span className="sm:hidden">Aud</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700 flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap min-w-[70px] sm:min-w-0">
                <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {dashboardStats && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-white text-xs sm:text-sm">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-2xl sm:text-3xl font-bold text-blue-400">{dashboardStats.total_users || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-white text-xs sm:text-sm">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-2xl sm:text-3xl font-bold text-green-400">{dashboardStats.active_campaigns || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-white text-xs sm:text-sm">Total Clicks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-2xl sm:text-3xl font-bold text-purple-400">{dashboardStats.total_clicks || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-white text-xs sm:text-sm">Verified</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-2xl sm:text-3xl font-bold text-orange-400">{dashboardStats.verified_conversions || 0}</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Users Tab - Mobile Responsive */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <CardTitle className="text-white text-lg sm:text-xl">User Management</CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={() => setShowCreateUserDialog(true)} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none text-xs sm:text-sm py-2">
                      <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Create User</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                    <Button onClick={loadUsers} size="sm" variant="outline" className="border-slate-600 text-xs sm:text-sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-sm w-full sm:w-[150px]">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="text-xs sm:text-sm">
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Username</TableHead>
                          <TableHead className="text-slate-300 hidden sm:table-cell">Email</TableHead>
                          <TableHead className="text-slate-300">Role</TableHead>
                          <TableHead className="text-slate-300 hidden md:table-cell">Status</TableHead>
                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users && users.length > 0 ? (
                          users.map(user => (
                            <TableRow key={user.id} className="border-slate-700">
                              <TableCell className="text-white text-xs sm:text-sm">{user.username}</TableCell>
                              <TableCell className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">{user.email}</TableCell>
                              <TableCell className="text-xs sm:text-sm">{getRoleBadge(user.role)}</TableCell>
                              <TableCell className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">{getStatusBadge(user.status || 'active')}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-slate-700 border-slate-600">
                                    <DropdownMenuItem className="text-slate-300 text-xs sm:text-sm">
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-slate-600" />
                                    <DropdownMenuItem className="text-red-400 text-xs sm:text-sm" onClick={() => {
                                      setSelectedUser(user)
                                      setDeleteDialogOpen(true)
                                    }}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan="5" className="text-center text-slate-400 py-8 text-xs sm:text-sm">No users found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab - Mobile Responsive */}
          <TabsContent value="campaigns" className="space-y-4 sm:space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg sm:text-xl">Campaign Management</CardTitle>
                  <Button onClick={loadCampaigns} size="sm" variant="outline" className="border-slate-600 text-xs sm:text-sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <Table className="text-xs sm:text-sm">
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Name</TableHead>
                        <TableHead className="text-slate-300 hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-slate-300">Links</TableHead>
                        <TableHead className="text-slate-300 hidden md:table-cell">Clicks</TableHead>
                        <TableHead className="text-slate-300 text-right">Expand</TableHead>
                        <TableHead className="text-slate-300 text-right">Expand</TableHead>
                        <TableHead className="text-slate-300 text-right">Expand</TableHead>
                        <TableHead className="text-slate-300 text-right">Expand</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns && campaigns.length > 0 ? (
                        campaigns.map(campaign => (
                          <TableRow key={campaign.id} className="border-slate-700">
                            <TableCell className="text-white text-xs sm:text-sm">{campaign.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{getStatusBadge(campaign.status)}</TableCell>
                            <TableCell className="text-slate-300 text-xs sm:text-sm">{campaign.link_count || 0}</TableCell>
                            <TableCell className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">{campaign.click_count || 0}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCampaignExpansion(campaign.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                {expandedCampaignId === campaign.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCampaignExpansion(campaign.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                {expandedCampaignId === campaign.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCampaignExpansion(campaign.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                {expandedCampaignId === campaign.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCampaignExpansion(campaign.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                {expandedCampaignId === campaign.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan="4" className="text-center text-slate-400 py-8 text-xs sm:text-sm">No campaigns found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab - Mobile Responsive */}
          <TabsContent value="security" className="space-y-3 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Active</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-red-400">{securityThreats.filter(t => !t.is_blocked).length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Blocked</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-green-400">{securityThreats.filter(t => t.is_blocked).length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Critical</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-orange-400">{securityThreats.filter(t => t.threat_level === 'critical').length}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg sm:text-xl">Security Threats</CardTitle>
                  <Button onClick={() => loadSecurityThreats()} size="sm" variant="outline" className="border-slate-600 text-xs sm:text-sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <Table className="text-xs sm:text-sm">
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">IP</TableHead>
                        <TableHead className="text-slate-300 hidden sm:table-cell">Type</TableHead>
                        <TableHead className="text-slate-300">Level</TableHead>
                        <TableHead className="text-slate-300 hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-slate-300 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityThreats && securityThreats.length > 0 ? (
                        securityThreats.map(threat => (
                          <TableRow key={threat.id} className="border-slate-700">
                            <TableCell className="text-white font-mono text-xs">{threat.ip_address?.substring(0, 12)}...</TableCell>
                            <TableCell className="text-slate-300 hidden sm:table-cell text-xs">{threat.threat_type}</TableCell>
                            <TableCell className="text-xs">
                              <Badge className={threat.threat_level === 'critical' ? 'bg-red-600 text-xs' : 'bg-orange-600 text-xs'}>
                                {threat.threat_level}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs">
                              <Badge className={threat.is_blocked ? 'bg-red-600 text-xs' : 'bg-green-600 text-xs'}>
                                {threat.is_blocked ? 'Blocked' : 'Allowed'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" className="border-slate-600 text-xs" onClick={() => {
                                setSelectedThreat(threat)
                                setShowSecurityModal(true)
                              }}>
                                View
                              </Button>
                            </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan="5" className="text-center text-slate-400 py-8 text-xs">No threats detected.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab - Mobile Responsive */}
          <TabsContent value="subscriptions" className="space-y-3 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Total</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-blue-400">{subscriptions.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Active</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-green-400">{subscriptions.filter(s => s.is_active).length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Expiring</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-orange-400">{subscriptions.filter(s => {
                    const expiry = new Date(s.subscription_expiry)
                    const today = new Date()
                    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24))
                    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
                  }).length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Expired</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-red-400">{subscriptions.filter(s => {
                    const expiry = new Date(s.subscription_expiry)
                    const today = new Date()
                    return expiry < today
                  }).length}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg sm:text-xl">Subscriptions</CardTitle>
                  <Button onClick={() => loadSubscriptions()} size="sm" variant="outline" className="border-slate-600 text-xs sm:text-sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <Table className="text-xs sm:text-sm">
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">User</TableHead>
                        <TableHead className="text-slate-300 hidden sm:table-cell">Plan</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300 hidden md:table-cell">Expiry</TableHead>
                        <TableHead className="text-slate-300 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions && subscriptions.length > 0 ? (
                        subscriptions.map(sub => {
                          const expiry = new Date(sub.subscription_expiry)
                          const today = new Date()
                          const daysLeft = Math.floor((expiry - today) / (1000 * 60 * 60 * 24))
                          return (
                            <TableRow key={sub.id} className="border-slate-700">
                              <TableCell className="text-white text-xs sm:text-sm">{sub.username}</TableCell>
                              <TableCell className="hidden sm:table-cell text-xs">
                                <Badge className={sub.plan_type === 'enterprise' ? 'bg-purple-600 text-xs' : 'bg-blue-600 text-xs'}>
                                  {sub.plan_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                <Badge className={sub.is_active ? 'bg-green-600 text-xs' : 'bg-red-600 text-xs'}>
                                  {sub.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300 hidden md:table-cell text-xs">{expiry.toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" className="border-slate-600 text-xs" onClick={() => {
                                  setSelectedSubscription(sub)
                                  setShowSubscriptionModal(true)
                                }}>
                                  Manage
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan="5" className="text-center text-slate-400 py-8 text-xs">No subscriptions found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className=\w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab - Mobile Responsive */}
          <TabsContent value="support" className="space-y-3 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Total</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-blue-400">{supportTickets.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Open</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-orange-400">{supportTickets.filter(t => t.status === 'open').length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">In Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-yellow-400">{supportTickets.filter(t => t.status === 'in_progress').length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-2 sm:p-4">
                  <CardTitle className="text-white text-xs sm:text-sm">Resolved</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <p className="text-xl sm:text-3xl font-bold text-green-400">{supportTickets.filter(t => t.status === 'resolved').length}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg sm:text-xl">Support Tickets</CardTitle>
                  <Button onClick={() => loadSupportTickets()} size="sm" variant="outline" className="border-slate-600 text-xs sm:text-sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <Table className="text-xs sm:text-sm">
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">ID</TableHead>
                        <TableHead className="text-slate-300 hidden sm:table-cell">Subject</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300 hidden md:table-cell">Priority</TableHead>
                        <TableHead className="text-slate-300 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supportTickets && supportTickets.length > 0 ? (
                        supportTickets.map(ticket => (
                          <TableRow key={ticket.id} className="border-slate-700">
                            <TableCell className="text-white font-mono text-xs">#{ticket.id}</TableCell>
                            <TableCell className="text-white hidden sm:table-cell text-xs">{ticket.subject?.substring(0, 20)}...</TableCell>
                            <TableCell className="text-xs">
                              <Badge className={ticket.status === 'open' ? 'bg-blue-600 text-xs' : 'bg-green-600 text-xs'}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs">
                              <Badge className={ticket.priority === 'high' ? 'bg-red-600 text-xs' : 'bg-orange-600 text-xs'}>
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" className="border-slate-600 text-xs" onClick={() => {
                                setSelectedTicket(ticket)
                                setShowSupportModal(true)
                              }}>
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan="5" className="text-center text-slate-400 py-8 text-xs">No tickets found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab - Mobile Responsive */}
          <TabsContent value="audit" className="space-y-4 sm:space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg sm:text-xl">Audit Logs</CardTitle>
                  <Button onClick={exportAuditLogs} size="sm" variant="outline" className="border-slate-600 text-xs sm:text-sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <Table className="text-xs sm:text-sm">
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">ID</TableHead>
                        <TableHead className="text-slate-300 hidden sm:table-cell">User ID</TableHead>
                        <TableHead className="text-slate-300">Action</TableHead>
                        <TableHead className="text-slate-300 hidden md:table-cell">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map(log => (
                        <TableRow key={log.id} className="border-slate-700">
                          <TableCell className="text-slate-300 text-xs">{log.id}</TableCell>
                          <TableCell className="text-slate-300 hidden sm:table-cell text-xs">{log.user_id}</TableCell>
                          <TableCell className="text-white text-xs">{log.action}</TableCell>
                          <TableCell className="text-slate-300 hidden md:table-cell text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Mobile Responsive */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-white text-lg sm:text-xl">System Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm sm:text-base">Delete All System Data</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">This will permanently delete all data.</p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setSystemDeleteDialog(true)}
                      className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Domain Management</CardTitle>
                <CardDescription>Manage custom domains for short links.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <Input
                    type="text"
                    placeholder="Add new domain (e.g., mycustom.link)"
                    className="w-full sm:w-auto flex-grow mr-0 sm:mr-4 mb-3 sm:mb-0"
                  />
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Domain
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400">
                          No domains found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-medium">{domain.domain_name}</TableCell>
                          <TableCell>
                            <Badge variant={domain.is_active ? "default" : "secondary"}>
                              {domain.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expandedCampaignId === campaign.id && (
                          <TableRow className="bg-slate-900/50">
                            <TableCell colSpan="5" className="p-3 sm:p-4">
                              <div className="p-2 bg-slate-800 rounded-lg">
                                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Campaign Details: {campaign.name}</h4>
                                <p className="text-slate-400 text-xs mb-3">Status: {campaign.status}</p>
                                <p className="text-slate-400 text-xs mb-3">Created: {new Date(campaign.created_at).toLocaleString()}</p>
                                <p className="text-slate-400 text-xs mb-3">Description: {campaign.description || 'No description provided.'}</p>

                                <h5 className="text-white font-medium mt-4 mb-2 text-sm sm:text-base">Associated Links ({campaign.links ? campaign.links.length : 0})</h5>
                                {campaign.links && campaign.links.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table className="text-xs sm:text-sm bg-slate-700/50 rounded-lg">
                                      <TableHeader>
                                        <TableRow className="border-slate-600">
                                          <TableHead className="text-slate-300">Short Code</TableHead>
                                          <TableHead className="text-slate-300 hidden sm:table-cell">URL</TableHead>
                                          <TableHead className="text-slate-300">Clicks</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {campaign.links.map(link => (
                                          <TableRow key={link.id} className="border-slate-600">
                                            <TableCell className="font-medium text-white">{link.short_code}</TableCell>
                                            <TableCell className="text-slate-300 hidden sm:table-cell truncate max-w-[150px]">{link.original_url}</TableCell>
                                            <TableCell className="text-slate-300">{link.clicks || 0}</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs">No links associated with this campaign.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs - Mobile Responsive */}
        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                Are you sure you want to delete user {selectedUser?.username}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-slate-600 text-xs sm:text-sm order-2 sm:order-1">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedUser && deleteUser(selectedUser.id)}
                className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm order-1 sm:order-2"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* System Delete Dialog */}
        <Dialog open={systemDeleteDialog} onOpenChange={setSystemDeleteDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl">Confirm System Data Deletion</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                This will permanently delete ALL system data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-white text-xs sm:text-sm">
                  Type <span className="font-mono text-red-400">DELETE_ALL_DATA</span> to confirm
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE_ALL_DATA"
                  className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setSystemDeleteDialog(false)
                setConfirmText('')
              }} className="border-slate-600 text-xs sm:text-sm order-2 sm:order-1">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteAllSystemData}
                disabled={confirmText !== 'DELETE_ALL_DATA'}
                className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm order-1 sm:order-2"
              >
                Delete All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl">Create New User</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                Add a new user to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white text-xs sm:text-sm">Username</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Enter username"
                  className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-xs sm:text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email"
                  className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-xs sm:text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
                  className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white text-xs sm:text-sm">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setShowCreateUserDialog(false)
                setNewUser({
                  username: '',
                  email: '',
                  password: '',
                  role: 'member',
                  status: 'active'
                })
              }} className="border-slate-600 text-xs sm:text-sm order-2 sm:order-1">
                Cancel
              </Button>
              <Button
                onClick={createUser}
                className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm order-1 sm:order-2"
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Security Threat Details Modal */}
        <Dialog open={showSecurityModal} onOpenChange={setShowSecurityModal}>
          <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl">Threat Details</DialogTitle>
            </DialogHeader>
            {selectedThreat && (
              <div className="space-y-3 sm:space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">IP Address</Label>
                  <p className="text-white font-mono text-xs sm:text-sm">{selectedThreat.ip_address}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">Type</Label>
                  <p className="text-white text-xs sm:text-sm">{selectedThreat.threat_type}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">Level</Label>
                  <Badge className={selectedThreat.threat_level === 'critical' ? 'bg-red-600' : 'bg-orange-600'}>
                    {selectedThreat.threat_level}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowSecurityModal(false)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs sm:text-sm">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subscription Management Modal */}
        <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
          <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl">Manage Subscription</DialogTitle>
            </DialogHeader>
            {selectedSubscription && (
              <div className="space-y-3 sm:space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">User</Label>
                  <p className="text-white text-xs sm:text-sm">{selectedSubscription.username}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">Plan</Label>
                  <Badge className={selectedSubscription.plan_type === 'enterprise' ? 'bg-purple-600' : 'bg-blue-600'}>
                    {selectedSubscription.plan_type}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extend" className="text-white text-xs sm:text-sm">Extend Subscription</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="1m">1 Month</SelectItem>
                      <SelectItem value="3m">3 Months</SelectItem>
                      <SelectItem value="6m">6 Months</SelectItem>
                      <SelectItem value="1y">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowSubscriptionModal(false)} className="border-slate-600 text-xs sm:text-sm order-2 sm:order-1">
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm order-1 sm:order-2">
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Support Ticket Details Modal */}
        <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
          <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-lg sm:text-xl">Ticket Details</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-3 sm:space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">Subject</Label>
                  <p className="text-white font-semibold text-xs sm:text-sm">{selectedTicket.subject}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">Status</Label>
                  <Badge className={selectedTicket.status === 'open' ? 'bg-blue-600' : 'bg-green-600'}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">Priority</Label>
                  <Badge className={selectedTicket.priority === 'high' ? 'bg-red-600' : 'bg-orange-600'}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response" className="text-white text-xs sm:text-sm">Response</Label>
                  <Textarea
                    id="response"
                    placeholder="Enter response..."
                    className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowSupportModal(false)} className="border-slate-600 text-xs sm:text-sm order-2 sm:order-1">
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm order-1 sm:order-2">
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AdminPanel

