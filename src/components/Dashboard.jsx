import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import {
  RefreshCw, Download, MousePointerClick, Users, Mail,
  Globe, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Clock, Zap, BarChart3
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// Animated number counter
const AnimatedNumber = ({ value, suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(value);

  useEffect(() => {
    const start = 0;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    targetRef.current = end;
    if (end === 0) { setDisplay(0); return; }
    const duration = 900;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  const formatted = typeof value === 'string' && value.includes('%')
    ? `${display}%`
    : display.toLocaleString() + suffix;

  return <span>{formatted}</span>;
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

const METRIC_COLORS = {
  blue:  { accent: '#3b82f6', glow: 'rgba(59,130,246,0.18)',  border: 'rgba(59,130,246,0.25)',  bg: 'rgba(59,130,246,0.08)'  },
  green: { accent: '#10b981', glow: 'rgba(16,185,129,0.18)',  border: 'rgba(16,185,129,0.25)',  bg: 'rgba(16,185,129,0.08)'  },
  amber: { accent: '#f59e0b', glow: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.25)',  bg: 'rgba(245,158,11,0.08)'  },
  purple:{ accent: '#8b5cf6', glow: 'rgba(139,92,246,0.18)',  border: 'rgba(139,92,246,0.25)',  bg: 'rgba(139,92,246,0.08)'  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(8,15,38,0.97)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: entry.color, fontSize: 12, fontWeight: 500 }}>{entry.name}</span>
          <span style={{ color: '#f0f4ff', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const [dashboardData, performanceData, deviceData, countriesData, campaignData, capturesData] = await Promise.allSettled([
        api.dashboard.getMetrics(dateRange),
        api.dashboard.getPerformanceOverTime(dateRange),
        api.dashboard.getDeviceBreakdown(),
        api.dashboard.getTopCountries(),
        api.dashboard.getCampaignPerformance(),
        api.dashboard.getRecentCaptures(),
      ]);

      setData({
        metrics: dashboardData.status === 'fulfilled' ? dashboardData.value : {},
        performance: performanceData.status === 'fulfilled' ? performanceData.value : { labels: [], clicks: [], visitors: [], emailCaptures: [] },
        deviceBreakdown: deviceData.status === 'fulfilled' ? deviceData.value : { labels: [], data: [] },
        topCountries: countriesData.status === 'fulfilled' ? countriesData.value : [],
        campaignPerformance: campaignData.status === 'fulfilled' ? campaignData.value : [],
        recentCaptures: capturesData.status === 'fulfilled' ? capturesData.value : [],
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
      setData({
        metrics: { totalLinks: 0, totalClicks: 0, realVisitors: 0, capturedEmails: 0, activeLinks: 0, conversionRate: 0, bounceRate: 0, avgClicksPerLink: 0, countries: 0 },
        performance: { labels: [], clicks: [], visitors: [], emailCaptures: [] },
        deviceBreakdown: { labels: [], data: [] },
        topCountries: [], campaignPerformance: [], recentCaptures: []
      });
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange]);

  const handleExport = async () => {
    try {
      toast.loading('Exporting dashboard data...');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/analytics/export?format=csv', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `dashboard-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.dismiss(); toast.success('Exported.');
    } catch { toast.dismiss(); toast.error('Export failed.'); }
  };

  const handleExportEmails = async () => {
    try {
      toast.loading('Extracting leads...');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/analytics/export?format=csv&type=emails', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.dismiss(); toast.success('leads_capture.csv downloaded.');
    } catch { toast.dismiss(); toast.error('Failed to export leads.'); }
  };

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          </div>
          <p className="text-white/40 text-sm font-medium animate-pulse">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  const { metrics, performance, deviceBreakdown, topCountries, campaignPerformance, recentCaptures } = data;

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

  const metricCards = [
    { title: 'Total Clicks', value: metrics.totalClicks || 0, change: metrics.totalClicksChange || 0, color: 'blue', icon: MousePointerClick, sub: `${metrics.activeLinks || 0} active links` },
    { title: 'Real Visitors', value: metrics.realVisitors || 0, change: metrics.realVisitorsChange || 0, color: 'green', icon: Users, sub: `${metrics.botBlocked ?? 0} bots blocked` },
    { title: 'Captured Leads', value: metrics.capturedEmails || 0, change: metrics.capturedEmailsChange || 0, color: 'amber', icon: Mail, sub: `${metrics.countries || 0} geographies` },
    { title: 'Conversion Rate', value: `${metrics.conversionRate || 0}%`, change: metrics.conversionRateChange || 0, color: 'purple', icon: TrendingUp, sub: 'Via pixel embeds' },
  ];

  const secondaryStats = [
    { label: 'Active Links', value: metrics.activeLinks || 0 },
    { label: 'Bounce Rate', value: `${metrics.bounceRate || 0}%` },
    { label: 'Avg Clicks/Link', value: metrics.avgClicksPerLink || 0 },
    { label: 'Countries', value: metrics.countries || 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: '-0.03em' }}>
            Analytics{' '}
            <span style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Overview
            </span>
          </h2>
          <p className="text-white/35 text-sm mt-1">Real-time performance metrics and pixel insights</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range */}
          <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {['24h', '7d', '30d', '90d'].map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200"
                style={dateRange === r
                  ? { background: 'rgba(59,130,246,0.2)', color: '#60a5fa', boxShadow: '0 0 12px rgba(59,130,246,0.2)' }
                  : { color: 'rgba(255,255,255,0.35)' }
                }
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={fetchData}
            disabled={isRefreshing}
            className="btn-secondary text-xs h-9 w-9 flex items-center justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleExport} className="btn-secondary text-xs h-9 px-3 hidden sm:flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </motion.button>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleExportEmails}
            className="text-xs h-9 px-3 flex items-center gap-1.5 rounded-lg font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
          >
            <Mail className="w-3.5 h-3.5" /> Export Leads
          </motion.button>
        </div>
      </div>

      {/* Metric Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metricCards.map((card, idx) => {
          const c = METRIC_COLORS[card.color];
          const isPos = card.change >= 0;
          const numVal = typeof card.value === 'string' ? parseFloat(card.value) : card.value;
          return (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -3, boxShadow: `0 12px 40px ${c.glow}` }}
              className="relative overflow-hidden rounded-xl p-5 cursor-default group"
              style={{
                background: 'rgba(8,15,35,0.72)',
                border: `1px solid rgba(255,255,255,0.06)`,
                backdropFilter: 'blur(20px)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = c.border}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${c.accent}, transparent)` }} />

              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.12em]">{card.title}</p>
                <div className="p-1.5 rounded-lg" style={{ background: c.bg }}>
                  <card.icon className="w-4 h-4" style={{ color: c.accent }} />
                </div>
              </div>

              <div className="mb-3">
                <h3 className="text-3xl font-bold text-white tabular-nums" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: '-0.03em' }}>
                  <AnimatedNumber value={numVal} suffix={typeof card.value === 'string' && card.value.includes('%') ? '' : ''} />
                  {typeof card.value === 'string' && card.value.includes('%') ? '' : ''}
                </h3>
              </div>

              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full`}
                  style={isPos
                    ? { background: 'rgba(16,185,129,0.12)', color: '#10b981' }
                    : { background: 'rgba(239,68,68,0.12)', color: '#ef4444' }
                  }
                >
                  {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(card.change)}%
                </span>
                <span className="text-[10px] text-white/25 font-medium">{card.sub}</span>
              </div>

              {/* Ambient glow */}
              <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500 pointer-events-none"
                style={{ background: c.accent }} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Secondary stats row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {secondaryStats.map((s, i) => (
          <motion.div key={i} variants={cardVariants}
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-white/35 text-xs font-medium">{s.label}</span>
            <span className="text-white font-bold text-sm tabular-nums">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl p-6"
        style={{ background: 'rgba(8,15,35,0.72)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-white/90">Traffic Analysis</h3>
            <p className="text-xs text-white/30 mt-0.5">Visits, clicks and conversions over time</p>
          </div>
          <div className="flex items-center gap-4">
            {[['#3b82f6', 'Clicks'], ['#10b981', 'Visitors']].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="text-xs text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.25)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gClicks)" dot={false} activeDot={{ r: 4, fill: '#3b82f6', stroke: '#040c1e', strokeWidth: 2 }} animationDuration={800} />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gVisitors)" dot={false} activeDot={{ r: 4, fill: '#10b981', stroke: '#040c1e', strokeWidth: 2 }} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.4 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(8,15,35,0.72)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/90">Device Traffic</h3>
            <BarChart3 className="w-4 h-4 text-white/25" />
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceDataForChart} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} width={70} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" name="Traffic" radius={[0, 4, 4, 0]} maxBarSize={18} animationDuration={700}>
                  {deviceDataForChart.map((_, i) => (
                    <Cell key={i} fill={deviceColors[i % deviceColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Geographies */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44, duration: 0.4 }}
          className="rounded-xl p-5"
          style={{ background: 'rgba(8,15,35,0.72)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/90">Top Geographies</h3>
            <Globe className="w-4 h-4 text-white/25" />
          </div>
          <div className="space-y-3">
            {(topCountries || []).slice(0, 5).map((country, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-white/75">{country.name}</span>
                  <span className="text-white/35 tabular-nums">{country.percentage}% · {country.clicks}</span>
                </div>
                <div className="w-full rounded-full h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${country.percentage}%` }}
                    transition={{ delay: 0.5 + idx * 0.05, duration: 0.5, ease: 'easeOut' }}
                    className="h-1 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #10b981, #3b82f6)' }}
                  />
                </div>
              </div>
            ))}
            {(!topCountries || topCountries.length === 0) && (
              <div className="py-8 text-center text-xs text-white/25">No data available</div>
            )}
          </div>
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
          className="rounded-xl flex flex-col overflow-hidden"
          style={{ background: 'rgba(8,15,35,0.72)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
        >
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Recent Events
            </h3>
            <Activity className="w-4 h-4 text-white/25" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[240px]">
            {(recentCaptures || []).slice(0, 6).map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + idx * 0.04 }}
                className="flex items-start gap-3 p-3 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-mono font-medium text-white/80 truncate">{item.email}</p>
                  <p className="text-[10px] text-white/30 mt-0.5 truncate">Via {item.link}</p>
                </div>
                <span className="text-[10px] text-white/25 shrink-0 pt-0.5 whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            ))}
            {(!recentCaptures || recentCaptures.length === 0) && (
              <div className="p-8 text-center text-xs text-white/25">No recent events recorded.</div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
