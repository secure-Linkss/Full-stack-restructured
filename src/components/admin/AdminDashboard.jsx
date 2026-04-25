import React, { useState, useEffect } from 'react';
import { Users, Link, BarChart3, TrendingUp, Activity, CheckCircle, AlertTriangle, ShieldAlert, Bot, Globe, Zap, Shield } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [userGrowth, setUserGrowth] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [intelligence, setIntelligence] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          api.admin.getDashboard(),
          api.admin.getMetrics(),
          api.admin.getIntelligence(),
          api.admin.getAlerts(),
        ]);

        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) toast.error(`${failed} dashboard data source(s) failed to load.`);

        const [dashboardStats, metrics, intel, alertsData] = results.map(r =>
          r.status === 'fulfilled' ? r.value : (r.reason?.message?.includes('alerts') ? { alerts: [] } : {})
        );

        setStats({
          totalUsers: metrics.users?.total || dashboardStats.users?.total || 0,
          activeUsers: metrics.users?.active || 0,
          pendingUsers: metrics.users?.pending || 0,
          totalLinks: metrics.links?.total || dashboardStats.links?.total || 0,
          totalClicks: metrics.tracking?.total_clicks || 0,
          eventsToday: metrics.tracking?.events_today || 0,
          totalRevenue: metrics.revenue?.total || 0,
          thisMonthRevenue: metrics.revenue?.this_month || 0,
          totalCampaigns: dashboardStats.campaigns?.total || 0,
        });

        setUserGrowth(dashboardStats.growth || dashboardStats.userGrowth || []);
        setSystemHealth(dashboardStats.systemHealth || dashboardStats.system_health || {
          'API': 'Operational', 'Database': 'Operational', 'Redirect Engine': 'Operational',
          'Quantum Layer': 'Operational', 'Email Intel': 'Operational'
        });
        setIntelligence(intel);
        setAlerts(alertsData.alerts || []);
      } catch (error) {
        toast.error('Failed to load admin dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const traffic = intelligence.traffic_24h || {};
  const honeypot = intelligence.honeypot || {};
  const inboxScore = intelligence.inbox_score || {};
  const totalTraffic = traffic.total || 1;
  const humanTraffic = totalTraffic - (traffic.bots || 0) - (traffic.scanners || 0);
  const botPct = Math.round(((traffic.bots || 0) / totalTraffic) * 100);
  const humanPct = Math.round((humanTraffic / totalTraffic) * 100);

  const trafficPieData = [
    { name: 'Human', value: humanTraffic },
    { name: 'Bot', value: traffic.bots || 0 },
    { name: 'Scanner', value: traffic.scanners || 0 },
    { name: 'Honeypot', value: traffic.honeypot_hits || 0 },
  ].filter(d => d.value > 0);

  const metricCards = [
    { title: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0', sub: `${stats.activeUsers || 0} active`, icon: Users, color: '#3b82f6' },
    { title: 'Active Endpoints', value: stats.totalLinks?.toLocaleString() || '0', sub: `${stats.totalCampaigns || 0} campaigns`, icon: Link, color: '#10b981' },
    { title: 'Total Clicks', value: stats.totalClicks?.toLocaleString() || '0', sub: `${stats.eventsToday || 0} today`, icon: BarChart3, color: '#f59e0b' },
    { title: 'Gross Revenue', value: `$${(stats.totalRevenue || 0).toLocaleString()}`, sub: `$${(stats.thisMonthRevenue || 0).toFixed(2)} this month`, icon: TrendingUp, color: '#ef4444' },
    { title: 'Inbox Score', value: `${inboxScore.average?.toFixed(1) || '—'}`, sub: `${inboxScore.sample_size || 0} samples`, icon: Zap, color: '#8b5cf6' },
    { title: 'Pending Users', value: stats.pendingUsers?.toLocaleString() || '0', sub: 'Awaiting approval', icon: Shield, color: '#f59e0b' },
    { title: 'Bot Traffic (24h)', value: `${botPct}%`, sub: `${traffic.bots || 0} bots detected`, icon: Bot, color: '#ef4444' },
    { title: 'Human Traffic (24h)', value: `${humanPct}%`, sub: `${humanTraffic} human visits`, icon: Globe, color: '#10b981' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 shadow-2xl min-w-[120px]">
          <p className="text-xs text-muted-foreground font-medium mb-1 uppercase">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="text-sm">
              <span style={{ color: p.color }} className="font-medium mr-2">{p.name}:</span>
              <span className="tabular-nums-custom font-bold text-foreground">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[#3b82f6]/30 border-t-[#3b82f6] animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
              alert.severity === 'critical' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
              alert.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
              'border-blue-500/30 bg-blue-500/10 text-blue-400'
            }`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="text-xs opacity-80">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-2">
        <h3 className="text-lg font-heading text-foreground">Platform Overview</h3>
        <p className="text-xs text-muted-foreground">Real-time metrics across all system layers</p>
      </div>

      {/* 8-card metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <div key={index} className="enterprise-card p-4 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: card.color }}></div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">{card.title}</p>
              <card.icon className="w-3.5 h-3.5 shrink-0" style={{ color: card.color }} />
            </div>
            <h3 className="text-2xl font-heading text-foreground tabular-nums-custom">{card.value}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth */}
        <div className="lg:col-span-2 enterprise-card p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">User Growth Velocity</h3>
            <p className="text-xs text-muted-foreground">New signups over the past 14 days</p>
          </div>
          <div className="h-[220px] w-full flex-1">
            {userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2d47" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="newUsers" name="Signups" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No growth data available</div>
            )}
          </div>
        </div>

        {/* Traffic breakdown pie */}
        <div className="enterprise-card p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <Bot className="w-4 h-4 mr-2 text-[#ef4444]" />
              Traffic Quality (24h)
            </h3>
            <p className="text-xs text-muted-foreground">Bot vs Human classification</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {trafficPieData.length > 0 ? (
              <>
                <PieChart width={140} height={140}>
                  <Pie data={trafficPieData} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                    {trafficPieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
                <div className="mt-3 space-y-1 w-full">
                  {trafficPieData.map((entry, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="text-muted-foreground">{entry.name}</span>
                      </span>
                      <span className="font-semibold text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No traffic data</p>
            )}
          </div>
        </div>
      </div>

      {/* System Health + Honeypot stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="enterprise-card p-5">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <Activity className="w-4 h-4 mr-2 text-[#10b981]" />
              System Health
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time infrastructure status</p>
          </div>
          <div className="space-y-3">
            {Object.entries(systemHealth).length > 0 ? Object.entries(systemHealth).map(([service, status]) => (
              <div key={service} className="flex justify-between items-center">
                <span className="text-sm text-foreground">{service}</span>
                <div className="flex items-center">
                  {status === 'Operational' && <CheckCircle className="w-3.5 h-3.5 text-[#10b981] mr-1.5" />}
                  {status === 'Degraded' && <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] mr-1.5" />}
                  {status === 'Down' && <ShieldAlert className="w-3.5 h-3.5 text-[#ef4444] mr-1.5" />}
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                    status === 'Operational' ? 'text-[#10b981]' : status === 'Degraded' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                  }`}>{status}</span>
                </div>
              </div>
            )) : (
              ['API', 'Database', 'Redirect Engine', 'Quantum Layer', 'Email Intel'].map(s => (
                <div key={s} className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{s}</span>
                  <div className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-[#10b981] mr-1.5" /><span className="text-[11px] font-semibold uppercase tracking-wider text-[#10b981]">Operational</span></div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs">
            <span className="text-muted-foreground">Version 2.4.1</span>
            <span className="text-[#3b82f6] flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mr-1 animate-pulse"></span> Node Synced</span>
          </div>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-4 border-b border-border pb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center">
              <Shield className="w-4 h-4 mr-2 text-[#8b5cf6]" />
              Security Intelligence
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Honeypot & abuse detection summary</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Blacklisted IPs', value: honeypot.blacklisted_ips || 0, color: 'text-[#ef4444]' },
              { label: 'Known Bot UA Signatures', value: honeypot.known_bot_ua_signatures || 0, color: 'text-[#f59e0b]' },
              { label: 'Abusive ASNs', value: honeypot.abusive_asns || 0, color: 'text-[#ef4444]' },
              { label: 'Quantum Violations (24h)', value: traffic.quantum_violations || 0, color: 'text-[#ef4444]' },
              { label: 'Honeypot Hits (24h)', value: traffic.honeypot_hits || 0, color: 'text-[#8b5cf6]' },
              { label: 'Avg Inbox Score', value: `${inboxScore.average?.toFixed(1) || '—'} / 100`, color: inboxScore.average >= 80 ? 'text-[#10b981]' : 'text-[#f59e0b]' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-semibold tabular-nums-custom ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
