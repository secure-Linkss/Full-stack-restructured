import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, RefreshCw, Filter, Trash2, Edit, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import ActionIconGroup from '@/components/ui/ActionIconGroup';
import api from '../../services/api';

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const campaignsData = await api.admin.campaigns.getAll();
      
      // Map backend data to frontend structure
      const mappedCampaigns = campaignsData.map(c => ({
        ...c,
        linkCount: c.links_count || 0, // Fallback
        totalClicks: c.total_clicks || 0, // Fallback
        createdAt: c.created_at // Map created_at
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
      } else {
        toast.info(`${action} action triggered for campaign: ${campaign.name}`);
      }
    } catch (error) {
      toast.error(`Action failed: ${error.message}`);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchQuery ||
      (campaign.name && campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (campaign.owner && campaign.owner.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Campaign Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {row.name}
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
      header: 'Owner',
      accessor: 'owner',
      sortable: true,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.owner}</span>,
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
            onDateRangeChange={() => {}}
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
    </div>
  );
};

export default AdminCampaigns;
