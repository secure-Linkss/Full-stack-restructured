import React, { useState, useEffect } from 'react';
import PageHeader from './ui/PageHeader';
import MetricCard from './ui/MetricCard';
import ChartCard from './ui/ChartCard';
import AdvancedTable from './ui/AdvancedTable';
import FilterBar from './ui/FilterBar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, Download, Link, MousePointerClick, Users, Mail, CheckCircle, Globe, TrendingUp } from 'lucide-react';
import api from '../services/api'; // Use real API instead of mockApi
import { toast } from 'sonner';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data from real API
      const [metrics, performance, devices, countries, campaigns, captures] = await Promise.all([
        api.dashboard.getMetrics(dateRange),
        api.dashboard.getPerformanceOverTime(dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90),
        api.dashboard.getDeviceBreakdown(),
        api.dashboard.getTopCountries(),
        api.dashboard.getCampaignPerformance(),
        api.dashboard.getRecentCaptures(),
      ]);

      setData({
        metrics,
        performance,
        deviceBreakdown: devices,
        topCountries: countries,
        campaignPerformance: campaigns,
        recentCaptures: captures,
      });
      toast.success('Dashboard data refreshed.');
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleExport = async () => {
    try {
      toast.info('Exporting dashboard data...');
      await api.analytics.exportData('csv');
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6 min-h-screen flex items-center justify-center">
        <div className="text-foreground text-xl">Loading Dashboard...</div>
      </div>
    );
  }

  const { metrics, performance, deviceBreakdown, topCountries, campaignPerformance, recentCaptures } = data;

  // --- Metric Cards Data ---
  const metricCardsData = [
    { 
      title: 'Total Links', 
      value: metrics.total_links || metrics.totalLinks || 0, 
      icon: Link, 
      change: metrics.total_links_change || metrics.totalLinksChange || 0, 
      unit: '', 
      description: 'Total links created' 
    },
    { 
      title: 'Total Clicks', 
      value: (metrics.total_clicks || metrics.totalClicks || 0).toLocaleString(), 
      icon: MousePointerClick, 
      change: metrics.total_clicks_change || metrics.totalClicksChange || 0, 
      unit: '', 
      description: 'All clicks recorded' 
    },
    { 
      title: 'Real Visitors', 
      value: (metrics.real_visitors || metrics.realVisitors || 0).toLocaleString(), 
      icon: Users, 
      change: metrics.real_visitors_change || metrics.realVisitorsChange || 0, 
      unit: '', 
      description: 'Unique human visitors' 
    },
    { 
      title: 'Captured Emails', 
      value: (metrics.captured_emails || metrics.capturedEmails || 0).toLocaleString(), 
      icon: Mail, 
      change: metrics.captured_emails_change || metrics.capturedEmailsChange || 0, 
      unit: '', 
      description: 'Emails collected via links' 
    },
    { 
      title: 'Active Links', 
      value: metrics.active_links || metrics.activeLinks || 0, 
      icon: CheckCircle, 
      change: metrics.active_links_change || metrics.activeLinksChange || 0, 
      unit: '', 
      description: 'Currently active links' 
    },
    { 
      title: 'Conversion Rate', 
      value: `${metrics.conversion_rate || metrics.conversionRate || 0}%`, 
      icon: TrendingUp, 
      change: metrics.conversion_rate_change || metrics.conversionRateChange || 0, 
      unit: '', 
      description: 'Click to capture conversion' 
    },
    { 
      title: 'Avg Clicks/Link', 
      value: metrics.avg_clicks_per_link || metrics.avgClicksPerLink || 0, 
      icon: MousePointerClick, 
      change: metrics.avg_clicks_per_link_change || metrics.avgClicksPerLinkChange || 0, 
      unit: '', 
      description: 'Average clicks per link' 
    },
    { 
      title: 'Countries', 
      value: metrics.countries || 0, 
      icon: Globe, 
      change: 0, 
      unit: '', 
      description: 'Countries with traffic' 
    },
  ];

  // --- Chart Data for Performance Over Time ---
  const performanceChartData = {
    labels: performance.map(p => p.date || p.label),
    datasets: [
      {
        label: 'Clicks',
        data: performance.map(p => p.clicks || 0),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Visitors',
        data: performance.map(p => p.visitors || p.unique_visitors || 0),
        borderColor: 'hsl(var(--secondary))',
        backgroundColor: 'hsl(var(--secondary) / 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Email Captures',
        data: performance.map(p => p.emailCaptures || p.email_captures || 0),
        borderColor: 'hsl(var(--accent))',
        backgroundColor: 'hsl(var(--accent) / 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // --- Chart Data for Device Breakdown ---
  const deviceChartData = {
    labels: deviceBreakdown.map(d => d.name || d.device_type),
    datasets: [
      {
        data: deviceBreakdown.map(d => d.value || d.count),
        backgroundColor: [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(var(--accent))',
        ],
        borderColor: 'hsl(var(--card))',
        borderWidth: 2,
      },
    ],
  };

  // --- Advanced Table Data ---
  const recentCapturesColumns = [
    { key: 'email', header: 'Email', sortable: true, cellClassName: 'font-medium' },
    { key: 'link', header: 'Link Name', sortable: true, cellClassName: 'text-muted-foreground', 
      render: (item) => item.link || item.linkName || item.link_name },
    { key: 'timestamp', header: 'Time', sortable: true, 
      render: (item) => new Date(item.timestamp || item.created_at).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Analytics Dashboard"
        description="Comprehensive tracking and performance metrics"
      />

      <FilterBar
        searchPlaceholder="Search campaigns, emails, tags..."
        onSearch={() => {}}
        onRefresh={handleRefresh}
        onExport={handleExport}
        dateRangeOptions={['7d', '30d', '90d']}
        onDateRangeChange={setDateRange}
        selectedDateRange={dateRange}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {metricCardsData.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* Charts and Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Over Time Chart */}
        <ChartCard
          title="Performance Over Time"
          description="Clicks, visitors, and email captures"
          chartType="line"
          data={performanceChartData}
          className="lg:col-span-2"
        />

        {/* Device Breakdown Chart */}
        <ChartCard
          title="Device Breakdown"
          description="Traffic distribution by device type"
          chartType="doughnut"
          data={deviceChartData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <Card>
          <CardHeader><CardTitle>Top Countries</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topCountries.map((country, index) => (
                <li key={index} className="flex flex-col">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>{country.name || country.country}</span>
                    <span>{country.percentage || Math.round((country.clicks / metrics.total_clicks) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                    <div
                      className="h-2.5 rounded-full bg-primary"
                      style={{ width: `${country.percentage || Math.round((country.clicks / metrics.total_clicks) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {country.clicks} Clicks, {country.emails || country.email_captures || 0} Emails
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardHeader><CardTitle>Campaign Performance</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {campaignPerformance.map((campaign, index) => (
                <li key={index} className="border-b border-border pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">ID: {campaign.id}</p>
                  <div className="flex justify-between text-sm mt-2">
                    <span>{campaign.clicks} Clicks</span>
                    <span>{campaign.conversions || campaign.conversion || 0} Conversions</span>
                    <span>{campaign.conversionRate || campaign.conversion_rate || 0}% Rate</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Captures Table */}
        <div className="lg:col-span-1">
          <AdvancedTable
            title="Recent Captures"
            data={recentCaptures}
            columns={recentCapturesColumns}
            loading={false}
            pageSize={5}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;