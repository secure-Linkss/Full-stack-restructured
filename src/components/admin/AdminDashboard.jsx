import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, Link, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import MetricCard from '../ui/MetricCard';
import { fetchMockData } from '../../services/mockApi';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const UserGrowthChart = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle>User Growth</CardTitle>
      <p className="text-sm text-muted-foreground">New users over the last 30 days</p>
    </CardHeader>
    <CardContent className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
          <Line type="monotone" dataKey="newUsers" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="New Users" />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const SystemHealth = ({ health }) => (
  <Card>
    <CardHeader>
      <CardTitle>System Health</CardTitle>
      <p className="text-sm text-muted-foreground">Real-time status of critical services</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {Object.entries(health).map(([service, status]) => (
        <div key={service} className="flex justify-between items-center p-2 border-b border-border last:border-b-0">
          <span className="font-medium capitalize">{service.replace('_', ' ')}</span>
          <span className={`text-sm font-semibold ${
            status === 'Operational' ? 'text-green-500' :
            status === 'Degraded' ? 'text-yellow-500' :
            'text-red-500'
          }`}>
            {status}
          </span>
        </div>
      ))}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [userGrowth, setUserGrowth] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, growthData, healthData] = await Promise.all([
          fetchMockData('getAdminStats'),
          fetchMockData('getAdminUserGrowth'),
          fetchMockData('getAdminSystemHealth'),
        ]);
        setStats(statsData);
        setUserGrowth(growthData);
        setSystemHealth(healthData);
        toast.success('Admin dashboard data loaded.');
      } catch (error) {
        toast.error('Failed to load admin dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metricCards = [
    { title: 'Total Users', value: stats.totalUsers?.toLocaleString(), icon: Users, change: 5.2 },
    { title: 'Total Links', value: stats.totalLinks?.toLocaleString(), icon: Link, change: 10.1 },
    { title: 'Total Clicks', value: stats.totalClicks?.toLocaleString(), icon: BarChart3, change: 15.8 },
    { title: 'Total Revenue', value: `$${stats.totalRevenue?.toLocaleString()}`, icon: TrendingUp, change: 3.4 },
  ];

  if (loading) {
    return <div className="text-center p-10">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* Charts and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserGrowthChart data={userGrowth} />
        </div>
        <div>
          <SystemHealth health={systemHealth} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
