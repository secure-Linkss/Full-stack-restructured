import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { UserCheck, UserX, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import DataTable from '../ui/DataTable';
import FilterBar from '../ui/FilterBar';
import api from '../../services/api';

const PendingUsersTable = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.adminUsers.getPending();
      setPendingUsers(response.pending_users || []);
      toast.success(`Found ${response.count || 0} pending users.`);
    } catch (error) {
      console.error('Fetch pending users error:', error);
      toast.error('Failed to load pending users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (user) => {
    try {
      await api.adminUsers.approvePending(user.id);
      toast.success(`User ${user.username} approved!`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to approve: ${error.message}`);
    }
  };

  const handleReject = async (user) => {
    if (window.confirm(`Are you sure you want to reject ${user.username}? This will delete their account.`)) {
      try {
        await api.adminUsers.rejectPending(user.id, 'Registration rejected by administrator');
        toast.success(`User ${user.username} rejected.`);
        fetchData();
      } catch (error) {
        toast.error(`Failed to reject: ${error.message}`);
      }
    }
  };

  const filteredUsers = pendingUsers.filter(user => {
    if (!searchQuery) return true;
    return (
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
      header: 'Requested Plan',
      accessor: 'plan_type',
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-medium px-2 py-0.5 rounded-full capitalize bg-blue-500/20 text-blue-400">
          {row.plan_type}
        </span>
      ),
    },
    {
      header: 'Requested Role',
      accessor: 'role',
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-medium px-2 py-0.5 rounded-full capitalize bg-yellow-500/20 text-yellow-400">
          {row.role}
        </span>
      ),
    },
    {
      header: 'Registration Date',
      accessor: 'created_at',
      sortable: true,
      cell: (row) => (
        <div className="text-sm">
          {row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}
        </div>
      ),
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
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" /> 
            Pending User Approvals
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and approve new user registrations.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by username or email..."
            onSearch={setSearchQuery}
            onRefresh={fetchData}
            onExport={() => toast.info('Exporting pending users...')}
            filterOptions={[]}
            onFilterChange={() => {}}
            dateRangeOptions={[]}
            onDateRangeChange={() => {}}
          />

          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Pending Users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-muted-foreground p-10">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending users awaiting approval</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredUsers}
              pageSize={10}
              actions={(row) => (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(row)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(row)}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingUsersTable;
