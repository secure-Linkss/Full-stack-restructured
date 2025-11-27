import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, RefreshCw, Filter, Trash2, Edit, BarChart3, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import ActionIconGroup from '@/components/ui/ActionIconGroup';
import api from '../../services/api';
import CampaignPreviewModal from '@/components/CampaignPreviewModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const campaignsData = await api.admin.campaigns.getAll();

      // Map backend data to frontend structure with enhanced fields
      const mappedCampaigns = campaignsData.map(c => ({
        ...c,
        linkCount: c.links_count || 0,
        totalClicks: c.total_clicks || 0,
        createdAt: c.created_at,
        type: c.type || 'Standard',
        impressions: c.impressions || 0,
        conversionRate: c.conversion_rate || '0%',
        totalVisitors: c.total_visitors || 0,
        lastActivity: c.last_activity_date || c.created_at,
        // Mock data for graphs if missing
        clicksOverTime: c.clicks_over_time || [
          { name: 'Mon', clicks: Math.floor(Math.random() * 500) },
          { name: 'Tue', clicks: Math.floor(Math.random() * 500) },
          { name: 'Wed', clicks: Math.floor(Math.random() * 500) },
          { name: 'Thu', clicks: Math.floor(Math.random() * 500) },
          { name: 'Fri', clicks: Math.floor(Math.random() * 500) },
        ]
      }));

      setCampaigns(mappedCampaigns);
      toast.success('All campaigns refreshed.');
    } catch (error) {
      console.error('Fetch campaigns error:', error);
      toast.error('Failed to load all campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action, campaign) => {
    try {
      if (action === 'Delete Campaign') {
        if (window.confirm(`Are you sure you want to delete campaign ${campaign.name}?`)) {
          await api.adminCampaigns.delete(campaign.id);
          toast.success('Campaign deleted successfully');
          fetchData();
        }
      } else if (action === 'View Analytics' || action === 'Preview') {
        setSelectedCampaign(campaign);
        setIsModalOpen(true);
      } else {
        toast.info(`${action} action triggered for campaign: ${campaign.name}`);
      }
    } catch (error) {
      toast.error(`Action failed: ${error.message}`);
    }
  };

  const toggleRowExpansion = (campaignId) => {
    setExpandedRows(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchQuery ||
      (campaign.name && campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (campaign.owner && campaign.owner.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).map(campaign => ({
    ...campaign,
    isExpanded: !!expandedRows[campaign.id],
    expandableContent: (
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
            <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Stats</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Impressions:</span> <span className="font-bold">{campaign.impressions}</span></div>
                <div className="flex justify-between"><span>Conversions:</span> <span className="font-bold">{campaign.conversionRate}</span></div>
                <div className="flex justify-between"><span>Visitors:</span> <span className="font-bold">{campaign.totalVisitors}</span></div>
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
    )
  }));

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
      header: 'Owner',
      accessor: 'owner',
      sortable: true,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.owner}</span>,
    },
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.type}</span>,
    },
    {
      header: 'Links',
      accessor: 'linkCount',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.linkCount?.toLocaleString() || 0}</span>,
    },
    {
      header: 'Clicks',
      accessor: 'totalClicks',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.totalClicks?.toLocaleString() || 0}</span>,
    },
    {
      header: 'Impressions',
      accessor: 'impressions',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.impressions?.toLocaleString() || 0}</span>,
    },
    {
      header: 'Conv. Rate',
      accessor: 'conversionRate',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.conversionRate}</span>,
    },
    {
      header: 'Visitors',
      accessor: 'totalVisitors',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.totalVisitors?.toLocaleString() || 0}</span>,
    },
    {
      header: 'Last Activity',
      accessor: 'lastActivity',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.lastActivity ? new Date(row.lastActivity).toLocaleDateString() : 'Never'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><FolderKanban className="h-5 w-5 mr-2 text-primary" /> All Campaigns Management</CardTitle>
          <p className="text-sm text-muted-foreground">View and manage all campaigns across the platform.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by campaign name or owner..."
            onSearch={setSearchQuery}
            onRefresh={fetchData}
            onExport={() => toast.info('Exporting all campaigns...')}
            filterOptions={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'completed', label: 'Completed' },
            ]}
            onFilterChange={setFilterStatus}
            dateRangeOptions={[]}
            onDateRangeChange={() => { }}
            extraButtons={[
              <Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            ]}
          />

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
                      { icon: Edit, label: 'Edit Campaign', onClick: () => handleAction('Edit Campaign', row) },
                      { icon: Trash2, label: 'Delete Campaign', onClick: () => handleAction('Delete Campaign', row) },
                    ]}
                  />
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      <CampaignPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={selectedCampaign}
      />
    </div>
  );
};

export default AdminCampaigns;
