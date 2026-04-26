import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FolderKanban, RefreshCw, Filter, Trash2, Edit, BarChart3, Activity,
  Users, Link as LinkIcon, PowerOff, Target, FileText, ChevronDown, ChevronUp,
  X, TrendingUp, CheckCircle2, PauseCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import api from '../../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#141d2e] border border-[#1e2d47] rounded-lg p-3 shadow-xl text-xs">
        <p className="text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
        {payload.map((p, i) => (
          <div key={i}>
            <span style={{ color: p.color }} className="font-medium mr-1">{p.name}:</span>
            <span className="font-bold text-foreground">{p.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const STATUS_ICON = {
  active: { icon: CheckCircle2, color: '#10b981', label: 'Active' },
  paused: { icon: PauseCircle, color: '#f59e0b', label: 'Paused' },
  completed: { icon: Clock, color: '#64748b', label: 'Completed' },
  suspended: { icon: PauseCircle, color: '#ef4444', label: 'Suspended' },
};

const CampaignDetailsDrawer = ({ campaign, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.admin.campaigns.getById
          ? await api.admin.campaigns.getById(campaign.id)
          : await fetch(`/api/admin/campaigns/${campaign.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}` },
            }).then(r => r.json());
        setDetails(res || campaign);
      } catch {
        setDetails(campaign);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [campaign.id]);

  const data = details || campaign;

  // Build per-link performance chart data
  const links = data.links || data.link_details || [];
  const linkChartData = links.length > 0
    ? links.slice(0, 8).map(l => ({
        name: l.short_code || l.shortUrl || `Link #${l.id}`,
        clicks: l.total_clicks || l.clicks || 0,
        visitors: l.real_visitors || 0,
      }))
    : [
        { name: 'No link data', clicks: 0, visitors: 0 },
      ];

  const totalClicks = data.totalClicks || data.total_clicks || 0;
  const conversionRate = data.conversion_rate || (totalClicks > 0 ? ((data.conversions || 0) / totalClicks * 100).toFixed(1) : '0.0');
  const statusCfg = STATUS_ICON[data.status] || STATUS_ICON.active;

  return (
    <div className="border-t border-[#1e2d47] bg-[#0d1525] animate-fade-in">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3b82f6]" />
            Campaign Details: <span className="text-[#3b82f6]">{data.name}</span>
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-[#3b82f6] opacity-60" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Clicks', value: totalClicks, color: '#3b82f6', icon: Activity },
                { label: 'Conversions', value: data.conversions || 0, color: '#10b981', icon: TrendingUp },
                { label: 'Conv. Rate', value: `${conversionRate}%`, color: '#f59e0b', icon: Target },
                { label: 'Link Nodes', value: data.linkCount || links.length || 0, color: '#8b5cf6', icon: LinkIcon },
              ].map((kpi, i) => (
                <div key={i} className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{kpi.label}</span>
                    <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                  </div>
                  <span className="text-lg font-bold tabular-nums" style={{ color: kpi.color }}>
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Status + metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Campaign Status</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${statusCfg.color}20` }}>
                    <statusCfg.icon className="w-4 h-4" style={{ color: statusCfg.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: statusCfg.color }}>{statusCfg.label}</p>
                    <p className="text-[10px] text-muted-foreground">Campaign state</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-foreground">{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="text-foreground">{data.owner || 'Unknown'}</span>
                  </div>
                  {data.description && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">Description</span>
                      <span className="text-foreground text-right line-clamp-2">{data.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Link Performance Chart */}
              <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Link Performance</p>
                {links.length > 0 ? (
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={linkChartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="clicks" name="Clicks" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={600}>
                          {linkChartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[120px] text-muted-foreground text-xs">
                    No link performance data yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const raw = await api.admin.campaigns.getAll().catch(() => []);
      const campaignsData = Array.isArray(raw) ? raw : (raw.campaigns || []);
      setCampaigns(campaignsData.map(c => ({
        ...c,
        linkCount: c.links_count || c.link_count || 0,
        totalClicks: c.total_clicks || 0,
        createdAt: c.created_at || new Date().toISOString(),
      })));
    } catch {
      toast.error('Failed to load all campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (action, campaign) => {
    try {
      if (action === 'Delete Campaign') {
        if (window.confirm(`FORCE DELETE: Are you sure you want to eradicate the campaign [${campaign.name}] routing array?`)) {
          await api.admin.campaigns.delete(campaign.id);
          toast.success('Campaign vector purged globally.');
          fetchData();
        }
      } else if (action === 'Pause Campaign') {
        await api.adminCampaigns.suspend(campaign.id);
        toast.success(`Campaign [${campaign.name}] halted.`);
        fetchData();
      } else if (action === 'View Details') {
        setExpandedCampaignId(prev => prev === campaign.id ? null : campaign.id);
      } else {
        toast.info(`${action} routine activated for: ${campaign.name}`);
      }
    } catch {
      toast.error('Action failed: Network Error');
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
      cell: (row) => {
        const statusCfg = STATUS_ICON[row.status] || STATUS_ICON.active;
        return (
          <div className="font-medium">
            <span className="text-foreground">{row.name}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-widest px-2 py-0.5 rounded uppercase ${
                row.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981]' :
                row.status === 'paused' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
                row.status === 'suspended' ? 'bg-[#ef4444]/10 text-[#ef4444]' :
                'bg-[#64748b]/10 text-[#64748b]'
              }`}>
                <statusCfg.icon className="w-2.5 h-2.5" />
                {row.status || 'active'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">ID: {String(row.id ?? '').substring(0, 8) || 'N/A'}</span>
            </div>
          </div>
        );
      },
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
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Unknown'}
        </span>
      ),
    },
    {
      header: '',
      accessor: '_expand',
      cell: (row) => (
        <button
          onClick={() => setExpandedCampaignId(prev => prev === row.id ? null : row.id)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#3b82f6] transition-colors"
        >
          {expandedCampaignId === row.id
            ? <><ChevronUp className="w-4 h-4" /> Collapse</>
            : <><ChevronDown className="w-4 h-4" /> Details</>
          }
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: campaigns.length, color: '#3b82f6', icon: FolderKanban },
          { label: 'Active Vectors', value: campaigns.filter(u => u.status === 'active').length, color: '#10b981', icon: Activity },
          { label: 'Aggregate Clicks', value: campaigns.reduce((acc, curr) => acc + (curr.totalClicks || 0), 0), color: '#8b5cf6', icon: Target },
          { label: 'Global Nodes', value: campaigns.reduce((acc, curr) => acc + (curr.linkCount || 0), 0), color: '#f59e0b', icon: LinkIcon },
        ].map((c, i) => (
          <Card key={i} className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{c.label}</p>
                <h3 className="text-2xl font-heading font-bold text-foreground">{c.value?.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.color}20` }}>
                <c.icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#1e2d47]">
        <CardHeader className="border-b border-[#1e2d47] bg-[#141d2e] rounded-t-lg">
          <CardTitle className="flex items-center text-lg">
            <FolderKanban className="h-5 w-5 mr-2 text-[#3b82f6]" /> Global Campaign Override
          </CardTitle>
          <CardDescription>Monitor all tenant tracking arrays. Click a row to expand campaign details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 bg-background p-0">
          <div className="px-6 pt-6">
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
          </div>

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
              expandedRowId={expandedCampaignId}
              expandedRowContent={(row) => (
                <CampaignDetailsDrawer
                  campaign={row}
                  onClose={() => setExpandedCampaignId(null)}
                />
              )}
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
                    <DropdownMenuItem onClick={() => handleAction('View Details', row)} className="text-xs cursor-pointer focus:bg-[#3b82f6]/10 focus:text-[#3b82f6]">
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
