import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Lock, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DataTable from '@/components/ui/DataTable';
// import { fetchMockData } from '../../services/mockApi';
import BlockedIPs from './BlockedIPs';
import RateLimiting from './RateLimiting';

const AdminSecurity = () => {
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // const logsData = await fetchMockData('getAdminSecurityLogs');
      // Temporarily mock log data until backend is implemented
      const logsData = [];
      setSecurityLogs(logsData);
      toast.success('Security logs refreshed.');
    } catch (error) {
      toast.error('Failed to load security logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      sortable: true,
      cell: (row) => <span className="text-sm">{new Date(row.timestamp).toLocaleString()}</span>,
    },
    {
      header: 'Event',
      accessor: 'event',
      cell: (row) => <span className="font-medium">{row.event}</span>,
    },
    {
      header: 'User/Source',
      accessor: 'source',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.source}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          {row.status === 'Success' ? (
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            row.status === 'Success' ? 'text-green-500' : 'text-red-500'
          }`}>
            {row.status}
          </span>
        </div>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'ipAddress',
      cell: (row) => <code className="text-sm text-muted-foreground">{row.ipAddress}</code>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Shield className="h-5 w-5 mr-2 text-primary" /> Security Center</CardTitle>
          <p className="text-sm text-muted-foreground">Monitor and manage platform security events.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BlockedIPs />
            <RateLimiting />
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Security Event Logs</h3>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Logs
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Security Logs...</div>
          ) : (
            <DataTable
              columns={columns}
              data={securityLogs}
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurity;
