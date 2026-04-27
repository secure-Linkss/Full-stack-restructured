import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, Plus, RefreshCw, Trash2, Edit, Lock, Mail, UserCheck, Clock,
  Activity, ShieldBan, MonitorPlay, Crown, FlaskConical, UserX,
  ChevronDown, ChevronUp, X, Link as LinkIcon, MousePointerClick, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import PendingUsersTable from './PendingUsersTable';
import api from '../../services/api';

/* ── User Details Expansion Drawer ─────────────────────────── */
const UserDetailsDrawer = ({ user, onClose }) => {
  return (
    <div className="border-t border-[#1e2d47] bg-[#0d1525] animate-fade-in">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3b82f6]" />
            User Details: <span className="text-[#3b82f6] font-mono">{user.username}</span>
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Links Created', value: user.linkCount ?? user.links_count ?? 0, color: '#3b82f6', icon: LinkIcon },
            { label: 'Total Clicks', value: user.total_clicks ?? user.clicks ?? 0, color: '#10b981', icon: MousePointerClick },
            { label: 'Login Count', value: user.login_count ?? 0, color: '#f59e0b', icon: Activity },
            { label: 'Plan', value: (user.plan_type || 'free').toUpperCase(), color: '#8b5cf6', icon: Crown },
          ].map((kpi, i) => (
            <div key={i} className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold leading-tight">{kpi.label}</span>
                <kpi.icon className="w-3.5 h-3.5 shrink-0" style={{ color: kpi.color }} />
              </div>
              <span className="text-base font-bold tabular-nums" style={{ color: kpi.color }}>
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Account Info</p>
            <div className="space-y-2 text-xs">
              {[
                ['Username', user.username],
                ['Email', user.email],
                ['Role', user.role],
                ['Status', user.status || 'active'],
                ['Verified', user.is_verified ? 'Yes ✓' : 'No ✗'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="text-foreground text-right truncate">{val ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Activity</p>
            <div className="space-y-2 text-xs">
              {[
                ['Created', user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
                ['Last Login', user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'],
                ['Last IP', user.last_ip || '—'],
                ['Sub. Expiry', user.subscription_expiry ? new Date(user.subscription_expiry).toLocaleDateString() : 'No expiry'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="text-foreground text-right font-mono">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main AdminUsers Component ──────────────────────────────── */
const AdminUsers = ({ isOwner = false, userRole = 'admin' }) => {
  const isMainAdmin = isOwner || userRole === 'main_admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [promoteModal, setPromoteModal] = useState({ open: false, user: null, days: 7 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await api.adminUsers.getAll();
      const mappedUsers = (usersData.users || usersData || []).map(u => ({
        ...u,
        linkCount: u.links_count || 0,
        lastLogin: u.last_login_at || u.last_login || u.created_at,
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (action, user) => {
    try {
      if (action === 'Edit User') {
        setSelectedUser(user);
        setIsEditModalOpen(true);
      } else if (action === 'Delete User') {
        if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
          await api.adminUsers.delete(user.id);
          toast.success(`User ${user.username} deleted.`);
          if (expandedUserId === user.id) setExpandedUserId(null);
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
        if (user.status === 'pending') {
          await api.adminUsers.activate(user.id);
        } else {
          await api.adminUsers.unsuspend(user.id);
        }
        toast.success(`User ${user.username} activated.`);
        fetchData();
      } else if (action === 'Promote Test Admin') {
        setPromoteModal({ open: true, user, days: 7 });
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
      }
    } catch (error) {
      toast.error(`Action failed: ${error.message}`);
    }
  };

  const toggleExpand = (userId) => setExpandedUserId(prev => prev === userId ? null : userId);

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
        <div>
          <p className="font-medium text-sm">{row.username}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      cell: (row) => {
        const isTestAdmin = row.role === 'test_admin';
        const displayRole = isTestAdmin && !isMainAdmin ? 'admin' : row.role;
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
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
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
          row.status === 'active' ? 'bg-green-500/20 text-green-400' :
          row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
          row.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>{row.status || 'active'}</span>
      ),
    },
    {
      header: 'Plan',
      accessor: 'plan_type',
      sortable: true,
      cell: (row) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
          row.plan_type === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
          row.plan_type === 'pro' ? 'bg-blue-500/20 text-blue-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>{row.plan_type || 'free'}</span>
      ),
    },
    {
      header: 'Links',
      accessor: 'linkCount',
      sortable: true,
      cell: (row) => <span className="text-sm tabular-nums">{(row.linkCount || 0).toLocaleString()}</span>,
    },
    {
      header: 'Created',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</span>,
    },
    {
      header: '',
      accessor: '_expand',
      cell: (row) => (
        <button
          onClick={() => toggleExpand(row.id)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#3b82f6] transition-colors whitespace-nowrap"
        >
          {expandedUserId === row.id
            ? <><ChevronUp className="w-4 h-4" /> Hide</>
            : <><ChevronDown className="w-4 h-4" /> Details</>}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Users', value: users.length, color: '#3b82f6', icon: Users },
          { label: 'Active', value: users.filter(u => u.status === 'active').length, color: '#10b981', icon: Activity },
          { label: 'Pending', value: users.filter(u => u.status === 'pending').length, color: '#f59e0b', icon: Clock },
          { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, color: '#ef4444', icon: ShieldBan },
        ].map((c, i) => (
          <Card key={i} className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{c.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold tabular-nums">{c.value}</h3>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.color}20` }}>
                <c.icon className="w-4 h-4" style={{ color: c.color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all-users" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="all-users" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" /> All Users
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5" /> Pending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-users" className="mt-4">
          <Card className="border-[#1e2d47]">
            <CardHeader className="border-b border-[#1e2d47] bg-[#141d2e] rounded-t-lg py-4">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <MonitorPlay className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#3b82f6]" />
                User Management
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Click the Details button on any row to expand user info.</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 sm:pt-6 bg-background p-0">
              <div className="px-4 sm:px-6 pt-4 sm:pt-6">
                <FilterBar
                  searchPlaceholder="Search username or email..."
                  onSearch={setSearchQuery}
                  onRefresh={fetchData}
                  onExport={() => toast.info('Exporting user list...')}
                  filterOptions={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'main_admin', label: 'Main Admin' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'member', label: 'Member' },
                  ]}
                  onFilterChange={setFilterRole}
                  dateRangeOptions={[]}
                  onDateRangeChange={() => {}}
                  extraButtons={[
                    <Button
                      key="add"
                      size="sm"
                      className="btn-primary text-xs sm:text-sm"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Add User</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  ]}
                />
              </div>

              {loading ? (
                <div className="text-center text-muted-foreground p-10 flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6] opacity-50 mb-3" />
                  Loading users...
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredUsers}
                  pageSize={15}
                  expandedRowId={expandedUserId}
                  expandedRowContent={(row) => (
                    <UserDetailsDrawer user={row} onClose={() => setExpandedUserId(null)} />
                  )}
                  actions={(row) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" className="btn-primary h-7 text-xs px-2.5">
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-[#141d2e] border-[#1e2d47]">
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono tracking-widest truncate">{row.username}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem onClick={() => handleAction('Edit User', row)} className="text-xs cursor-pointer focus:bg-white/5">
                          <Edit className="w-3.5 h-3.5 mr-2" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('Reset Password', row)} className="text-xs cursor-pointer focus:bg-white/5">
                          <Lock className="w-3.5 h-3.5 mr-2" /> Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('Send Email', row)} className="text-xs cursor-pointer focus:bg-white/5">
                          <Mail className="w-3.5 h-3.5 mr-2" /> Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                          onClick={() => handleAction(row.status === 'suspended' ? 'Activate User' : 'Suspend User', row)}
                          className={`text-xs cursor-pointer ${row.status === 'suspended' ? 'text-[#10b981] focus:bg-green-500/10' : 'text-[#f59e0b] focus:bg-yellow-500/10'}`}
                        >
                          {row.status === 'suspended' ? <UserCheck className="w-3.5 h-3.5 mr-2" /> : <ShieldBan className="w-3.5 h-3.5 mr-2" />}
                          {row.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                        </DropdownMenuItem>
                        {isMainAdmin && row.role === 'member' && (
                          <DropdownMenuItem onClick={() => handleAction('Promote Test Admin', row)} className="text-xs cursor-pointer text-orange-400 focus:bg-orange-500/10">
                            <FlaskConical className="w-3.5 h-3.5 mr-2" /> Promote Test Admin
                          </DropdownMenuItem>
                        )}
                        {isMainAdmin && row.role === 'test_admin' && (
                          <DropdownMenuItem onClick={() => handleAction('Demote to Member', row)} className="text-xs cursor-pointer text-yellow-400 focus:bg-yellow-500/10">
                            <UserX className="w-3.5 h-3.5 mr-2" /> Demote to Member
                          </DropdownMenuItem>
                        )}
                        {(isOwner || row.role === 'member') && (
                          <DropdownMenuItem onClick={() => handleAction('Delete User', row)} className="text-xs cursor-pointer text-[#ef4444] focus:bg-red-500/10">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete User
                          </DropdownMenuItem>
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

      <Dialog open={promoteModal.open} onOpenChange={(open) => setPromoteModal(p => ({ ...p, open }))}>
        <DialogContent className="bg-[#141d2e] border-[#1e2d47] text-foreground w-[calc(100vw-2rem)] max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-orange-400" />
              Promote to Test Admin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Grant <span className="font-semibold text-foreground">{promoteModal.user?.username}</span> read-only admin access for a limited time.
            </p>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Duration</p>
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
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setPromoteModal({ open: false, user: null, days: 7 })}>Cancel</Button>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={async () => {
                try {
                  await api.adminUsers.promoteTest(promoteModal.user.id, promoteModal.days);
                  toast.success(`${promoteModal.user.username} promoted for ${promoteModal.days} days.`);
                  setPromoteModal({ open: false, user: null, days: 7 });
                  fetchData();
                } catch (err) {
                  toast.error(`Failed: ${err.message}`);
                }
              }}
            >
              <FlaskConical className="w-4 h-4 mr-2" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
