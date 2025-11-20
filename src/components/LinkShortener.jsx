import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Link, Plus, RefreshCw, Filter, Copy, BarChart3, Trash2, Edit } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import CreateLinkForm from './forms/CreateLink'; // Reusing the form component

// --- Main LinkShortener Component ---

const LinkShortener = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [metrics, setMetrics] = useState({ totalLinks: 0, activeLinks: 0, totalClicks: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linksData, metricsData] = await Promise.all([
        api.getShortenedLinks(),
        api.getShortenerMetrics(),
      ]);
      setLinks(linksData);
      setMetrics(metricsData);
      toast.success('Shortened links refreshed.');
    } catch (error) {
      console.error('Error fetching shortened links:', error);
      toast.error('Failed to load shortened links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const handleCreateNewLink = () => {
    setIsCreateModalOpen(true);
  };

  const handleAction = (action, link) => {
    if (action === 'Copy Link') {
      navigator.clipboard.writeText(link.shortUrl);
      toast.success('Link copied to clipboard!');
    } else {
      toast.info(`${action} action triggered for link: ${link.shortUrl}`);
    }
    // Mock action logic
  };

  const filteredLinks = links.filter(link => {
    const matchesFilter = filter === 'all' || link.status === filter;
    const matchesSearch = !searchQuery ||
      link.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.shortUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const metricCards = [
    { title: 'Total Links', value: metrics.totalLinks.toLocaleString(), icon: Link },
    { title: 'Active Links', value: metrics.activeLinks.toLocaleString(), icon: Link },
    { title: 'Total Clicks', value: metrics.totalClicks.toLocaleString(), icon: BarChart3 },
  ];

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
      header: 'Target URL',
      accessor: 'targetUrl',
      cell: (row) => <span className="text-sm text-muted-foreground truncate max-w-xs block">{row.targetUrl}</span>,
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
      <PageHeader
        title="Link Shortener"
        description="Create, manage, and track your shortened links"
        actions={
          <Button onClick={handleCreateNewLink} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create New Link
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search links by short URL or target URL..."
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        onExport={() => toast.info('Exporting shortened links...')}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
          { value: 'expired', label: 'Expired' },
        ]}
        onFilterChange={setFilter}
        dateRangeOptions={[]} // Not typically needed for this view
        onDateRangeChange={() => {}}
        extraButtons={[
          <Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Your Shortened Links</CardTitle>
          <p className="text-sm text-muted-foreground">List of all links created with the shortener</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Shortened Links...</div>
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
                      { icon: Edit, label: 'Edit Link', onClick: () => handleAction('Edit', row) },
                      { icon: Trash2, label: 'Delete Link', onClick: () => handleAction('Delete', row) },
                    ]}
                  />
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Create New Link Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Short Link</DialogTitle>
          </DialogHeader>
          <CreateLinkForm onClose={() => setIsCreateModalOpen(false)} onLinkCreated={fetchData} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinkShortener;
