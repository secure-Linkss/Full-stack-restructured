import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, RefreshCw, Filter, Trash2, Edit, Lock, Mail, UserCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import ActionIconGroup from '@/components/ui/ActionIconGroup';
import CreateUserModal from './CreateUserModal';
import PendingUsersTable from './PendingUsersTable';
import api from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await api.adminUsers.getAll();
      
      // Map backend data to frontend structure
      const mappedUsers = usersData.map(u => ({
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
      if (action === 'Delete User') {
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
        await api.adminUsers.activate(user.id);
        toast.success(`User ${user.username} activated.`);
        fetchData();
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
      cell: (row) => (
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full capitalize ${
          row.role === 'main_admin' ? 'bg-red-500/20 text-red-400' :
          row.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-green-500/20 text-green-400'
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full capitalize ${
          row.status === 'active' ? 'bg-green-500/20 text-green-400' :
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
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full capitalize ${
          row.plan_type === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
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
    <div className="space-y-6">
      <Tabs defaultValue="all-users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Pending Approvals
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" /> 
                User Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View, edit, and manage all user accounts.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilterBar
                searchPlaceholder="Search by username or email..."
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
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                ]}
              />

              {loading ? (
                <div className="text-center text-muted-foreground p-10">Loading Users...</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredUsers}
                  pageSize={10}
                  actions={(row) => (
                    <div className="flex space-x-1">
                      <ActionIconGroup
                        actions={[
                          { icon: Edit, label: 'Edit User', onClick: () => handleAction('Edit User', row) },
                          { icon: Lock, label: 'Reset Password', onClick: () => handleAction('Reset Password', row) },
                          { 
                            icon: row.status === 'suspended' ? UserCheck : Lock, 
                            label: row.status === 'suspended' ? 'Activate User' : 'Suspend User', 
                            onClick: () => handleAction(row.status === 'suspended' ? 'Activate User' : 'Suspend User', row) 
                          },
                          { icon: Mail, label: 'Send Email', onClick: () => handleAction('Send Email', row) },
                          { icon: Trash2, label: 'Delete User', onClick: () => handleAction('Delete User', row) },
                        ]}
                      />
                    </div>
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
    </div>
  );
};

export default AdminUsers;
