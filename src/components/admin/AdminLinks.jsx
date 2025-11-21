import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Link, RefreshCw, Filter, Trash2, Edit, BarChart3, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import DataTable from '../ui/DataTable';
import FilterBar from '../ui/FilterBar';
import ActionIconGroup from '../ui/ActionIconGroup';
import api from '../../services/api';

const AdminLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const linksData = await api.adminLinks.getAll();
      
      // Map backend data to frontend structure
      const mappedLinks = linksData.map(l => ({
        ...l,
        shortUrl: l.short_code, // Map short_code to shortUrl
        targetUrl: l.target_url, // Map target_url to targetUrl
        clicks: l.total_clicks, // Map total_clicks to clicks
        createdAt: l.created_at // Map created_at to createdAt
      }));
      
      setLinks(mappedLinks);
      toast.success('All links refreshed.');
    } catch (error) {
      console.error('Fetch links error:', error);
      toast.error('Failed to load all links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action, link) => {
    try {
      if (action === 'Delete Link') {
        if (window.confirm(`Are you sure you want to delete link ${link.shortUrl}?`)) {
          await api.adminLinks.delete(link.id);
          toast.success('Link deleted successfully');
          fetchData();
        }
      } else if (action === 'Copy Link') {
        const url = `${window.location.origin}/t/${link.shortUrl}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } else {
        toast.info(`${action} action triggered for link: ${link.shortUrl}`);
      }
    } catch (error) {
      toast.error(`Action failed: ${error.message}`);
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = !searchQuery ||
      (link.targetUrl && link.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (link.shortUrl && link.shortUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (link.owner && link.owner.toLowerCase().includes(searchQuery.toLowerCase()));
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
          <a href={`/t/${row.shortUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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
      cell: (row) => <span className="text-sm">{row.clicks?.toLocaleString() || 0}</span>,
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Unknown'}</span>,
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
