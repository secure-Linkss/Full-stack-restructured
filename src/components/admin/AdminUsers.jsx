import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, RefreshCw, Trash2, Edit, Lock, Mail, UserCheck, Clock, Activity, ShieldBan, MonitorPlay, Crown, FlaskConical, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import PendingUsersTable from './PendingUsersTable';
import api from '../../services/api';

const AdminUsers = ({ isOwner = false, userRole = 'admin' }) => {
  const isMainAdmin = isOwner || userRole === 'main_admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [promoteModal, setPromoteModal] = useState({ open: false, user: null, days: 7 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await api.adminUsers.getAll();

      // Map backend data to frontend structure
      const mappedUsers = (usersData.users || usersData || []).map(u => ({
        ...u,
        linkCount: u.links_count || 0,
        lastLogin: u.last_login_at || u.last_login || u.created_at
      }));

      setUsers(mappedUsers);
      toast.success('User list refreshed.');
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action, user) => {
    try {
      if (action === 'Edit User') {
         setSelectedUser(user);
         setIsEditModalOpen(true);
      } else if (action === 'Delete User') {
        if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
          await api.adminUsers.delete(user.id);
          toast.success(`User ${user.username} deleted.`);
          fetchData();
        }
      } else if (action === 'Reset Password') {
        await api.adminUsers.resetPassword(user.id);
        toast.success(`Password reset for ${user.username}. New password: Password123!`);
      } else if (action === 'Suspend User') {
        await api.adminUsers.suspend(user.id, 'Suspended by administrator');
        toast.success(`User ${user.username} suspended.`);
        fetchData();
      } else if (action === 'Activate User') {
        // For pending users: approve. For suspended users: lift suspension.
        if (user.status === 'pending') {
          await api.adminUsers.activate(user.id);
        } else {
          await api.adminUsers.unsuspend(user.id);
        }
        toast.success(`User ${user.username} activated.`);
        fetchData();
      } else if (action === 'Promote Test Admin') {
        setPromoteModal({ open: true, user, days: 7 });
        return;
      } else if (action === 'Demote to Member') {
        if (window.confirm(`Remove test admin access for ${user.username}?`)) {
          await api.adminUsers.demoteTest(user.id);
          toast.success(`${user.username} demoted back to member.`);
          fetchData();
        }
      } else if (action === 'Send Email') {
        const subject = window.prompt(`Email subject to ${user.email}:`, 'Message from BrainLink Admin');
        if (subject === null) return;
        const message = window.prompt('Email message body:');
        if (!message) return toast.error('Message cannot be empty.');
        await api.adminUsers.sendEmail(user.id, subject, message);
        toast.success(`Email sent to ${user.email}.`);
      } else {
        toast.info(`${action} action triggered for user: ${user.email}`);
      }
    } catch (error) {
      toast.error(`Action failed: ${error.message}`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      header: 'User',
      accessor: 'username',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {row.username}
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      cell: (row) => {
        const isTestAdmin = row.role === 'test_admin';
        // Non-main-admins see test_admin as plain "Admin"
        const displayRole = isTestAdmin && !isMainAdmin ? 'admin' : row.role;
        return (
          <span className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full capitalize ${
            displayRole === 'main_admin' ? 'bg-red-500/20 text-red-400' :
            displayRole === 'test_admin' ? 'bg-orange-500/20 text-orange-400' :
            displayRole === 'admin' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            {displayRole === 'test_admin' && <FlaskConical className="w-3 h-3" />}
            {displayRole === 'main_admin' && <Crown className="w-3 h-3" />}
            {displayRole === 'main_admin' ? 'Main Admin' : displayRole === 'test_admin' ? 'Test Admin' : displayRole}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full capitalize ${row.status === 'active' ? 'bg-green-500/20 text-green-400' :
            row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              row.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
          }`}>
          {row.status || 'active'}
        </span>
      ),
    },
    {
      header: 'Plan',
      accessor: 'plan_type',
      sortable: true,
      cell: (row) => (
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full capitalize ${row.plan_type === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
            row.plan_type === 'pro' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-400'
          }`}>
          {row.plan_type || 'free'}
        </span>
      ),
    },
    {
      header: 'Links',
      accessor: 'linkCount',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.linkCount?.toLocaleString() || 0}</span>,
    },
    {
      header: 'Subscription',
      accessor: 'subscription_expiry',
      sortable: true,
      cell: (row) => {
        if (!row.subscription_expiry) return <span className="text-sm text-muted-foreground">No expiry</span>;
        const expiry = new Date(row.subscription_expiry);
        const isExpired = expiry < new Date();
        return (
          <span className={`text-sm ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
            {expiry.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      header: 'Verified',
      accessor: 'is_verified',
      sortable: true,
      cell: (row) => (
        <span className={`text-sm ${row.is_verified ? 'text-green-400' : 'text-yellow-400'}`}>
          {row.is_verified ? '✓ Yes' : '✗ No'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</span>,
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never'}</span>,
    },
    {
      header: 'Last IP',
      accessor: 'last_ip',
      sortable: false,
      cell: (row) => <span className="text-sm font-mono">{row.last_ip || 'N/A'}</span>,
    },
    {
      header: 'Logins',
      accessor: 'login_count',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.login_count || 0}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Total Users</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">{users.length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
               <Users className="w-5 h-5 text-[#3b82f6]" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Active Now</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">{users.filter(u => u.status === 'active').length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center shrink-0">
               <Activity className="w-5 h-5 text-[#10b981]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Pending Sync</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">{users.filter(u => u.status === 'pending').length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 flex items-center justify-center shrink-0">
               <Clock className="w-5 h-5 text-[#f59e0b]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Suspended</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">{users.filter(u => u.status === 'suspended').length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 flex items-center justify-center shrink-0">
               <ShieldBan className="w-5 h-5 text-[#ef4444]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="all-users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" /> All Network Users
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" /> Pending Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-users" className="mt-4">
          <Card className="border-[#1e2d47]">
            <CardHeader className="border-b border-[#1e2d47] bg-[#141d2e] rounded-t-lg">
              <CardTitle className="flex items-center text-lg">
                <MonitorPlay className="h-5 w-5 mr-2 text-[#3b82f6]" />
                User Database Operations
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View, edit, and forcefully manage all remote tenant endpoints.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 bg-background">
              <FilterBar
                searchPlaceholder="Deep search username, identity, or IP..."
                onSearch={setSearchQuery}
                onRefresh={fetchData}
                onExport={() => toast.info('Exporting JSON user vector...')}
                filterOptions={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'main_admin', label: 'Main Admin' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'member', label: 'Member' },
                ]}
                onFilterChange={setFilterRole}
                dateRangeOptions={[]}
                onDateRangeChange={() => { }}
                extraButtons={[
                  <Button
                    key="add"
                    size="sm"
                    className="btn-primary shadow-lg"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Provision User
                  </Button>
                ]}
              />

              {loading ? (
                <div className="text-center text-muted-foreground p-10 flex flex-col items-center">
                   <RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6] opacity-50 mb-3" />
                   Loading Database Vectors...
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredUsers}
                  pageSize={15}
                  actions={(row) => (
                    <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 border-[#3b82f6]/30 hover:bg-[#3b82f6]/10 text-xs">Manage User</Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-48 bg-[#141d2e] border-[#1e2d47]">
                          <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-mono tracking-widest">{row.username}</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem onClick={() => handleAction('Edit User', row)} className="text-xs cursor-pointer focus:bg-white/5"><Edit className="w-3.5 h-3.5 mr-2" /> Modify Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('Reset Password', row)} className="text-xs cursor-pointer focus:bg-white/5"><Lock className="w-3.5 h-3.5 mr-2" /> Force Password Reset</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('Send Email', row)} className="text-xs cursor-pointer focus:bg-white/5"><Mail className="w-3.5 h-3.5 mr-2" /> Ping via Email</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                             onClick={() => handleAction(row.status === 'suspended' ? 'Activate User' : 'Suspend User', row)} 
                             className={`text-xs cursor-pointer ${row.status === 'suspended' ? 'text-[#10b981] focus:bg-[rgba(16,185,129,0.1)]' : 'text-[#f59e0b] focus:bg-[rgba(245,158,11,0.1)]'}`}
                          >
                             {row.status === 'suspended' ? <UserCheck className="w-3.5 h-3.5 mr-2" /> : <ShieldBan className="w-3.5 h-3.5 mr-2" />}
                             {row.status === 'suspended' ? 'Lift Suspension' : 'Suspend Tenant Activity'}
                          </DropdownMenuItem>
                          {/* Main admin: promote/demote test admin */}
                          {isMainAdmin && row.role === 'member' && (
                            <DropdownMenuItem onClick={() => handleAction('Promote Test Admin', row)} className="text-xs cursor-pointer text-orange-400 focus:bg-orange-500/10 focus:text-orange-400"><FlaskConical className="w-3.5 h-3.5 mr-2" /> Promote to Test Admin</DropdownMenuItem>
                          )}
                          {isMainAdmin && row.role === 'test_admin' && (
                            <DropdownMenuItem onClick={() => handleAction('Demote to Member', row)} className="text-xs cursor-pointer text-yellow-400 focus:bg-yellow-500/10"><UserX className="w-3.5 h-3.5 mr-2" /> Demote to Member</DropdownMenuItem>
                          )}
                          {/* Owner can delete any non-owner; admin can only delete members */}
                          {(isOwner || row.role === 'member') && (
                            <DropdownMenuItem onClick={() => handleAction('Delete User', row)} className="text-xs cursor-pointer text-[#ef4444] focus:bg-[rgba(239,68,68,0.1)] focus:text-[#ef4444]"><Trash2 className="w-3.5 h-3.5 mr-2" /> Completely Purge Identity</DropdownMenuItem>
                          )}
                       </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <PendingUsersTable />
        </TabsContent>
      </Tabs>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
      />
      
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchData}
        user={selectedUser}
      />

      {/* Promote to Test Admin Modal */}
      <Dialog open={promoteModal.open} onOpenChange={(open) => setPromoteModal(p => ({ ...p, open }))}>
        <DialogContent className="bg-[#141d2e] border-[#1e2d47] text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-orange-400" />
              Promote to Test Admin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Grant <span className="font-semibold text-foreground">{promoteModal.user?.username}</span> read-only admin access for a limited time.
              They will see the admin panel but cannot create, edit, or delete anything.
            </p>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Access Duration</p>
              <div className="flex gap-2">
                {[7, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setPromoteModal(p => ({ ...p, days: d }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${promoteModal.days === d ? 'border-orange-400 bg-orange-500/10 text-orange-400' : 'border-[#1e2d47] text-muted-foreground hover:border-orange-400/50'}`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2">
              Other admins will see this user as "Admin". Only you (main admin) will see the "Test Admin" badge.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setPromoteModal({ open: false, user: null, days: 7 })}>Cancel</Button>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={async () => {
                try {
                  await api.adminUsers.promoteTest(promoteModal.user.id, promoteModal.days);
                  toast.success(`${promoteModal.user.username} promoted to Test Admin for ${promoteModal.days} days.`);
                  setPromoteModal({ open: false, user: null, days: 7 });
                  fetchData();
                } catch (err) {
                  toast.error(`Failed: ${err.message}`);
                }
              }}
            >
              <FlaskConical className="w-4 h-4 mr-2" /> Confirm Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
