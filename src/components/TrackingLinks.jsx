import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Plus, Link, Copy, RefreshCw, Trash2, Edit, Play, Pause, ExternalLink, Filter, Users, BarChart3, Eye, Shield } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import { fetchMockData } from '../services/mockApi';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import CreateLinkForm from './forms/CreateLink'; // Placeholder for the new form component

// --- Helper Component for Link Row Details ---
const LinkDetails = ({ link }) => (
  <div className="space-y-3 text-sm mt-2 p-4 bg-muted/50 rounded-lg border border-border">
    <div className="flex flex-col">
      <span className="font-semibold text-muted-foreground">Target URL:</span>
      <a href={link.targetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs truncate">{link.targetUrl}</a>
    </div>
    <div className="flex flex-col">
      <span className="font-semibold text-muted-foreground">Tracking URL:</span>
      <div className="flex items-center justify-between">
        <code className="text-xs text-foreground truncate">{link.trackingUrl}</code>
        <ActionIconGroup
          actions={[
            {
              icon: Copy,
              label: 'Copy Tracking URL',
              onClick: () => {
                navigator.clipboard.writeText(link.trackingUrl);
                toast.success('Tracking URL copied!');
              },
            },
            {
              icon: ExternalLink,
              label: 'Test Link',
              onClick: () => window.open(link.trackingUrl, '_blank'),
            },
          ]}
        />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-semibold text-muted-foreground">Pixel URL:</span>
      <div className="flex items-center justify-between">
        <code className="text-xs text-foreground truncate">{link.pixelUrl}</code>
        <ActionIconGroup
          actions={[
            {
              icon: Copy,
              label: 'Copy Pixel URL',
              onClick: () => {
                navigator.clipboard.writeText(link.pixelUrl);
                toast.success('Pixel URL copied!');
              },
            },
          ]}
        />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-semibold text-muted-foreground">Email Code:</span>
      <div className="flex items-center justify-between">
        <code className="text-xs text-foreground truncate">{link.emailCode}</code>
        <ActionIconGroup
          actions={[
            {
              icon: Copy,
              label: 'Copy Email Code',
              onClick: () => {
                navigator.clipboard.writeText(link.emailCode);
                toast.success('Email Code copied!');
              },
            },
          ]}
        />
      </div>
    </div>
  </div>
);

// --- Main Component ---
const TrackingLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [metrics, setMetrics] = useState({ totalClicks: 0, realVisitors: 0, botsBlocked: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [linksData, metricsData] = await Promise.all([
        fetchMockData('getTrackingLinks'),
        fetchMockData('getTrackingLinksMetrics'),
      ]);
      setLinks(linksData);
      setMetrics(metricsData);
      toast.success('Tracking links refreshed.');
    } catch (error) {
      console.error('Error fetching links:', error);
      toast.error('Failed to load tracking links.');
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
    toast.info(`${action} action triggered for link: ${link.campaignName}`);
    // Mock action logic
  };

  const filteredLinks = links.filter(link => {
    const matchesFilter = filter === 'all' || link.status === filter;
    const matchesSearch = !searchQuery ||
      link.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.targetUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const metricCards = [
    { title: 'Total Clicks', value: metrics.totalClicks.toLocaleString(), icon: BarChart3 },
    { title: 'Real Visitors', value: metrics.realVisitors.toLocaleString(), icon: Users },
    { title: 'Bots Blocked', value: metrics.botsBlocked.toLocaleString(), icon: Shield },
  ];

  const columns = [
    {
      header: 'Link Name',
      accessor: 'campaignName',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {row.campaignName}
          <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            row.status === 'active' ? 'bg-green-500/20 text-green-400' :
            row.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {row.status}
          </span>
        </div>
      ),
    },
    {
      header: 'Target URL',
      accessor: 'targetUrl',
      cell: (row) => <a href={row.targetUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{row.targetUrl}</a>,
    },
    {
      header: 'Clicks',
      accessor: 'totalClicks',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.totalClicks.toLocaleString()}</span>,
    },
    {
      header: 'Visitors',
      accessor: 'realVisitors',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.realVisitors.toLocaleString()}</span>,
    },
    {
      header: 'Security',
      accessor: 'security',
      cell: (row) => (
        <div className="flex items-center space-x-1">
          {row.securityFeatures.botBlocking && <Shield className="h-4 w-4 text-green-500" title="Bot Blocking Enabled" />}
          {row.securityFeatures.rateLimiting && <Eye className="h-4 w-4 text-yellow-500" title="Rate Limiting Enabled" />}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking Links"
        description="Create and manage your tracking links"
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
        searchPlaceholder="Search links..."
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        onExport={() => toast.info('Exporting links...')}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
          { value: 'expired', label: 'Expired' },
        ]}
        onFilterChange={setFilter}
        dateRangeOptions={[]} // Not needed for this view
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
          <CardTitle>Your Tracking Links</CardTitle>
          <p className="text-sm text-muted-foreground">Manage and monitor your tracking links</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Tracking Links...</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLinks}
              pageSize={10}
              actions={(row) => (
                <div className="flex space-x-1">
                  <ActionIconGroup
                    actions={[
                      { icon: Edit, label: 'Edit Link', onClick: () => handleAction('Edit', row) },
                      { icon: row.status === 'active' ? Pause : Play, label: row.status === 'active' ? 'Pause Link' : 'Activate Link', onClick: () => handleAction('Toggle Status', row) },
                      { icon: RefreshCw, label: 'Regenerate Link', onClick: () => handleAction('Regenerate', row) },
                      { icon: Trash2, label: 'Delete Link', onClick: () => handleAction('Delete', row) },
                    ]}
                  />
                </div>
              )}
              // Note: For a real implementation, the LinkDetails would be rendered as an expandable row in the DataTable.
              // For this refactor, we'll keep it simple and assume the details are available via the Edit action for now.
            />
          )}
        </CardContent>
      </Card>

      {/* Create New Link Modal (Based on IMG_5375.jpeg) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Link</DialogTitle>
          </DialogHeader>
          <CreateLinkForm onClose={() => setIsCreateModalOpen(false)} onLinkCreated={fetchData} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackingLinks;
