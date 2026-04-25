import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Download, Link, MousePointerClick, Users, Mail, CheckCircle, 
  Globe, TrendingUp, DollarSign, Minus, Activity, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const dashboardData = await api.dashboard.getMetrics(dateRange);
      const performanceData = await api.dashboard.getPerformanceOverTime(parseInt(dateRange));
      const deviceData = await api.dashboard.getDeviceBreakdown();
      const countriesData = await api.dashboard.getTopCountries();
      const campaignData = await api.dashboard.getCampaignPerformance();
      const capturesData = await api.dashboard.getRecentCaptures();

      setData({
        metrics: dashboardData,
        performance: performanceData,
        deviceBreakdown: deviceData,
        topCountries: countriesData,
        campaignPerformance: campaignData,
        recentCaptures: capturesData
      });
      
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
      
      // Initialize with empty state so UI renders gracefully
      setData({
        metrics: {
          totalLinks: 0, totalClicks: 0, realVisitors: 0, capturedEmails: 0, activeLinks: 0,
          conversionRate: 0, bounceRate: 0, avgClicksPerLink: 0, countries: 0,
          totalLinksChange: 0, totalClicksChange: 0, realVisitorsChange: 0, capturedEmailsChange: 0, activeLinksChange: 0,
          conversionRateChange: 0, bounceRateChange: 0, avgClicksPerLinkChange: 0
        },
        performance: { labels: [], clicks: [], visitors: [], emailCaptures: [] },
        deviceBreakdown: { labels: [], data: [] },
        topCountries: [], campaignPerformance: [], recentCaptures: []
      });
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleExport = async () => {
    try {
      toast.loading('Exporting dashboard data...');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/analytics/export?format=csv', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Dashboard data exported.');
    } catch (error) {
      toast.dismiss();
      toast.error('Export failed.');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#10b981]/20 border-t-[#10b981] rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading Analytics Data...</p>
        </div>
      </div>
    );
  }

  const { metrics, performance, deviceBreakdown, topCountries, campaignPerformance, recentCaptures } = data;

  // Transform performance data for Recharts
  const chartData = (performance?.labels || []).map((label, idx) => ({
    date: label,
    clicks: performance?.clicks?.[idx] || 0,
    visitors: performance?.visitors?.[idx] || 0,
    captures: performance?.emailCaptures?.[idx] || 0,
  }));

  const deviceDataForChart = (deviceBreakdown?.labels || []).map((label, idx) => ({
    name: label,
    value: deviceBreakdown?.data?.[idx] || 0
  }));
  const deviceColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const metricCardsData = [
    { title: 'Total Clicks', value: metrics.totalClicks?.toLocaleString() || '0', change: metrics.totalClicksChange || 0, color: 'blue', icon: MousePointerClick, subtext: `Across ${metrics.activeLinks || 0} active links` },
    { title: 'Real Visitors', value: metrics.realVisitors?.toLocaleString() || '0', change: metrics.realVisitorsChange || 0, color: 'green', icon: Users, subtext: `${metrics.botBlocked ?? 0} Bots Blocked` },
    { title: 'Captured Leads', value: metrics.capturedEmails?.toLocaleString() || '0', change: metrics.capturedEmailsChange || 0, color: 'amber', icon: Mail, subtext: `From ${metrics.countries || 0} Geographies` },
    { title: 'Link Conversion', value: `${metrics.conversionRate || 0}%`, change: metrics.conversionRateChange || 0, color: 'red', icon: TrendingUp, subtext: `Via Pixel URL Embeds` },
  ];

  const secondaryMetrics = [
    { title: 'Active Links', value: metrics.activeLinks || 0 },
    { title: 'Bounce Rate', value: `${metrics.bounceRate || 0}%` },
    { title: 'Avg Clicks/Link', value: metrics.avgClicksPerLink || 0 },
    { title: 'Countries', value: metrics.countries || 0 },
  ];

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 shadow-2xl min-w-[150px]">
          <p className="text-xs text-muted-foreground font-medium mb-2 uppercase">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-sm mb-1">
              <span style={{ color: entry.color }} className="font-medium mr-4">{entry.name}</span>
              <span className="tabular-nums-custom font-bold text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExportEmails = async () => {
    try {
      toast.loading('Extracting captured leads...');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/analytics/export?format=csv&type=emails', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-capture-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('leads_capture_export.csv downloaded.');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export leads.');
    }
  };

  return (
    <div className="animate-fade-in w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-heading text-foreground">Analytics Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time performance metrics and pixel insights</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 border-b sm:border-b-0 border-border pb-3 sm:pb-0">
          <div className="enterprise-card p-1 flex mr-2">
            {['24h', '7d', '30d', '90d'].map(limit => (
              <button 
                key={limit}
                onClick={() => setDateRange(limit)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  dateRange === limit 
                    ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {limit.toUpperCase()}
              </button>
            ))}
          </div>
          
          <button 
            onClick={fetchData} 
            className="btn-secondary text-xs h-9 px-3"
            disabled={isRefreshing}
            title="Sync Matrix"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExport} className="btn-secondary text-xs h-9 px-3">
            <Download className="w-3.5 h-3.5 mr-1.5 hidden sm:block" /> Dashboard CSV
          </button>
          <button onClick={handleExportEmails} className="btn-primary text-xs h-9 px-3 bg-[#f59e0b] hover:bg-[#d97706] border-none text-[#141d2e] font-bold">
            <Mail className="w-3.5 h-3.5 mr-1.5" /> Export Leads
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 w-full">
        {metricCardsData.map((card, idx) => (
          <div key={idx} className={`enterprise-card p-5 relative overflow-hidden group glow-hover-${card.color} enterprise-stat-card-${card.color}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{card.title}</p>
                <h3 className="text-3xl font-heading text-foreground mt-1 tabular-nums-custom">{card.value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-[rgba(255,255,255,0.03)] text-${card.color === 'green' ? '[#10b981]' : card.color === 'blue' ? '[#3b82f6]' : card.color === 'amber' ? '[#f59e0b]' : '[#ef4444]'}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center text-xs mt-2 justify-between">
              <div className="flex items-center">
                <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-full ${
                  card.change >= 0 
                    ? 'text-[#10b981] bg-[rgba(16,185,129,0.1)]' 
                    : 'text-[#ef4444] bg-[rgba(239,68,68,0.1)]'
                }`}>
                  {card.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {Math.abs(card.change)}%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{card.subtext}</span>
            </div>
            
            {/* Ambient Background Glow */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-${card.color === 'green' ? '[#10b981]' : card.color === 'blue' ? '[#3b82f6]' : card.color === 'amber' ? '[#f59e0b]' : '[#ef4444]'}`}></div>
          </div>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="enterprise-card p-6 mb-6 w-full relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Traffic Analysis</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Visits, clicks and conversions over time</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
            <span className="text-xs text-muted-foreground mr-3">Clicks</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
            <span className="text-xs text-muted-foreground">Visitors</span>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2d47" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
              <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Device Breakdown */}
        <div className="enterprise-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Device Traffic</h3>
          <div className="h-[200px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceDataForChart} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e2d47" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#f0f4ff' }} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                <Bar dataKey="value" name="Traffic" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {deviceDataForChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={deviceColors[index % deviceColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Geographies */}
        <div className="enterprise-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top Geographies</h3>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {(topCountries || []).slice(0, 5).map((country, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">{country.name}</span>
                  <span className="text-muted-foreground tabular-nums-custom">{country.percentage}% ({country.clicks})</span>
                </div>
                <div className="w-full bg-[#1e2d47] rounded-full h-1.5">
                  <div className="bg-[#10b981] h-1.5 rounded-full" style={{ width: `${country.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {(!topCountries || topCountries.length === 0) && (
              <div className="text-center py-6 text-xs text-muted-foreground">No data available</div>
            )}
          </div>
        </div>

        {/* Live Event Stream / Recent Activity */}
        <div className="enterprise-card p-0 flex flex-col">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse-dot mr-2"></span>
              Recent Events
            </h3>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 p-2 overflow-y-auto max-h-[220px] custom-scrollbar">
            {(recentCaptures || []).slice(0, 6).map((item, idx) => (
              <div key={idx} className="p-3 hover:bg-[rgba(255,255,255,0.02)] border-b border-border last:border-0 rounded-md transition-colors flex items-start gap-3">
                <div className="bg-[rgba(59,130,246,0.1)] p-1.5 rounded-md text-[#3b82f6] shrink-0 mt-0.5">
                   <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground font-mono truncate">{item.email}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Via {item.link}</p>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap pt-1">
                   {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
            {(!recentCaptures || recentCaptures.length === 0) && (
              <div className="p-8 text-center text-xs text-muted-foreground">No recent events recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;