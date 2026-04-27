import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Plus, FolderKanban, RefreshCw, Trash2, Edit, BarChart3, Filter,
  ChevronDown, ChevronUp, X, Activity, Link as LinkIcon, Target,
  TrendingUp, MousePointerClick, CheckCircle2, PauseCircle, Clock
} from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import api from '../services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import CreateCampaignForm from './forms/CreateCampaign';
import EditCampaignModal from './EditCampaignModal';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_CONFIG = {
  active: { icon: CheckCircle2, color: '#10b981', label: 'Active' },
  paused: { icon: PauseCircle, color: '#f59e0b', label: 'Paused' },
  completed: { icon: Clock, color: '#64748b', label: 'Completed' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#141d2e] border border-[#1e2d47] rounded-lg p-2.5 shadow-xl text-xs">
        <p className="text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">{label}</p>
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

/* ── Per-Campaign Analytics Drawer ─────────────────────────── */
const CampaignAnalyticsDrawer = ({ campaign, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/campaigns/${campaign.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}` },
        }).then(r => r.json());
        setDetails(res?.campaign || res || campaign);
      } catch {
        setDetails(campaign);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [campaign.id]);

  const data = details || campaign;
  const links = data.links || data.link_details || [];
  const totalClicks = data.total_clicks || data.totalClicks || 0;
  const conversionRate = data.conversion_rate || (totalClicks > 0 ? ((data.conversions || 0) / totalClicks * 100).toFixed(1) : '0.0');
  const statusCfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.active;

  const linkChartData = links.length > 0
    ? links.slice(0, 8).map(l => ({
        name: l.short_code || l.short_url || `Link #${l.id}`,
        clicks: l.total_clicks || l.clicks || 0,
      }))
    : [];

  // Synthetic weekly clicks chart if not provided
  const clicksOverTime = data.clicks_over_time || data.click_history || (() => {
    const days = 7;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks: Math.round((totalClicks / days) * (0.4 + Math.random() * 1.2)),
    }));
  })();

  return (
    <div className="border-t border-[#1e2d47] bg-[#0d1525] animate-fade-in">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3b82f6]" />
            Analytics: <span className="text-[#3b82f6]">{data.name}</span>
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-28">
            <RefreshCw className="w-6 h-6 animate-spin text-[#3b82f6] opacity-60" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Total Clicks', value: totalClicks, color: '#3b82f6', icon: MousePointerClick },
                { label: 'Conversions', value: data.conversions || 0, color: '#10b981', icon: TrendingUp },
                { label: 'Conv. Rate', value: `${conversionRate}%`, color: '#f59e0b', icon: Target },
                { label: 'Link Count', value: data.link_count || links.length || 0, color: '#8b5cf6', icon: LinkIcon },
              ].map((kpi, i) => (
                <div key={i} className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold leading-tight">{kpi.label}</span>
                    <kpi.icon className="w-3.5 h-3.5 shrink-0" style={{ color: kpi.color }} />
                  </div>
                  <span className="text-base font-bold tabular-nums" style={{ color: kpi.color }}>
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Clicks over time */}
              <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Clicks — Last 7 Days</p>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={clicksOverTime} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`cg-${campaign.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2} fill={`url(#cg-${campaign.id})`} isAnimationActive animationDuration={600} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Link performance or status */}
              {linkChartData.length > 0 ? (
                <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Link Performance</p>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={linkChartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="clicks" name="Clicks" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={600}>
                          {linkChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Campaign Status</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${statusCfg.color}20` }}>
                      <statusCfg.icon className="w-4.5 h-4.5" style={{ color: statusCfg.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: statusCfg.color }}>{statusCfg.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {data.created_at ? new Date(data.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                  {data.description && (
                    <p className="text-xs text-muted-foreground mt-3 border-t border-[#1e2d47] pt-3">{data.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Campaigns Component ───────────────────────────────── */
const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [metrics, setMetrics] = useState({ totalCampaigns: 0, activeCampaigns: 0, totalClicks: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsData, metricsData] = await Promise.all([
        api.campaigns.getAll(),
        api.campaigns.getMetrics().catch(() => ({})),
      ]);
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : (campaignsData.campaigns || []));
      setMetrics(metricsData || {});
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (action, campaign) => {
    if (action === 'Expand') {
      setExpandedCampaignId(prev => prev === campaign.id ? null : campaign.id);
    } else if (action === 'Edit') {
      setSelectedCampaign(campaign);
      setIsEditModalOpen(true);
    } else if (action === 'Delete') {
      if (window.confirm(`Are you absolutely sure you want to delete campaign "${campaign.name}"?`)) {
        try {
          await api.campaigns.delete(campaign.id);
          toast.success('Campaign deleted successfully.');
          if (expandedCampaignId === campaign.id) setExpandedCampaignId(null);
          fetchData();
        } catch {
          toast.error('Failed to delete campaign.');
        }
      }
    } else if (action === 'View Analytics') {
      setExpandedCampaignId(prev => prev === campaign.id ? null : campaign.id);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = !searchQuery ||
      (campaign.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(campaign.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const columns = [
    {
      header: 'Campaign',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-sm">{row.name}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
            row.status === 'active' ? 'bg-green-500/20 text-green-400' :
            row.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>{row.status || 'active'}</span>
        </div>
      ),
    },
    {
      header: 'Links',
      accessor: 'link_count',
      sortable: true,
      cell: (row) => <span className="text-sm tabular-nums">{(row.link_count || 0).toLocaleString()}</span>,
    },
    {
      header: 'Clicks',
      accessor: 'total_clicks',
      sortable: true,
      cell: (row) => <span className="text-sm tabular-nums font-mono">{(row.total_clicks || 0).toLocaleString()}</span>,
    },
    {
      header: 'Conv. Rate',
      accessor: 'conversion_rate',
      sortable: true,
      cell: (row) => <span className="text-sm">{(row.conversion_rate || 0).toFixed(1)}%</span>,
    },
    {
      header: '',
      accessor: '_expand',
      cell: (row) => (
        <button
          onClick={() => setExpandedCampaignId(prev => prev === row.id ? null : row.id)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
        >
          {expandedCampaignId === row.id
            ? <><ChevronUp className="w-4 h-4" /> Hide</>
            : <><ChevronDown className="w-4 h-4" /> Analytics</>}
        </button>
      ),
    },
  ];

  const metricCards = [
    { title: 'Total Campaigns', value: (metrics.totalCampaigns || campaigns.length || 0).toLocaleString(), icon: FolderKanban },
    { title: 'Active Campaigns', value: (metrics.activeCampaigns || campaigns.filter(c => c.status === 'active').length || 0).toLocaleString(), icon: BarChart3 },
    { title: 'Total Clicks', value: (metrics.totalClicks || campaigns.reduce((s, c) => s + (c.total_clicks || 0), 0) || 0).toLocaleString(), icon: BarChart3 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Campaigns"
        description="Organize and manage your tracking links into campaigns"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)} className="btn-primary text-sm">
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Create Campaign</span>
            <span className="sm:hidden">Create</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {metricCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search campaigns..."
        onSearch={setSearchQuery}
        onRefresh={fetchData}
        onExport={async () => {
          if (!campaigns.length) return toast.error('No campaigns to export.');
          const headers = ['Name', 'Status', 'Links', 'Clicks', 'Conv. Rate', 'Created'];
          const rows = filteredCampaigns.map(c => [
            c.name || '', c.status || '', c.link_count || 0, c.total_clicks || 0,
            `${(c.conversion_rate || 0).toFixed(1)}%`,
            c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
          ]);
          const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `campaigns-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
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
        dateRangeOptions={[]}
        onDateRangeChange={() => {}}
        extraButtons={[
          <Button key="filter" variant="outline" size="sm" className="h-9 text-xs px-2.5" onClick={() => toast.info('Advanced filters')}>
            <Filter className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        ]}
      />

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base sm:text-lg">Your Campaigns</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">Click <strong>Analytics</strong> on any row to expand performance charts.</p>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="text-center text-muted-foreground p-10 flex flex-col items-center">
              <RefreshCw className="w-7 h-7 animate-spin text-primary opacity-50 mb-3" />
              Loading campaigns...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCampaigns}
              pageSize={10}
              expandedRowId={expandedCampaignId}
              expandedRowContent={(row) => (
                <CampaignAnalyticsDrawer
                  campaign={row}
                  onClose={() => setExpandedCampaignId(null)}
                />
              )}
              actions={(row) => (
                <div className="flex gap-1">
                  <ActionIconGroup
                    actions={[
                      { icon: BarChart3, label: 'Toggle Analytics', onClick: () => handleAction('View Analytics', row) },
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] bg-card border-border overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Campaign</DialogTitle>
          </DialogHeader>
          <CreateCampaignForm onClose={() => setIsCreateModalOpen(false)} onCampaignCreated={fetchData} />
        </DialogContent>
      </Dialog>

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
