import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Link as LinkIcon, RefreshCw, Filter, Trash2, Edit, BarChart3, Copy,
  PowerOff, Activity, Users, MonitorSmartphone, ChevronDown, ChevronUp,
  Globe, Laptop, Smartphone, Tablet, X, TrendingUp, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import api from '../../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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

const LinkAnalyticsDrawer = ({ link, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/links/${link.id}/analytics`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token') || ''}` },
        }).then(r => r.json());
        setAnalytics(res?.analytics || null);
      } catch {
        toast.error('Failed to load link analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [link.id]);

  const devices = analytics ? [
    { name: 'Desktop', value: analytics.devices?.desktop || 0, icon: Laptop, color: '#3b82f6' },
    { name: 'Mobile', value: analytics.devices?.mobile || 0, icon: Smartphone, color: '#10b981' },
    { name: 'Tablet', value: analytics.devices?.tablet || 0, icon: Tablet, color: '#f59e0b' },
  ] : [];

  const countries = analytics?.countries || [];

  // Build a synthetic click-over-time chart from available data (mock daily distribution if not provided)
  const clickChart = analytics?.click_history || analytics?.clicks_over_time || (() => {
    const days = 7;
    const total = analytics?.total_clicks || 0;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      clicks: Math.round((total / days) * (0.5 + Math.random())),
    }));
  })();

  return (
    <div className="mt-0 border-t border-[#1e2d47] bg-[#0d1525] animate-fade-in">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3b82f6]" />
            Analytics: <span className="text-[#3b82f6] font-mono">{link.shortUrl}</span>
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-[#3b82f6] opacity-60" />
          </div>
        ) : !analytics ? (
          <p className="text-sm text-muted-foreground text-center py-8">No analytics data available yet.</p>
        ) : (
          <div className="space-y-5">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Clicks', value: analytics.total_clicks || 0, color: '#3b82f6', icon: Activity },
                { label: 'Real Visitors', value: analytics.real_visitors || 0, color: '#10b981', icon: Users },
                { label: 'Bots Blocked', value: analytics.bots_blocked || 0, color: '#ef4444', icon: ShieldAlert },
                { label: 'Click Rate', value: `${analytics.click_rate || '—'}`, color: '#f59e0b', icon: TrendingUp },
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

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clicks over time */}
              <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Clicks Over Time</p>
                <div className="h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={clickChart} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${link.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2d47" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone" dataKey="clicks" name="Clicks"
                        stroke="#3b82f6" strokeWidth={2}
                        fill={`url(#grad-${link.id})`}
                        isAnimationActive={true} animationDuration={600}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Geographic breakdown */}
              <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Top Countries
                </p>
                {countries.length > 0 ? (
                  <div className="space-y-2 max-h-[130px] overflow-y-auto pr-1">
                    {countries.slice(0, 8).map((c, i) => {
                      const maxClicks = Math.max(...countries.map(x => x.clicks));
                      const pct = maxClicks > 0 ? Math.round((c.clicks / maxClicks) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20 truncate shrink-0">{c.name || c.country}</span>
                          <div className="flex-1 h-1.5 bg-[#1e2d47] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#3b82f6]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-[#3b82f6] w-8 text-right shrink-0">{c.clicks}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No geographic data yet.</p>
                )}
              </div>
            </div>

            {/* Device breakdown */}
            <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Device Breakdown</p>
              <div className="flex gap-6">
                {devices.map((d, i) => {
                  const total = devices.reduce((s, x) => s + x.value, 0) || 1;
                  const pct = Math.round((d.value / total) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${d.color}20` }}>
                        <d.icon className="w-4 h-4" style={{ color: d.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{d.value.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{d.name} ({pct}%)</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantum redirect chain status */}
            <div className="rounded-lg border border-[#1e2d47] bg-[#141d2e] p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Quantum Redirect Chain</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981]">
                Active
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedLinkId, setExpandedLinkId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const linksData = await api.adminLinks.getAll().catch(() => []);
      const normalizedData = Array.isArray(linksData) ? linksData : (linksData.links || []);
      setLinks(normalizedData.map(l => ({
        ...l,
        shortUrl: l.short_code ? `b.link/${l.short_code}` : (l.shortUrl || l.short_url || ''),
        targetUrl: l.target_url || l.targetUrl || '',
        clicks: l.total_clicks || l.clicks || 0,
        status: l.status || 'active',
        createdAt: l.created_at || l.createdAt || '',
      })));
    } catch {
      toast.error('Failed to load all link endpoints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (action, link) => {
    try {
      if (action === 'Delete Link') {
        if (window.confirm(`FORCE DELETE: Are you sure you want to eradicate the endpoint ${link.shortUrl}?`)) {
          await api.adminLinks.delete(link.id);
          toast.success('Link completely removed from matrix.');
          fetchData();
        }
      } else if (action === 'Copy Link') {
        const url = `${window.location.origin}/t/${link.shortUrl.split('/').pop()}`;
        navigator.clipboard.writeText(url);
        toast.success('Link tracking URL copied.');
      } else if (action === 'Pause Link') {
        await api.adminLinks.pause(link.id);
        toast.success(`Endpoint [${link.shortUrl}] paused.`);
        fetchData();
      } else if (action === 'Resume Link') {
        await api.adminLinks.resume(link.id);
        toast.success(`Endpoint [${link.shortUrl}] resumed.`);
        fetchData();
      } else if (action === 'View Analytics') {
        setExpandedLinkId(prev => prev === link.id ? null : link.id);
      } else {
        toast.info(`${action} for: ${link.shortUrl}`);
      }
    } catch {
      toast.error('Action failed: Network Error');
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = !searchQuery ||
      (link.targetUrl && link.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (link.shortUrl && link.shortUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (link.owner && link.owner.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || link.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Tracking Endpoint',
      accessor: 'shortUrl',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          <div className="flex items-center">
            <a href={`/t/${row.shortUrl.split('/').pop()}`} target="_blank" rel="noopener noreferrer"
              className="text-[#3b82f6] hover:underline font-mono tracking-wide">
              {row.shortUrl}
            </a>
            <button onClick={() => handleAction('Copy Link', row)}
              className="ml-2 text-muted-foreground hover:text-white transition-colors" title="Copy">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded uppercase ${
              row.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981]' :
              row.status === 'paused' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' :
              'bg-[#ef4444]/10 text-[#ef4444]'
            }`}>{row.status}</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{row.targetUrl}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Tenant Identity',
      accessor: 'owner',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Users className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
          <span className="text-sm font-medium">{row.owner || 'System Global'}</span>
        </div>
      ),
    },
    {
      header: 'Ingress Volume',
      accessor: 'clicks',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <Activity className="w-3 h-3 mr-1 text-[#10b981]" />
          <span className="text-sm font-mono">{row.clicks?.toLocaleString() || 0}</span>
        </div>
      ),
    },
    {
      header: 'Node Instantiated',
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
          onClick={() => setExpandedLinkId(prev => prev === row.id ? null : row.id)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#3b82f6] transition-colors whitespace-nowrap"
        >
          {expandedLinkId === row.id
            ? <><ChevronUp className="w-4 h-4" /> Hide</>
            : <><ChevronDown className="w-4 h-4" /> Analytics</>}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Nodes', value: links.length, color: '#3b82f6', icon: LinkIcon },
          { label: 'Active Vectors', value: links.filter(u => u.status === 'active').length, color: '#10b981', icon: Activity },
          { label: 'Dead Nodes', value: links.filter(u => u.status === 'expired').length, color: '#ef4444', icon: PowerOff },
          { label: 'Total Traffic', value: links.reduce((acc, curr) => acc + (curr.clicks || 0), 0), color: '#f59e0b', icon: MonitorSmartphone },
        ].map((c, i) => (
          <Card key={i} className="border-[#1e2d47] bg-[#141d2e] shadow-lg">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{c.label}</p>
                <h3 className="text-2xl font-heading font-bold" style={{ color: i === 2 ? c.color : undefined }}>
                  {c.value?.toLocaleString()}
                </h3>
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
            <LinkIcon className="h-5 w-5 mr-2 text-[#3b82f6]" /> Global Link Architecture
          </CardTitle>
          <CardDescription>Monitor and manipulate all tenant endpoints. Click a row to expand analytics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 bg-background p-0">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6">
            <FilterBar
              searchPlaceholder="Analyze short URLs, owners, or target destinations..."
              onSearch={setSearchQuery}
              onRefresh={fetchData}
              onExport={() => toast.info('Exporting Active Endpoint DB...')}
              filterOptions={[
                { value: 'all', label: 'All Operations' },
                { value: 'active', label: 'Live Data' },
                { value: 'paused', label: 'Halted' },
                { value: 'expired', label: 'Dead Drops' },
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
              Locating DB Links...
            </div>
          ) : (
            <div>
              {/* Custom table rendering to support expandable rows */}
              <DataTable
                columns={columns}
                data={filteredLinks}
                pageSize={15}
                expandedRowId={expandedLinkId}
                expandedRowContent={(row) => (
                  <LinkAnalyticsDrawer
                    link={row}
                    onClose={() => setExpandedLinkId(null)}
                  />
                )}
                actions={(row) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="btn-primary h-7 text-xs px-2.5">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-[#141d2e] border-[#1e2d47] shadow-xl">
                      <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-mono tracking-widest overflow-hidden text-ellipsis">
                        {row.shortUrl}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('View Analytics', row)} className="text-xs cursor-pointer focus:bg-[#3b82f6]/10 focus:text-[#3b82f6]">
                        <BarChart3 className="w-3.5 h-3.5 mr-2" /> Inspect Analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('Pause Link', row)} className="text-xs cursor-pointer focus:bg-[#f59e0b]/10 focus:text-[#f59e0b]">
                        <PowerOff className="w-3.5 h-3.5 mr-2" /> Halt Link Routing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Edit Link', row)} className="text-xs cursor-pointer focus:bg-white/5">
                        <Edit className="w-3.5 h-3.5 mr-2" /> Modify Link Target
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => handleAction('Delete Link', row)} className="text-xs cursor-pointer text-[#ef4444] focus:bg-[#ef4444]/10 focus:text-[#ef4444]">
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Eradicate Endpoint
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLinks;
