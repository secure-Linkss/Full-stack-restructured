import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BarChart3, TrendingUp, Users, Mail, Link, Globe, RefreshCw, Filter } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import { fetchMockData } from '../services/mockApi';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// --- Placeholder Components for Charts and Tables ---

const TopLinksChart = ({ data }) => {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Top Performing Links</CardTitle>
        <p className="text-sm text-muted-foreground">Clicks and conversions by link</p>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="linkName" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
            <Bar dataKey="clicks" fill="hsl(var(--primary))" name="Clicks" />
            <Bar dataKey="conversions" fill="hsl(var(--secondary))" name="Conversions" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const ConversionRateOverTime = ({ data }) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Conversion Rate Over Time</CardTitle>
        <p className="text-sm text-muted-foreground">Daily conversion rate trend</p>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} formatter={(value) => [`${value}%`, 'Conversion Rate']} />
            <Line type="monotone" dataKey="conversionRate" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Conversion Rate" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// --- Main Analytics Component ---

const Analytics = () => {
  const [metrics, setMetrics] = useState({});
  const [topLinksData, setTopLinksData] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const [
        metricsData,
        topLinks,
        conversionRate
      ] = await Promise.all([
        fetchMockData('getAnalyticsMetrics'),
        fetchMockData('getTopLinks', days),
        fetchMockData('getConversionRateOverTime', days),
      ]);

      setMetrics(metricsData);
      setTopLinksData(topLinks);
      setConversionData(conversionRate);
      toast.success('Analytics data refreshed successfully.');
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data.');
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

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const handleExport = () => {
    toast.info('Exporting analytics data...');
    // Mock export logic
  };

  const metricCards = [
    { title: 'Total Clicks', value: metrics.totalClicks?.toLocaleString(), icon: TrendingUp, change: 1.5 },
    { title: 'Unique Visitors', value: metrics.uniqueVisitors?.toLocaleString(), icon: Users, change: 0.8 },
    { title: 'Captured Emails', value: metrics.capturedEmails?.toLocaleString(), icon: Mail, change: 2.1 },
    { title: 'Conversion Rate', value: `${Math.round(metrics.conversionRate * 100)}%`, icon: BarChart3, change: -0.2 },
    { title: 'Active Links', value: metrics.activeLinks, icon: Link, change: 0.0 },
    { title: 'Countries Tracked', value: metrics.countriesTracked, icon: Globe, change: 0.0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Analytics"
        description="In-depth performance analysis of your links and campaigns"
      />

      <FilterBar
        searchPlaceholder="Search links or campaigns..."
        onSearch={() => {}}
        onRefresh={handleRefresh}
        onExport={handleExport}
        dateRangeOptions={['7d', '30d', '90d']}
        onDateRangeChange={handleDateRangeChange}
        selectedDateRange={dateRange}
        extraButtons={[
          <Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        ]}
      />

      {loading ? (
        <div className="text-center text-muted-foreground p-10">Loading Analytics...</div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metricCards.map((card, index) => (
              <MetricCard key={index} {...card} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TopLinksChart data={topLinksData} />
            <ConversionRateOverTime data={conversionData} />
          </div>

          {/* Additional Analytics Sections (Placeholders) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Visitor Behavior Flow</CardTitle></CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                [Placeholder for Flow Chart/Diagram]
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>A/B Test Performance</CardTitle></CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                [Placeholder for A/B Test Comparison Table/Chart]
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
