import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Plus, FolderKanban, RefreshCw, Trash2, Edit, BarChart3, Filter } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import CreateCampaignForm from './forms/CreateCampaign'; // Placeholder for the new form component
import EditCampaignModal from './EditCampaignModal';

// --- Main Component ---
const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [metrics, setMetrics] = useState({ totalCampaigns: 0, activeCampaigns: 0, totalClicks: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsData, metricsData] = await Promise.all([
        api.campaigns.getAll(),
        api.campaigns.getMetrics(),
      ]);
      setCampaigns(campaignsData);
      setMetrics(metricsData);
      toast.success('Campaigns refreshed.');
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns.');
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

  const handleCreateNewCampaign = () => {
    setIsCreateModalOpen(true);
  };

  const handleAction = async (action, campaign) => {
    if (action === 'Edit') {
       setSelectedCampaign(campaign);
       setIsEditModalOpen(true);
    } else if (action === 'Delete') {
       if (window.confirm(`Are you absolutely sure you want to delete campaign ${campaign.name}?`)) {
          try {
             await api.campaigns.delete(campaign.id);
             toast.success('Campaign deleted successfully.');
             fetchData();
          } catch (e) {
             toast.error('Failed to delete campaign.');
          }
       }
    } else if (action === 'View Analytics') {
       navigate(`/analytics?campaign=${encodeURIComponent(campaign.name)}`);
    } else {
       toast.info(`${action} for campaign: ${campaign.name}`);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = !searchQuery ||
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(campaign.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const metricCards = [
    { title: 'Total Campaigns', value: metrics.totalCampaigns.toLocaleString(), icon: FolderKanban },
    { title: 'Active Campaigns', value: metrics.activeCampaigns.toLocaleString(), icon: BarChart3 },
    { title: 'Total Clicks', value: metrics.totalClicks.toLocaleString(), icon: BarChart3 },
  ];

  const columns = [
    {
      header: 'Campaign Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {row.name}
          <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${row.status === 'active' ? 'bg-green-500/20 text-green-400' :
              row.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
            }`}>
            {row.status}
          </span>
        </div>
      ),
    },
    {
      header: 'ID',
      accessor: 'id',
      cell: (row) => <code className="text-sm text-muted-foreground">{row.id}</code>,
    },
    {
      header: 'Links',
      accessor: 'link_count',
      sortable: true,
      cell: (row) => <span className="text-sm">{(row.link_count || 0).toLocaleString()}</span>,
    },
    {
      header: 'Clicks',
      accessor: 'total_clicks',
      sortable: true,
      cell: (row) => <span className="text-sm">{(row.total_clicks || 0).toLocaleString()}</span>,
    },
    {
      header: 'Conversion Rate',
      accessor: 'conversion_rate',
      sortable: true,
      cell: (row) => <span className="text-sm">{(row.conversion_rate || 0).toFixed(1)}%</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Organize and manage your tracking links into campaigns"
        actions={
          <Button onClick={handleCreateNewCampaign} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create New Campaign
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
        searchPlaceholder="Search campaigns by name or ID..."
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        onExport={async () => {
          if (!campaigns.length) return toast.error('No campaigns to export.');
          const headers = ['Name', 'Status', 'Total Clicks', 'Captured Emails', 'Created'];
          const rows = filteredCampaigns.map(c => [
            c.name || '', c.status || '', c.total_clicks || 0, c.captured_emails || 0,
            c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
          ]);
          const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `campaigns-${new Date().toISOString().slice(0,10)}.csv`; a.click();
          URL.revokeObjectURL(url);
          toast.success('Campaigns exported.');
        }}
        filterOptions={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
          { value: 'completed', label: 'Completed' },
        ]}
        onFilterChange={setFilter}
        dateRangeOptions={[]} // Not needed for this view
        onDateRangeChange={() => { }}
        extraButtons={[
          <Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <p className="text-sm text-muted-foreground">List of all campaigns and their performance summary</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground p-10">Loading Campaigns...</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCampaigns}
              pageSize={10}
              actions={(row) => (
                <div className="flex space-x-1">
                  <ActionIconGroup
                    actions={[
                      { icon: BarChart3, label: 'View Analytics', onClick: () => handleAction('View Analytics', row) },
                      { icon: Edit, label: 'Edit Campaign', onClick: () => handleAction('Edit', row) },
                      { icon: Trash2, label: 'Delete Campaign', onClick: () => handleAction('Delete', row) },
                    ]}
                  />
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Create New Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Campaign</DialogTitle>
          </DialogHeader>
          <CreateCampaignForm onClose={() => setIsCreateModalOpen(false)} onCampaignCreated={fetchData} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Campaign Modal */}
      <EditCampaignModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={fetchData} 
        campaign={selectedCampaign} 
      />
    </div>
  );
};

export default Campaigns;
