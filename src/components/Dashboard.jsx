import React, { useState, useEffect } from 'react';
import PageHeader from './ui/PageHeader';
import MetricCard from './ui/MetricCard';
import ChartCard from './ui/ChartCard';
import AdvancedTable from './ui/AdvancedTable';
import FilterBar from './ui/FilterBar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, Download, Link, MousePointerClick, Users, Mail, CheckCircle, Globe, TrendingUp, DollarSign, Minus } from 'lucide-react';
import { Badge } from './ui/Badge';
import api from '../services/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch real data from API
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
      
      toast.success('Dashboard data refreshed.');
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data: ' + error.message);
      
      // Set empty data structure to prevent crashes
      setData({
        metrics: {
          totalLinks: 0,
          totalClicks: 0,
          realVisitors: 0,
          capturedEmails: 0,
          activeLinks: 0,
          conversionRate: 0,
          avgClicksPerLink: 0,
          countries: 0,
          totalLinksChange: 0,
          totalClicksChange: 0,
          realVisitorsChange: 0,
          capturedEmailsChange: 0,
          activeLinksChange: 0,
          conversionRateChange: 0,
          avgClicksPerLinkChange: 0
        },
        performance: { labels: [], clicks: [], visitors: [], emailCaptures: [] },
        deviceBreakdown: { labels: [], data: [] },
        topCountries: [],
        campaignPerformance: [],
        recentCaptures: []
      });
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
      toast.success('Dashboard data exported successfully.');
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
    { title: 'Total Links', value: metrics.totalLinks, icon: Link, change: metrics.totalLinksChange || 0, unit: '', description: 'Total links created' },
    { title: 'Total Clicks', value: metrics.totalClicks?.toLocaleString() || '0', icon: MousePointerClick, change: metrics.totalClicksChange || 0, unit: '', description: 'All clicks recorded' },
    { title: 'Real Visitors', value: metrics.realVisitors?.toLocaleString() || '0', icon: Users, change: metrics.realVisitorsChange || 0, unit: '', description: 'Unique human visitors' },
    { title: 'Captured Emails', value: metrics.capturedEmails?.toLocaleString() || '0', icon: Mail, change: metrics.capturedEmailsChange || 0, unit: '', description: 'Emails collected via links' },
    { title: 'Active Links', value: metrics.activeLinks || 0, icon: CheckCircle, change: metrics.activeLinksChange || 0, unit: '', description: 'Currently active links' },
    { title: 'Conversion Rate', value: `${metrics.conversionRate || 0}%`, icon: TrendingUp, change: metrics.conversionRateChange || 0, unit: '', description: 'Click to capture conversion' },
    { title: 'Avg Clicks/Link', value: metrics.avgClicksPerLink || 0, icon: MousePointerClick, change: metrics.avgClicksPerLinkChange || 0, unit: '', description: 'Average clicks per link' },
    { title: 'Countries', value: metrics.countries || 0, icon: Globe, change: 0, unit: '', description: 'Countries with traffic' },
  ];

  // --- Chart Data for Performance Over Time ---
  const performanceChartData = {
    labels: performance.labels || [],
    datasets: [
      {
        label: 'Clicks',
        data: performance.clicks || [],
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Visitors',
        data: performance.visitors || [],
        borderColor: 'hsl(var(--secondary))',
        backgroundColor: 'hsl(var(--secondary) / 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Email Captures',
        data: performance.emailCaptures || [],
        borderColor: 'hsl(var(--accent))',
        backgroundColor: 'hsl(var(--accent) / 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // --- Chart Data for Device Breakdown ---
  const deviceChartData = {
    labels: deviceBreakdown.labels || [],
    datasets: [
      {
        data: deviceBreakdown.data || [],
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
    { key: 'link', header: 'Link Name', sortable: true, cellClassName: 'text-muted-foreground' },
    { key: 'timestamp', header: 'Time', sortable: true, render: (item) => new Date(item.timestamp).toLocaleString() },
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
	        dateRangeOptions={['24h', '2d', '7d', '30d', '90d', '180d', '365d']}
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
              {(topCountries || []).map((country, index) => (
                <li key={index} className="flex flex-col">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>{country.name}</span>
                    <span>{country.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                    <div
                      className="h-2.5 rounded-full bg-primary"
                      style={{ width: `${country.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{country.clicks} Clicks, {country.emails} Emails</p>
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
              {(campaignPerformance || []).map((campaign, index) => (
                <li key={index} className="border-b border-border pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">ID: {campaign.id}</p>
                  <div className="flex justify-between text-sm mt-2">
                    <span>{campaign.clicks} Clicks</span>
                    <span>{campaign.conversions} Conversions</span>
                    <span>{campaign.conversionRate}% Rate</span>
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
	            data={recentCaptures || []}
	            columns={recentCapturesColumns}
	            loading={false}
	            pageSize={5}
	          />
	        </div>
	      </div>

	      {/* A/B Testing and API Generation Sections */}
	      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
	        {/* A/B Testing Overview */}
	        <Card>
	          <CardHeader>
	            <CardTitle>A/B Testing Overview</CardTitle>
	          </CardHeader>
	          <CardContent>
	            <p className="text-muted-foreground mb-4">
	              Monitor the performance of your A/B tests across different link variations.
	            </p>
	            <AdvancedTable
	              title="Active Tests"
	              data={[]} // Placeholder for A/B test data
	              columns={[
	                { key: 'testName', header: 'Test Name', sortable: true },
	                { key: 'status', header: 'Status', sortable: true },
	                { key: 'conversionRate', header: 'Conversion Rate', sortable: true },
	                { key: 'winner', header: 'Winner', sortable: true },
	              ]}
	              loading={false}
	              pageSize={5}
	            />
	            <Button variant="link" className="mt-2 p-0">View All A/B Tests</Button>
	          </CardContent>
	        </Card>

	        {/* API Generation and Integration */}
	        <Card>
	          <CardHeader>
	            <CardTitle>API Generation & Integration</CardTitle>
	          </CardHeader>
	          <CardContent>
	            <p className="text-muted-foreground mb-4">
	              Generate API keys and view documentation for seamless integration with external systems.
	            </p>
	            <div className="space-y-4">
	              <div className="flex justify-between items-center border-b pb-2">
	                <span className="font-medium">Current API Key:</span>
	                <Badge variant="secondary" className="font-mono">********************</Badge>
	              </div>
	              <div className="flex justify-between items-center">
	                <Button variant="default">Generate New Key</Button>
	                <Button variant="outline">View Documentation</Button>
	              </div>
	            </div>
	            <div className="mt-4">
	              <h4 className="font-semibold mb-2">API Usage (Last 30 Days)</h4>
	              <ul className="text-sm text-muted-foreground space-y-1">
	                <li>Total Requests: 1,245</li>
	                <li>Successful Requests: 1,230</li>
	                <li>Rate Limit Errors: 15</li>
	              </ul>
	            </div>
	          </CardContent>
	        </Card>
	      </div>
    </div>
  );
};

export default Dashboard;