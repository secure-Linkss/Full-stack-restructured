import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { CalendarDays, Link, MousePointer, Users, BarChart as BarChartIcon, Globe, Shield, TrendingUp, Eye, Mail, RefreshCw, Download, Search } from 'lucide-react';

const Dashboard = () => {
  const [period, setPeriod] = useState('7d');
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    avgClicksPerLink: 0
  });
  const [chartData, setChartData] = useState([]);
  const [topCountries, setTopCountries] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [recentCaptures, setRecentCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async (selectedPeriod) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data) {
        const dashboardStats = {
          totalLinks: data.totalLinks || 0,
          totalClicks: data.totalClicks || 0,
          avgClicksPerLink: (data.totalClicks && data.totalLinks) ? (data.totalClicks / data.totalLinks).toFixed(1) : 0,
          realVisitors: data.realVisitors || 0,
          capturedEmails: data.capturedEmails || 0,
          activeLinks: data.activeLinks || 0,
          conversionRate: data.conversionRate || 0,
          deviceDesktop: data.deviceBreakdown?.desktop || 0,
          deviceMobile: data.deviceBreakdown?.mobile || 0,
          deviceTablet: data.deviceBreakdown?.tablet || 0,
          deviceDesktopPercent: data.deviceBreakdown?.desktop || 0,
          deviceMobilePercent: data.deviceBreakdown?.mobile || 0,
          deviceTabletPercent: data.deviceBreakdown?.tablet || 0
        };
        setStats(dashboardStats);

        setChartData(data.performanceOverTime || []);
        setTopCountries(data.topCountries || []);
        setTopCampaigns(data.campaignPerformance || []);
        setRecentCaptures(data.recentCaptures || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleRefresh = () => {
    fetchDashboardData(period);
  };

  const handleExport = () => {
    if (chartData.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = ["Date", "Clicks", "Visitors", "Emails"];
    const csv = [headers.join(",")];

    chartData.forEach(item => {
      const row = [
        `"${item.date}"`, 
        `"${item.clicks}"`, 
        `"${item.visitors}"`, 
        `"${item.emails}"`
      ];
      csv.push(row.join(","));
    });

    const csvString = csv.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "dashboard_performance_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const additionalStats = {
    realVisitors: stats.realVisitors || 0,
    capturedEmails: stats.capturedEmails || 0,
    activeLinks: stats.activeLinks || 0,
    conversionRate: stats.conversionRate || 0,
    countries: topCountries.length || 0
  };

  const deviceData = [
    { name: 'Desktop', value: 0, percentage: 0, color: '#8b5cf6' },
    { name: 'Mobile', value: 0, percentage: 0, color: '#06b6d4' },
    { name: 'Tablet', value: 0, percentage: 0, color: '#10b981' }
  ];

  const performanceData = chartData.length > 0 ? chartData.map((item) => ({
    date: item.date,
    clicks: item.clicks || 0,
    visitors: item.visitors || 0,
    emails: item.emails || 0
  })) : [];

  const countriesData = topCountries.length > 0 ? topCountries : [];
  const campaignsData = topCampaigns.length > 0 ? topCampaigns : [];
  const capturesData = recentCaptures.length > 0 ? recentCaptures.slice(0, 5) : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
	        <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics Dashboard</h1>
	        <p className="text-slate-400">Comprehensive tracking and performance metrics</p>

      </div>

      {/* Controls - Mobile Optimized */}
      <div className="space-y-4 mb-8">
        {/* Top Row - Filter and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="campaigns">Campaigns</SelectItem>
              <SelectItem value="links">Links</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search campaigns, emails, tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Bottom Row - Time Period and Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <Button
            variant={period === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('24h')}
            className={period === '24h' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            24h
          </Button>
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('7d')}
            className={period === '7d' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            7d
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('30d')}
            className={period === '30d' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            30d
          </Button>
          <Button
            variant={period === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('90d')}
            className={period === '90d' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
          >
            90d
          </Button>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 px-3"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Compact Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <Card className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400 mb-1">Total Links</p>
                <Link className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalLinks || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400 mb-1">Total Clicks</p>
                <MousePointer className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalClicks || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400 mb-1">Real Visitors</p>
                <Eye className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-white">{additionalStats.realVisitors}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400 mb-1">Captured Emails</p>
                <Mail className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-white">{additionalStats.capturedEmails}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400 mb-1">Active Links</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-white">{additionalStats.activeLinks}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400 mb-1">Conversion Rate</p>
                <BarChartIcon className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-white">{additionalStats.conversionRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400 mb-1">Avg Clicks/Link</p>
                <BarChartIcon className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.avgClicksPerLink || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400 mb-1">Countries</p>
                <Globe className="h-4 w-4 text-cyan-500" />
              </div>
              <p className="text-3xl font-bold text-white">{additionalStats.countries}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Over Time Chart */}
        <Card className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white">Performance Over Time</CardTitle>
            <p className="text-xs text-slate-400">Clicks, visitors, and email captures</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                />
                <YAxis 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                  name="Clicks"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                  name="Visitors"
                />
                <Area
                  type="monotone"
                  dataKey="emails"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEmails)"
                  name="Email Captures"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-xs text-slate-400">Clicks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-xs text-slate-400">Visitors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-slate-400">Email Captures</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown Chart */}
        <Card className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white">Device Breakdown</CardTitle>
            <p className="text-xs text-slate-400">Traffic distribution by device type</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value.toLocaleString(), name]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-3">
              {deviceData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs text-slate-400">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Three Large Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Countries Card */}
        <Card className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white">Top Countries</CardTitle>
            <p className="text-xs text-slate-400">Geographic distribution</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {countriesData.map((country, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{country.country}</p>
                      <p className="text-xs text-slate-400">
                        {country.clicks} clicks • {country.emails} emails
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{country.percentage}%</p>
                    <div className="w-16 h-1.5 bg-slate-600 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${country.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Performance Card */}
        <Card className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white">Campaign Performance</CardTitle>
            <p className="text-xs text-slate-400">Top performing campaigns</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {campaignsData.map((campaign, index) => (
                <div key={index} className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{campaign.name}</p>
                      <p className="text-xs text-slate-400">ID: {campaign.id}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      campaign.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{campaign.clicks} clicks</span>
                    <span>{campaign.emails} emails</span>
                    <span className="font-medium">{campaign.conversion} conversion</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Captures Card */}
        <Card className="hover:shadow-md transition-shadow bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white">Recent Captures</CardTitle>
            <p className="text-xs text-slate-400">Latest email captures</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {capturesData.length > 0 ? (
              <div className="space-y-3">
                {capturesData.map((capture, index) => (
                  <div key={index} className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-white">{capture.email}</p>
                        <p className="text-xs text-slate-400">{capture.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="h-12 w-12 text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">No email captures yet</p>
                <p className="text-xs text-slate-500 mt-1">Captured emails will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;