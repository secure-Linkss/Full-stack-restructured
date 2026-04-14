import React, { useState, useEffect } from 'react';
import { Users, Link, BarChart3, TrendingUp, Activity, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [userGrowth, setUserGrowth] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dashboardStats = await api.admin.getDashboard();
        setStats({
          totalUsers: dashboardStats.users?.total || dashboardStats.totalUsers || 0,
          totalLinks: dashboardStats.links?.total || dashboardStats.totalLinks || 0,
          totalClicks: dashboardStats.clicks?.total || dashboardStats.totalClicks || 0,
          totalRevenue: dashboardStats.revenue?.total || dashboardStats.totalRevenue || 0
        });

        setUserGrowth(dashboardStats.growth || dashboardStats.userGrowth || []);

        setSystemHealth(dashboardStats.systemHealth || dashboardStats.system_health || {});
      } catch (error) {
        toast.error('Failed to load admin dashboard data.');
        setStats({ totalUsers: 0, totalLinks: 0, totalClicks: 0, totalRevenue: 0 });
        setUserGrowth([]);
        setSystemHealth({});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metricCards = [
    { title: 'Global Users', value: stats.totalUsers?.toLocaleString() || '0', icon: Users, color: 'blue' },
    { title: 'Active Endpoints', value: stats.totalLinks?.toLocaleString() || '0', icon: Link, color: 'green' },
    { title: 'System Clicks', value: stats.totalClicks?.toLocaleString() || '0', icon: BarChart3, color: 'amber' },
    { title: 'Gross Revenue', value: `$${stats.totalRevenue?.toLocaleString() || '0'}`, icon: TrendingUp, color: 'red' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 shadow-2xl min-w-[120px]">
          <p className="text-xs text-muted-foreground font-medium mb-1 uppercase">{label}</p>
          <div className="text-sm">
            <span style={{ color: payload[0].color }} className="font-medium mr-2">{payload[0].name}:</span>
            <span className="tabular-nums-custom font-bold text-foreground">{payload[0].value}</span>
          </div>
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
      <div className="mb-6">
        <h3 className="text-lg font-heading text-foreground">Overview Metrics</h3>
        <p className="text-xs text-muted-foreground">High-level view of platform performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((card, index) => (
          <div key={index} className={`enterprise-card p-5 glow-hover-${card.color} relative overflow-hidden group`}>
            <div className={`absolute top-0 left-0 w-full h-0.5 bg-${card.color === 'green' ? '[#10b981]' : card.color === 'blue' ? '[#3b82f6]' : card.color === 'amber' ? '[#f59e0b]' : '[#ef4444]'}`}></div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.title}</p>
              <card.icon className={`w-4 h-4 text-${card.color === 'green' ? '[#10b981]' : card.color === 'blue' ? '[#3b82f6]' : card.color === 'amber' ? '[#f59e0b]' : '[#ef4444]'}`} />
            </div>
            <h3 className="text-3xl font-heading text-foreground tabular-nums-custom mt-2">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 enterprise-card p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">User Growth Velocity</h3>
            <p className="text-xs text-muted-foreground">New signups over the past 14 days</p>
          </div>
          <div className="h-[250px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2d47" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="newUsers" name="Signups" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="enterprise-card p-5">
           <div className="mb-4 border-b border-border pb-3 flex justify-between items-center">
             <div>
               <h3 className="text-sm font-semibold text-foreground flex items-center">
                 <Activity className="w-4 h-4 mr-2 text-[#10b981]" />
                 System Health
               </h3>
               <p className="text-xs text-muted-foreground mt-0.5">Real-time infrastructure status</p>
             </div>
           </div>
           <div className="space-y-4">
             {Object.entries(systemHealth).map(([service, status]) => (
               <div key={service} className="flex justify-between items-center group">
                 <span className="text-sm text-foreground group-hover:text-white transition-colors">{service}</span>
                 <div className="flex items-center">
                    {status === 'Operational' && <CheckCircle className="w-3.5 h-3.5 text-[#10b981] mr-1.5" />}
                    {status === 'Degraded' && <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] mr-1.5" />}
                    {status === 'Down' && <ShieldAlert className="w-3.5 h-3.5 text-[#ef4444] mr-1.5" />}
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                      status === 'Operational' ? 'text-[#10b981]' : status === 'Degraded' ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                    }`}>
                      {status}
                    </span>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Version 2.4.1</span>
              <span className="text-[#3b82f6] flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mr-1 animate-pulse"></span> Node Synced</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
