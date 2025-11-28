import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Plus, FolderKanban, RefreshCw, Trash2, Edit, BarChart3, Filter, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import CreateCampaignForm from './forms/CreateCampaign';
import CampaignPreviewModal from './CampaignPreviewModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Main Component ---
const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [metrics, setMetrics] = useState({ totalCampaigns: 0, activeCampaigns: 0, totalClicks: 0 });
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsData, metricsData] = await Promise.all([
        api.campaigns.getAll(),
        api.campaigns.getMetrics(),
      ]);

      // Enhance campaign data with mock graphs if missing
      const enhancedCampaigns = campaignsData.map(c => ({
        ...c,
        clicksOverTime: c.clicks_over_time || [
          { name: 'Mon', clicks: Math.floor(Math.random() * 100) },
          { name: 'Tue', clicks: Math.floor(Math.random() * 100) },
          { name: 'Wed', clicks: Math.floor(Math.random() * 100) },
          { name: 'Thu', clicks: Math.floor(Math.random() * 100) },
          { name: 'Fri', clicks: Math.floor(Math.random() * 100) },
        ]
      }));

      setCampaigns(enhancedCampaigns);
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

  const handleAction = (action, campaign) => {
    if (action === 'Preview' || action === 'View Analytics') {
      setSelectedCampaign(campaign);
      setIsModalOpen(true);
    } else {
      toast.info(`${action} action triggered for campaign: ${campaign.name}`);
    }
  };

  const [campaignLinks, setCampaignLinks] = useState({});
  const [loadingLinks, setLoadingLinks] = useState({});

  const toggleRowExpansion = async (campaignId) => {
    const isExpanding = !expandedRows[campaignId];
    setExpandedRows(prev => ({
      ...prev,
      [campaignId]: isExpanding
    }));

    if (isExpanding && !campaignLinks[campaignId]) {
      setLoadingLinks(prev => ({ ...prev, [campaignId]: true }));
      try {
        // Fetch links for this campaign
        // Note: Assuming api.links.getAll returns an array. If it returns { links: [...] }, adjust accordingly.
        const response = await api.links.getAll({ campaign_id: campaignId });
        const links = Array.isArray(response) ? response : (response.links || []);
        setCampaignLinks(prev => ({ ...prev, [campaignId]: links }));
      } catch (error) {
        console.error('Error fetching campaign links:', error);
        toast.error('Failed to load campaign links');
      } finally {
        setLoadingLinks(prev => ({ ...prev, [campaignId]: false }));
      }
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = !searchQuery ||
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }).map(campaign => ({
    ...campaign,
    isExpanded: !!expandedRows[campaign.id],
    expandableContent: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Clicks Over Time</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaign.clicksOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Performance Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Total Clicks:</span> <span className="font-bold">{campaign.totalClicks}</span></div>
                  <div className="flex justify-between"><span>Links:</span> <span className="font-bold">{campaign.linkCount}</span></div>
                  <div className="flex justify-between"><span>Status:</span> <span className="capitalize">{campaign.status}</span></div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => handleAction('Preview', campaign)}>
                <Eye className="h-4 w-4 mr-2" /> Full Details
              </Button>
            </div>
          </div>
        </div>

        {/* Inline Links Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Campaign Links</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLinks[campaign.id] ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Loading links...</div>
            ) : campaignLinks[campaign.id] && campaignLinks[campaign.id].length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Short URL</th>
                      <th className="px-4 py-2">Clicks</th>
                      <th className="px-4 py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignLinks[campaign.id].map(link => (
                      <tr key={link.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-2 font-medium">{link.name || link.title || 'Untitled'}</td>
                        <td className="px-4 py-2 text-primary">
                          <a href={`${window.location.origin}/t/${link.shortCode}`} target="_blank" rel="noopener noreferrer">
                            {link.shortCode}
                          </a>
                        </td>
                        <td className="px-4 py-2">{link.clicks || 0}</td>
                        <td className="px-4 py-2">{new Date(link.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">No links found for this campaign.</div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }));

  const metricCards = [
    { title: 'Total Campaigns', value: metrics.totalCampaigns.toLocaleString(), icon: FolderKanban },
    { title: 'Active Campaigns', value: metrics.activeCampaigns.toLocaleString(), icon: BarChart3 },
    { title: 'Total Clicks', value: metrics.totalClicks.toLocaleString(), icon: BarChart3 },
  ];

  const columns = [
    {
      header: '',
      accessor: 'expand',
      cell: (row) => (
        <Button variant="ghost" size="sm" className="p-0 h-6 w-6" onClick={() => toggleRowExpansion(row.id)}>
          {expandedRows[row.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      )
    },
    {
      header: 'Campaign Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="font-medium cursor-pointer hover:underline" onClick={() => handleAction('Preview', row)}>
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
      accessor: 'linkCount',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.linkCount.toLocaleString()}</span>,
    },
    {
      header: 'Clicks',
      accessor: 'totalClicks',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.totalClicks.toLocaleString()}</span>,
    },
    {
      header: 'Conversion Rate',
      accessor: 'conversionRate',
      sortable: true,
      cell: (row) => <span className="text-sm">{Math.round(row.conversionRate * 100)}%</span>,
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
        onExport={() => toast.info('Exporting campaigns...')}
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
                      { icon: Eye, label: 'Preview', onClick: () => handleAction('Preview', row) },
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

      <CampaignPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={selectedCampaign}
      />
    </div>
  );
};

export default Campaigns;
