import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Mail, Link, Globe, RefreshCw, TrendingUp } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import api from '../services/api';
import { toast } from 'sonner';
import VisitorBehaviorFlow from './VisitorBehaviorFlow';
import ABTestPerformance from './ABTestPerformance';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#22d3ee'];

const darkTooltip = {
  background: 'rgba(8,15,38,0.97)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={darkTooltip} className="px-3 py-2.5">
      <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 mb-1">
          <span className="text-xs font-medium" style={{ color: p.color }}>{p.name}</span>
          <span className="text-xs font-bold text-white tabular-nums">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] } }),
};

const Analytics = () => {
  const [metrics, setMetrics] = useState({});
  const [topLinksData, setTopLinksData] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const fetchData = async () => {
    setLoading(true);
    try {
      let days;
      const p = String(dateRange).trim();
      if (p.endsWith('h')) days = Math.max(1, Math.floor(parseInt(p) / 24));
      else if (p.endsWith('d')) days = parseInt(p);
      else days = parseInt(p) || 30;

      const overviewData = await api.analytics.getOverview(days);
      setMetrics({
        totalClicks: overviewData.totalClicks || 0,
        uniqueVisitors: overviewData.uniqueVisitors || 0,
        capturedEmails: overviewData.capturedEmails || 0,
        conversionRate: overviewData.conversionRate || 0,
        bounceRate: overviewData.bounceRate || 0,
        activeLinks: overviewData.activeLinks || 0,
        countriesTracked: overviewData.countriesTracked || 0,
      });
      setTopLinksData(overviewData.topLinks || []);
      setConversionData(overviewData.conversionTrend || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics.');
      setMetrics({ totalClicks: 0, uniqueVisitors: 0, capturedEmails: 0, conversionRate: 0, bounceRate: 0, activeLinks: 0, countriesTracked: 0 });
      setTopLinksData([]);
      setConversionData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      toast.loading('Exporting analytics...');
      const res = await fetch(`/api/analytics/export?format=csv&days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `analytics-${dateRange}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.dismiss(); toast.success('Analytics exported.');
    } catch { toast.dismiss(); toast.error('Export failed.'); }
  };

  const metricCards = [
    { title: 'Total Clicks',      value: (metrics.totalClicks || 0).toLocaleString(),    icon: TrendingUp, accent: '#3b82f6', change: metrics.totalClicksChange || 0 },
    { title: 'Unique Visitors',   value: (metrics.uniqueVisitors || 0).toLocaleString(),  icon: Users,      accent: '#10b981', change: metrics.realVisitorsChange || 0 },
    { title: 'Captured Emails',   value: (metrics.capturedEmails || 0).toLocaleString(),  icon: Mail,       accent: '#f59e0b', change: metrics.capturedEmailsChange || 0 },
    { title: 'Conversion Rate',   value: `${Number(metrics.conversionRate || 0).toFixed(1)}%`, icon: BarChart3, accent: '#8b5cf6', change: metrics.conversionRateChange || 0 },
    { title: 'Active Links',      value: metrics.activeLinks || 0,                        icon: Link,       accent: '#22d3ee', change: 0 },
    { title: 'Countries Tracked', value: metrics.countriesTracked || 0,                   icon: Globe,      accent: '#10b981', change: 0 },
  ];

  const glassPanel = {
    background: 'rgba(8,15,35,0.72)',
    backdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    boxShadow: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.45)',
  };

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Advanced Analytics"
        description="In-depth performance analysis of your links and campaigns"
      />

      <FilterBar
        searchPlaceholder="Search links or campaigns..."
        onSearch={() => {}}
        onRefresh={fetchData}
        onExport={handleExport}
        dateRangeOptions={['24h', '7d', '30d', '90d']}
        onDateRangeChange={setDateRange}
        selectedDateRange={dateRange}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          </div>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {metricCards.map((card, i) => (
              <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <MetricCard {...card} />
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Top Links */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
              className="lg:col-span-2 p-6" style={glassPanel}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white/90">Top Performing Links</h3>
                <p className="text-xs text-white/35 mt-0.5">Clicks and conversions by link</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLinksData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="linkName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.04)' }} />
                    <Bar dataKey="clicks" name="Clicks" radius={[4, 4, 0, 0]} maxBarSize={32} fill="#3b82f6" />
                    <Bar dataKey="conversions" name="Conversions" radius={[4, 4, 0, 0]} maxBarSize={32} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Conversion Rate */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58, duration: 0.4 }}
              className="p-6" style={glassPanel}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white/90">Conversion Rate Over Time</h3>
                <p className="text-xs text-white/35 mt-0.5">Daily conversion rate trend</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                    <Tooltip content={<CustomTooltip />} formatter={v => [`${v}%`, 'Conversion Rate']} />
                    <Line type="monotone" dataKey="conversionRate" name="Conversion Rate" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#040c1e', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Advanced Analytics Sections */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.4 }}>
            <VisitorBehaviorFlow />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.4 }}>
            <ABTestPerformance />
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Analytics;
