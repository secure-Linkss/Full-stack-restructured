'use client';

import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Lock,
  Unlock,
  Mail,
  Phone,
  Globe,
  Activity,
  BarChart3,
  Zap,
  Copy,
  Trash,
  CheckCircle,
  AlertCircle,
  Clock,
  Server,
  Database,
  Shield as ShieldIcon,
  Key,
  Sliders,
} from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalLinks: 0,
    totalClicks: 0,
    totalCampaigns: 0,
  });
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [securityThreats, setSecurityThreats] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [domains, setDomains] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'member',
    status: 'active',
  });
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showCreateDomainDialog, setShowCreateDomainDialog] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedSupportTicket, setSelectedSupportTicket] = useState(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [systemDeleteDialog, setSystemDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardStats();
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadDashboardStats();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'campaigns') loadCampaigns();
    if (activeTab === 'security') loadSecurityThreats();
    if (activeTab === 'subscriptions') loadSubscriptions();
    if (activeTab === 'support') loadSupportTickets();
    if (activeTab === 'audit') loadAuditLogs();
    if (activeTab === 'settings') loadDomains();
  }, [activeTab]);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      setError('Failed to load users');
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/campaigns/details', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      setError('Failed to load campaigns');
    }
  };

  const loadSecurityThreats = async () => {
    try {
      const response = await fetch('/api/admin/security/threats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSecurityThreats(data.threats || []);
      }
    } catch (error) {
      setError('Failed to load security threats');
    }
  };

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      setError('Failed to load subscriptions');
    }
  };

  const loadSupportTickets = async () => {
    try {
      const response = await fetch('/api/admin/support/tickets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSupportTickets(data.tickets || []);
      }
    } catch (error) {
      setError('Failed to load support tickets');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      setError('Failed to load audit logs');
    }
  };

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/admin/domains', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      }
    } catch (error) {
      setError('Failed to load domains');
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setSuccess('User created successfully');
        setShowCreateUserDialog(false);
        setNewUser({ username: '', email: '', password: '', role: 'member', status: 'active' });
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Error creating user');
    }
  };

  const createDomain = async () => {
    if (!newDomain) {
      setError('Please enter a domain');
      return;
    }

    try {
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ domain: newDomain })
      });

      if (response.ok) {
        setSuccess('Domain added successfully');
        setShowCreateDomainDialog(false);
        setNewDomain('');
        loadDomains();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add domain');
      }
    } catch (error) {
      setError('Error adding domain');
    }
  };

  const deleteDomain = async (domainId) => {
    try {
      const response = await fetch(`/api/admin/domains/${domainId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setSuccess('Domain deleted successfully');
        loadDomains();
      } else {
        setError('Failed to delete domain');
      }
    } catch (error) {
      setError('Error deleting domain');
    }
  };

  const toggleCampaignExpansion = (campaignId) => {
    setExpandedCampaignId(expandedCampaignId === campaignId ? null : campaignId);
  };

  const exportAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/export', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_logs.csv';
        a.click();
        setSuccess('Audit logs exported successfully');
      }
    } catch (error) {
      setError('Failed to export audit logs');
    }
  };

  const deleteAllSystemData = async () => {
    if (confirmText !== 'DELETE ALL DATA') {
      setError('Please type "DELETE ALL DATA" to confirm');
      return;
    }

    try {
      const response = await fetch('/api/admin/system/delete-all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setSuccess('All system data deleted');
        setSystemDeleteDialog(false);
        setConfirmText('');
        loadDashboardStats();
      } else {
        setError('Failed to delete system data');
      }
    } catch (error) {
      setError('Error deleting system data');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'bg-yellow-500',
      'active': 'bg-green-500',
      'suspended': 'bg-red-500',
      'expired': 'bg-orange-500',
      'verified': 'bg-blue-500',
      'open': 'bg-yellow-500',
      'in_progress': 'bg-blue-500',
      'closed': 'bg-green-500',
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs sm:text-sm">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{value}</p>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full h-full bg-slate-950 text-white p-3 sm:p-6">
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-xs sm:text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-100 hover:text-red-50">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 sm:p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-xs sm:text-sm">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-2 text-green-100 hover:text-green-50">✕</button>
        </div>
      )}

      <div className="mb-6">
	        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Admin Panel</h1>
	        <p className="text-slate-400 text-sm sm:text-base">Enterprise-grade administration dashboard</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-8 gap-2 bg-slate-800 p-2 mb-6 overflow-x-auto">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
            <LayoutDashboard className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Dash</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs sm:text-sm">
            <FolderKanban className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Camp</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Sec</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Subs</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Supp</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Set</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Dashboard Overview</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Real-time system metrics and statistics</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs sm:text-sm text-slate-400">Auto-refresh:</label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <Button
                onClick={loadDashboardStats}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={Users} label="Total Users" value={dashboardStats.totalUsers} color="bg-blue-500" />
            <StatCard icon={FolderKanban} label="Total Campaigns" value={dashboardStats.totalCampaigns} color="bg-purple-500" />
            <StatCard icon={TrendingUp} label="Total Links" value={dashboardStats.totalLinks} color="bg-green-500" />
            <StatCard icon={Activity} label="Total Clicks" value={dashboardStats.totalClicks} color="bg-orange-500" />
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Manage system users and permissions</p>
            </div>
            <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs sm:text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New User</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Add a new user to the system with specified role and permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">Username</label>
                    <Input
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Enter username"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">Email</label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="Enter email"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">Password</label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Enter password"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2 text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="assistant_admin">Assistant Admin</option>
                      <option value="main_admin">Main Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">Status</label>
                    <select
                      value={newUser.status}
                      onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Button onClick={createUser} className="bg-blue-600 hover:bg-blue-700 flex-1 text-xs sm:text-sm">
                      Create User
                    </Button>
                    <Button
                      onClick={() => setShowCreateUserDialog(false)}
                      variant="outline"
                      className="flex-1 text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
	                      <TableHead className="text-white text-xs sm:text-sm">Username</TableHead>
	                      <TableHead className="text-white hidden sm:table-cell text-xs sm:text-sm">Email</TableHead>
	                      <TableHead className="text-white text-xs sm:text-sm">Role</TableHead>
	                      <TableHead className="text-white text-xs sm:text-sm">Status</TableHead>
	                      <TableHead className="text-white text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-white text-xs sm:text-sm font-medium">{user.username}</TableCell>
                          <TableCell className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">{user.email}</TableCell>
                          <TableCell className="text-slate-300 text-xs sm:text-sm">{getStatusBadge(user.role)}</TableCell>
                          <TableCell className="text-slate-300 text-xs sm:text-sm">{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem className="text-slate-300">Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-slate-300">Reset Password</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Campaign Management</h2>
              <p className="text-slate-400 text-xs sm:text-sm">View and manage all campaigns</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
	                      <TableHead className="text-white text-xs sm:text-sm">Name</TableHead>
	                      <TableHead className="text-white hidden sm:table-cell text-xs sm:text-sm">Status</TableHead>
	                      <TableHead className="text-white text-xs sm:text-sm">Links</TableHead>
	                      <TableHead className="text-white hidden md:table-cell text-xs sm:text-sm">Clicks</TableHead>
	                      <TableHead className="text-white text-right text-xs sm:text-sm">Expand</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                          No campaigns found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaigns.map((campaign) => (
                        <React.Fragment key={campaign.id}>
                          <TableRow className="border-slate-700 hover:bg-slate-700/50">
                            <TableCell className="text-white text-xs sm:text-sm font-medium">{campaign.name}</TableCell>
                            <TableCell className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">
                              {getStatusBadge(campaign.status)}
                            </TableCell>
                            <TableCell className="text-slate-300 text-xs sm:text-sm">{campaign.link_count || 0}</TableCell>
                            <TableCell className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">
                              {campaign.click_count || 0}
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
                            <TableRow className="bg-slate-900/50 border-slate-700">
                              <TableCell colSpan={5} className="p-3 sm:p-4">
                                <div className="bg-slate-800 rounded-lg p-3 sm:p-4 space-y-3">
                                  <div>
                                    <h4 className="text-white font-semibold text-sm sm:text-base mb-2">Campaign Details</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                                      <div>
                                        <p className="text-slate-400">Created:</p>
                                        <p className="text-white">{new Date(campaign.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-400">Description:</p>
                                        <p className="text-white">{campaign.description || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {campaign.links && campaign.links.length > 0 && (
                                    <div>
                                      <h5 className="text-white font-semibold text-sm mb-2">Associated Links</h5>
                                      <div className="overflow-x-auto">
                                        <Table className="text-xs sm:text-sm">
                                          <TableHeader>
                                            <TableRow className="border-slate-600">
                                              <TableHead className="text-slate-300 text-xs">Code</TableHead>
                                              <TableHead className="text-slate-300 hidden sm:table-cell text-xs">URL</TableHead>
                                              <TableHead className="text-slate-300 text-xs">Clicks</TableHead>
                                              <TableHead className="text-slate-300 text-right text-xs">Actions</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {campaign.links.map((link) => (
                                              <TableRow key={link.id} className="border-slate-600">
                                                <TableCell className="text-white text-xs font-mono">{link.short_code}</TableCell>
                                                <TableCell className="text-slate-300 hidden sm:table-cell text-xs truncate max-w-[150px]">
                                                  {link.original_url}
                                                </TableCell>
                                                <TableCell className="text-slate-300 text-xs">{link.clicks || 0}</TableCell>
                                                <TableCell className="text-right">
                                                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                                                    View
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Security Threats</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Monitor and manage security incidents</p>
            </div>
            <Button onClick={loadSecurityThreats} variant="outline" size="sm" className="text-xs sm:text-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300 text-xs sm:text-sm">IP Address</TableHead>
                      <TableHead className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">Threat Type</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-sm">Severity</TableHead>
                      <TableHead className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">Timestamp</TableHead>
                      <TableHead className="text-slate-300 text-right text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityThreats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                          No security threats detected.
                        </TableCell>
                      </TableRow>
                    ) : (
                      securityThreats.map((threat) => (
                        <TableRow key={threat.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-white text-xs sm:text-sm font-mono">{threat.ip_address}</TableCell>
                          <TableCell className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">{threat.threat_type}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {threat.severity === 'critical' && <Badge className="bg-red-600">Critical</Badge>}
                            {threat.severity === 'high' && <Badge className="bg-orange-600">High</Badge>}
                            {threat.severity === 'medium' && <Badge className="bg-yellow-600">Medium</Badge>}
                          </TableCell>
                          <TableCell className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">
                            {new Date(threat.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">{getStatusBadge(threat.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Subscriptions</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Manage user subscriptions and plans</p>
            </div>
            <Button onClick={loadSubscriptions} variant="outline" size="sm" className="text-xs sm:text-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300 text-xs sm:text-sm">User</TableHead>
                      <TableHead className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">Plan</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">Expires</TableHead>
                      <TableHead className="text-slate-300 text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                          No subscriptions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => (
                        <TableRow key={sub.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-white text-xs sm:text-sm">{sub.user_name}</TableCell>
                          <TableCell className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">{sub.plan_type}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{getStatusBadge(sub.status)}</TableCell>
                          <TableCell className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">
                            {new Date(sub.expiry_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Support Tickets</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Manage customer support requests</p>
            </div>
            <Button onClick={loadSupportTickets} variant="outline" size="sm" className="text-xs sm:text-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300 text-xs sm:text-sm">Ticket ID</TableHead>
                      <TableHead className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">Subject</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">Priority</TableHead>
                      <TableHead className="text-slate-300 text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supportTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                          No support tickets found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      supportTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-white text-xs sm:text-sm font-mono">{ticket.id}</TableCell>
                          <TableCell className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm truncate max-w-[200px]">
                            {ticket.subject}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                            {ticket.priority === 'high' && <Badge className="bg-red-600">High</Badge>}
                            {ticket.priority === 'medium' && <Badge className="bg-yellow-600">Medium</Badge>}
                            {ticket.priority === 'low' && <Badge className="bg-green-600">Low</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Audit Logs</h2>
              <p className="text-slate-400 text-xs sm:text-sm">System activity and user actions</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={loadAuditLogs} variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportAuditLogs} variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300 text-xs sm:text-sm">ID</TableHead>
                      <TableHead className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">User ID</TableHead>
                      <TableHead className="text-slate-300 text-xs sm:text-sm">Action</TableHead>
                      <TableHead className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                          No audit logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-white text-xs sm:text-sm font-mono">{log.id}</TableCell>
                          <TableCell className="text-slate-300 hidden sm:table-cell text-xs sm:text-sm">{log.user_id}</TableCell>
                          <TableCell className="text-slate-300 text-xs sm:text-sm">{log.action}</TableCell>
                          <TableCell className="text-slate-300 hidden md:table-cell text-xs sm:text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Domain Management */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg sm:text-xl flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Management
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm">
                    Manage short.io domains for link creation ({domains.length}/200+)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={showCreateDomainDialog} onOpenChange={setShowCreateDomainDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 w-full text-xs sm:text-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Domain
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add New Domain</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                          Add a short.io domain for link creation
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-white text-sm mb-2 block">Domain</label>
                          <Input
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            placeholder="e.g., example.short.gy"
                            className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm"
                          />
                        </div>
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <Button onClick={createDomain} className="bg-blue-600 hover:bg-blue-700 flex-1 text-xs sm:text-sm">
                            Add Domain
                          </Button>
                          <Button
                            onClick={() => setShowCreateDomainDialog(false)}
                            variant="outline"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="overflow-x-auto">
                    <Table className="text-xs sm:text-sm">
                      <TableHeader>
                        <TableRow className="border-slate-700">
	                      <TableHead className="text-white">Domain</TableHead>
	                      <TableHead className="text-white hidden sm:table-cell">Status</TableHead>
	                      <TableHead className="text-white text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {domains.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-slate-400 text-xs">
                              No domains added yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          domains.map((domain) => (
                            <TableRow key={domain.id} className="border-slate-700 hover:bg-slate-700/50">
                              <TableCell className="text-white font-mono text-xs sm:text-sm">{domain.domain}</TableCell>
                              <TableCell className="text-slate-300 hidden sm:table-cell text-xs">
                                {getStatusBadge(domain.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => deleteDomain(domain.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Settings */}
            <div className="space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
                    <Sliders className="h-5 w-5" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog open={systemDeleteDialog} onOpenChange={setSystemDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full text-xs sm:text-sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Data
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 w-[95vw] sm:w-full">
                      <DialogHeader>
                        <DialogTitle className="text-red-500">Delete All System Data</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                          This action is permanent and cannot be undone. Type "DELETE ALL DATA" to confirm.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder='Type "DELETE ALL DATA" to confirm'
                          className="bg-slate-700 border-slate-600 text-white text-xs sm:text-sm"
                        />
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <Button
                            onClick={deleteAllSystemData}
                            variant="destructive"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            Delete All Data
                          </Button>
                          <Button
                            onClick={() => {
                              setSystemDeleteDialog(false);
                              setConfirmText('');
                            }}
                            variant="outline"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <p className="text-slate-400">Total Users</p>
                    <p className="text-white font-semibold">{dashboardStats.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Links</p>
                    <p className="text-white font-semibold">{dashboardStats.totalLinks}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Clicks</p>
                    <p className="text-white font-semibold">{dashboardStats.totalClicks}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

