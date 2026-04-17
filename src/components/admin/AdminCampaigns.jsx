import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderKanban, RefreshCw, Filter, Trash2, Edit, BarChart3, Activity, Users, Link as LinkIcon, PowerOff, Target, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import api from '../../services/api';

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const campaignsData = await api.admin?.campaigns?.getAll() || [];
      
      const mappedCampaigns = campaignsData.map(c => ({
        ...c,
        linkCount: c.links_count || c.link_count || 0,
        totalClicks: c.total_clicks || 0,
        createdAt: c.created_at || new Date().toISOString(),
      }));
      
      setCampaigns(mappedCampaigns);
    } catch (error) {
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
        if (window.confirm(`FORCE DELETE: Are you sure you want to eradicate the campaign [${campaign.name}] routing array?`)) {
          await (api.admin?.campaigns?.delete || api.adminCampaigns?.delete)(campaign.id);
          toast.success('Campaign vector purged globally.');
          fetchData();
        }
      } else if (action === 'Pause Campaign') {
          toast.success(`Campaign [${campaign.name}] halted.`);
      } else {
        toast.info(`${action} routine activated for: ${campaign.name}`);
      }
    } catch (error) {
      toast.error(`Action failed: Network Error`);
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
      header: 'Campaign Hash',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          <span className="text-foreground">{row.name}</span>
          <div className="flex items-center gap-2 mt-1">
             <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded uppercase ${
               row.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981]' :
               row.status === 'paused' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
               'bg-[#ef4444]/10 text-[#ef4444]'
             }`}>
               {row.status}
             </span>
             <span className="text-[10px] text-muted-foreground font-mono">ID: {String(row.id ?? '').substring(0,8) || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Tenant Owner',
      accessor: 'owner',
      sortable: true,
      cell: (row) => (
         <div className="flex items-center">
            <Users className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">{row.owner || 'Unknown Entity'}</span>
         </div>
      ),
    },
    {
      header: 'Endpoint Nodes',
      accessor: 'linkCount',
      sortable: true,
      cell: (row) => (
         <div className="flex items-center">
            <LinkIcon className="w-3 h-3 mr-1 text-[#3b82f6]" />
            <span className="text-sm">{row.linkCount?.toLocaleString() || 0}</span>
         </div>
      ),
    },
    {
      header: 'Routing Volume',
      accessor: 'totalClicks',
      sortable: true,
      cell: (row) => (
         <div className="flex items-center">
            <Activity className="w-3 h-3 mr-1 text-[#10b981]" />
            <span className="text-sm font-mono">{row.totalClicks?.toLocaleString() || 0}</span>
         </div>
      ),
    },
    {
      header: 'Compilation Date',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Unknown'}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      
      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Total Campaigns</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">{campaigns.length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
               <FolderKanban className="w-5 h-5 text-[#3b82f6]" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Active Vectors</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">{campaigns.filter(u => u.status === 'active').length || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center shrink-0">
               <Activity className="w-5 h-5 text-[#10b981]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Aggregate Clicks</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">
                 {campaigns.reduce((acc, curr) => acc + (curr.totalClicks || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center shrink-0">
               <Target className="w-5 h-5 text-[#8b5cf6]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Global Nodes</p>
              <h3 className="text-2xl font-heading font-bold text-foreground">
                 {campaigns.reduce((acc, curr) => acc + (curr.linkCount || 0), 0).toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 flex items-center justify-center shrink-0">
               <LinkIcon className="w-5 h-5 text-[#f59e0b]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#1e2d47]">
        <CardHeader className="border-b border-[#1e2d47] bg-[#141d2e] rounded-t-lg">
          <CardTitle className="flex items-center text-lg"><FolderKanban className="h-5 w-5 mr-2 text-[#3b82f6]" /> Global Campaign Override</CardTitle>
          <CardDescription>Monitor and manipulate all tenant tracking arrays directly from the core.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 bg-background">
          <FilterBar
            searchPlaceholder="Analyze hash arrays or tenant identity..."
            onSearch={setSearchQuery}
            onRefresh={fetchData}
            onExport={() => toast.info('Extracting Campaign Matrix to CSV...')}
            filterOptions={[
              { value: 'all', label: 'All Operations' },
              { value: 'active', label: 'Live Operations' },
              { value: 'paused', label: 'Halted Operations' },
              { value: 'completed', label: 'Terminated Operations' },
            ]}
            onFilterChange={setFilterStatus}
            dateRangeOptions={[]}
            onDateRangeChange={() => {}}
            extraButtons={[
              <Button key="filter" variant="outline" size="sm" className="border-[#1e2d47] text-xs">
                <Filter className="h-3.5 w-3.5 mr-2" /> Parameters
              </Button>
            ]}
          />

          {loading ? (
            <div className="text-center text-muted-foreground p-10 flex flex-col items-center">
               <RefreshCw className="w-8 h-8 animate-spin text-[#3b82f6] opacity-50 mb-3" />
               Synchronizing Neural Vectors...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCampaigns}
              pageSize={15}
              actions={(row) => (
                <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 border-[#1e2d47] hover:bg-[#1e2d47]/50 text-xs shadow-sm">
                         Command Node
                      </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-52 bg-[#141d2e] border-[#1e2d47] shadow-xl">
                      <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono tracking-widest">{row.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('View Analytics', row)} className="text-xs cursor-pointer focus:bg-[#3b82f6]/10 focus:text-[#3b82f6]">
                         <BarChart3 className="w-3.5 h-3.5 mr-2" /> Inspect Telemetry
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('View Reports', row)} className="text-xs cursor-pointer focus:bg-white/5">
                         <FileText className="w-3.5 h-3.5 mr-2" /> Generate Report
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('Pause Campaign', row)} className="text-xs cursor-pointer focus:bg-[#f59e0b]/10 focus:text-[#f59e0b]">
                         <PowerOff className="w-3.5 h-3.5 mr-2" /> Halt Execution
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Edit Campaign', row)} className="text-xs cursor-pointer focus:bg-white/5">
                         <Edit className="w-3.5 h-3.5 mr-2" /> Intercept & Modify
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('Delete Campaign', row)} className="text-xs cursor-pointer text-[#ef4444] focus:bg-[#ef4444]/10 focus:text-[#ef4444]">
                         <Trash2 className="w-3.5 h-3.5 mr-2" /> Eradicate Vector
                      </DropdownMenuItem>
                   </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCampaigns;
