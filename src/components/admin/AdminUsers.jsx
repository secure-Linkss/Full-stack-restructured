import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, Plus, RefreshCw, Filter, Trash2, Edit, Lock, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import DataTable from '../ui/DataTable';
import FilterBar from '../ui/FilterBar';
import ActionIconGroup from '../ui/ActionIconGroup';
import { fetchMockData } from '../../services/mockApi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await fetchMockData('getAdminUsers');
      setUsers(usersData);
      toast.success('User list refreshed.');
    } catch (error) {
      toast.error('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = (action, user) => {
    toast.info(`${action} action triggered for user: ${user.email}`);
    // Mock action logic: Edit, Delete, Reset Password, Send Email
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
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
      header: 'Links',
      accessor: 'linkCount',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.linkCount.toLocaleString()}</span>,
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin',
      sortable: true,
      cell: (row) => <span className="text-sm">{new Date(row.lastLogin).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="h-5 w-5 mr-2 text-primary" /> User Management</CardTitle>
          <p className="text-sm text-muted-foreground">View, edit, and manage all user accounts.</p>
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
              { value: 'user', label: 'User' },
            ]}
            onFilterChange={setFilterRole}
            dateRangeOptions={[]}
            onDateRangeChange={() => {}}
            extraButtons={[
              <Button key="add" size="sm" onClick={() => handleAction('Add New User', {})}>
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
    </div>
  );
};

export default AdminUsers;
