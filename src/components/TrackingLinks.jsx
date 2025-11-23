import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Plus, Link, Copy, RefreshCw, Trash2, Edit, Play, Pause, ExternalLink, Filter, Users, BarChart3, Eye, Shield } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import CreateLinkForm from './forms/CreateLink'; // Placeholder for the new form component

// --- Helper Component for Link Row Details ---
// This component displays the generated links (Tracking URL, Pixel URL, Email Code) and action buttons
export const LinkDetails = ({ link, handleAction }) => {
  const trackingUrl = link.trackingUrl || "N/A";
  const pixelUrl = link.pixelUrl || "N/A";
  const emailCode = link.emailCode || "N/A";

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const testLink = () => {
    if (trackingUrl !== "N/A") {
      window.open(trackingUrl, '_blank');
    } else {
      toast.error("Tracking URL is not available to test.");
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg border border-slate-700 text-sm">
      <h4 className="text-base font-semibold text-white">Generated Links</h4>
      
      {/* Tracking URL */}
      <div className="space-y-1">
        <span className="font-medium text-slate-400">TRACKING URL</span>
        <div className="flex items-center justify-between bg-slate-700 p-2 rounded-md">
          <code className="text-blue-400 text-xs sm:text-sm break-all pr-2">{trackingUrl}</code>
          <ActionIconGroup
            actions={[
              { icon: Copy, label: 'Copy Tracking URL', onClick: () => copyToClipboard(trackingUrl, 'Tracking URL') },
              { icon: ExternalLink, label: 'Test Link', onClick: testLink },
              { icon: RefreshCw, label: 'Regenerate Link', onClick: () => handleAction('Regenerate', link) },
            ]}
          />
        </div>
      </div>

      {/* PIXEL URL */}
      <div className="space-y-1">
        <span className="font-medium text-slate-400">PIXEL URL</span>
        <div className="flex items-center justify-between bg-slate-700 p-2 rounded-md">
          <code className="text-blue-400 text-xs sm:text-sm break-all pr-2">{pixelUrl}</code>
          <ActionIconGroup
            actions={[
              { icon: Copy, label: 'Copy Pixel URL', onClick: () => copyToClipboard(pixelUrl, 'Pixel URL') },
            ]}
          />
        </div>
      </div>

      {/* EMAIL CODE */}
      <div className="space-y-1">
        <span className="font-medium text-slate-400">EMAIL CODE</span>
        <div className="flex items-center justify-between bg-slate-700 p-2 rounded-md">
          <code className="text-blue-400 text-xs sm:text-sm break-all pr-2">{emailCode}</code>
          <ActionIconGroup
            actions={[
              { icon: Copy, label: 'Copy Email Code', onClick: () => copyToClipboard(emailCode, 'Email Code') },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

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
      const linksData = await api.getTrackingLinks();
      setLinks(linksData);

      // Calculate metrics from the fetched links data
      const totalClicks = linksData.reduce((sum, link) => sum + (link.totalClicks || 0), 0);
      const realVisitors = linksData.reduce((sum, link) => sum + (link.realVisitors || 0), 0);
      const botsBlocked = linksData.reduce((sum, link) => sum + (link.botsBlocked || 0), 0);
      setMetrics({ totalClicks, realVisitors, botsBlocked });
      
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

  const handleAction = async (action, link) => {
    if (action === 'Regenerate') {
      if (window.confirm(`Are you sure you want to regenerate the tracking link for "${link.campaignName}"? The old link will no longer work.`)) {
        try {
          // Assuming an API endpoint for regeneration exists
          // Use the new dedicated API method
          const response = await api.links.regenerate(link.id); 
          // In a real app, you would update the link in the state with the new URLs
          // For now, we'll just refetch all data
          fetchData();
          toast.success(`Link "${link.campaignName}" regenerated successfully!`);
        } catch (error) {
          toast.error(`Failed to regenerate link: ${error.message}`);
        }
      }
    } else if (action === 'Delete') {
      if (window.confirm(`Are you sure you want to delete the link "${link.campaignName}"?`)) {
        try {
          await api.links.delete(link.id);
          fetchData();
          toast.success(`Link "${link.campaignName}" deleted successfully.`);
        } catch (error) {
          toast.error(`Failed to delete link: ${error.message}`);
        }
      }
    } else {
      toast.info(`${action} action triggered for link: ${link.campaignName}`);
      // Mock action logic for other actions like Edit, Toggle Status
    }
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
	      header: 'Campaign Name',
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
	      header: 'Real Visitors',
	      accessor: 'realVisitors',
	      sortable: true,
	      cell: (row) => <span className="text-sm">{row.realVisitors.toLocaleString()}</span>,
	    },
	    {
	      header: 'Bots Blocked',
	      accessor: 'botsBlocked',
	      sortable: true,
	      cell: (row) => <span className="text-sm">{row.botsBlocked.toLocaleString()}</span>,
	    },
	    {
	      header: 'Status',
	      accessor: 'status',
	      cell: (row) => (
	        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
	          row.status === 'active' ? 'bg-green-500/20 text-green-400' :
	          row.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
	          'bg-red-500/20 text-red-400'
	        }`}>
	          {row.status}
	        </span>
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
              expandedContent={(row) => <LinkDetails link={row} handleAction={handleAction} />}
            />
          )}
        </CardContent>
      </Card>

	      {/* Create New Link Modal */}
	      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
	        <DialogContent className="sm:max-w-[600px] bg-card border-border">
	          <DialogHeader>
	            <DialogTitle className="text-foreground">Create New Tracking Link</DialogTitle>
	          </DialogHeader>
	          <CreateLinkForm 
	            onClose={() => setIsCreateModalOpen(false)} 
	            onLinkCreated={fetchData} 
	            type="tracking"
	          />
	        </DialogContent>
	      </Dialog>
    </div>
  );
};

export default TrackingLinks;
