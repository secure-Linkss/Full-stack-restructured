import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FileText, RefreshCw, Filter, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import DataTable from '../ui/DataTable';
import FilterBar from '../ui/FilterBar';
import { fetchMockData } from '../../services/mockApi';

const AdminSystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const logsData = await fetchMockData('getAdminSystemLogs');
      setLogs(logsData);
      toast.success('System logs refreshed.');
    } catch (error) {
      toast.error('Failed to load system logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      sortable: true,
      cell: (row) => <span className="text-sm">{new Date(row.timestamp).toLocaleString()}</span>,
    },
    {
      header: 'Level',
      accessor: 'level',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          {row.level === 'error' ? (
            <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
          )}
          <span className={`text-sm font-medium capitalize ${
            row.level === 'error' ? 'text-red-500' :
            row.level === 'warn' ? 'text-yellow-500' :
            'text-green-500'
          }`}>
            {row.level}
          </span>
        </div>
      ),
    },
    {
      header: 'Source',
      accessor: 'source',
      sortable: true,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.source}</span>,
    },
    {
      header: 'Message',
      accessor: 'message',
      cell: (row) => <span className="text-sm">{row.message}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="h-5 w-5 mr-2 text-primary" /> System Logs</CardTitle>
          <p className="text-sm text-muted-foreground">Review application, error, and security logs.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchPlaceholder="Search log messages or source..."
            onSearch={setSearchQuery}
            onRefresh={fetchData}
            onExport={() => toast.info('Exporting system logs...')}
            filterOptions={[
              { value: 'all', label: 'All Levels' },
              { value: 'info', label: 'Info' },
              { value: 'warn', label: 'Warning' },
              { value: 'error', label: 'Error' },
            ]}
            onFilterChange={setFilterLevel}
            dateRangeOptions={[]}
            onDateRangeChange={() => {}}
            extraButtons={[
              <Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            ]}
          />

          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Logs...</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLogs}
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystemLogs;
