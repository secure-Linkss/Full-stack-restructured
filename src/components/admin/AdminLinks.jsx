import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Link, RefreshCw, Filter, Trash2, Edit, BarChart3, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import DataTable from '../ui/DataTable';
import FilterBar from '../ui/FilterBar';
import ActionIconGroup from '../ui/ActionIconGroup';
import { fetchMockData } from '../../services/mockApi';

const AdminLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const linksData = await fetchMockData('getAdminLinks');
      setLinks(linksData);
      toast.success('All links refreshed.');
    } catch (error) {
      toast.error('Failed to load all links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = (action, link) => {
    toast.info(`${action} action triggered for link: ${link.shortUrl}`);
    // Mock action logic
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = !searchQuery ||
      link.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.shortUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || link.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Short Link',
      accessor: 'shortUrl',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          <a href={row.shortUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {row.shortUrl}
          </a>
          <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            row.status === 'active' ? 'bg-green-500/20 text-green-400' :
            row.status === 'expired' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {row.status}
          </span>
        </div>
      ),
    },
    {
      header: 'Owner',
      accessor: 'owner',
      sortable: true,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.owner}</span>,
    },
    {
      header: 'Clicks',
      accessor: 'clicks',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.clicks.toLocaleString()}</span>,
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => <span className="text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Link className="h-5 w-5 mr-2 text-primary" /> All Links Management</CardTitle>
          <p className="text-sm text-muted-foreground">View and manage all tracking and shortened links across the platform.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by URL or owner..."
            onSearch={setSearchQuery}
            onRefresh={fetchData}
            onExport={() => toast.info('Exporting all links...')}
            filterOptions={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'expired', label: 'Expired' },
            ]}
            onFilterChange={setFilterStatus}
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
            <div className="text-center text-muted-foreground p-10">Loading Links...</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLinks}
              pageSize={10}
              actions={(row) => (
                <div className="flex space-x-1">
                  <ActionIconGroup
                    actions={[
                      { icon: Copy, label: 'Copy Link', onClick: () => handleAction('Copy Link', row) },
                      { icon: BarChart3, label: 'View Analytics', onClick: () => handleAction('View Analytics', row) },
                      { icon: Edit, label: 'Edit Link', onClick: () => handleAction('Edit Link', row) },
                      { icon: Trash2, label: 'Delete Link', onClick: () => handleAction('Delete Link', row) },
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

export default AdminLinks;
