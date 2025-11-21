import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Shield, ShieldAlert, CheckCircle, XCircle, RefreshCw, Filter, Settings, AlertTriangle } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from './ui/button';

// --- Main Security Component ---

const Security = () => {
  const [metrics, setMetrics] = useState({});
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const [
        metricsData,
        logs
      ] = await Promise.all([
        api.getSecurityMetrics(),
        api.getSecurityLogs(days),
      ]);

      setMetrics(metricsData);
      setSecurityLogs(logs);
      toast.success('Security data refreshed successfully.');
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security data.');
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
    toast.info('Exporting security logs...');
    // Mock export logic
  };

  const metricCards = [
    { title: 'Total Blocks', value: metrics.totalBlocks?.toLocaleString(), icon: ShieldAlert, change: 1.5 },
    { title: 'Bot Traffic %', value: `${metrics.botTrafficPercentage}%`, icon: Shield, change: -0.5 },
    { title: 'Rate Limit Hits', value: metrics.rateLimitHits?.toLocaleString(), icon: AlertTriangle, change: 3.1 },
  ];

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      sortable: true,
      cell: (row) => <span className="text-sm">{new Date(row.timestamp).toLocaleString()}</span>,
    },
    {
      header: 'Event Type',
      accessor: 'eventType',
      sortable: true,
      cell: (row) => (
        <span className={`font-medium ${
          row.eventType === 'Bot Block' ? 'text-red-500' :
          row.eventType === 'Rate Limit' ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          {row.eventType}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'ipAddress',
      cell: (row) => <code className="text-sm">{row.ipAddress}</code>,
    },
    {
      header: 'Link/Campaign',
      accessor: 'linkName',
      cell: (row) => <span className="text-sm">{row.linkName}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          {row.status === 'Blocked' ? (
            <XCircle className="h-4 w-4 mr-1 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
          )}
          <span className="text-sm">{row.status}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Center"
        description="Monitor and manage link security, bot blocking, and rate limiting"
      />

      <FilterBar
        searchPlaceholder="Search IP, link, or event type..."
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
        <div className="text-center text-muted-foreground p-10">Loading Security Data...</div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricCards.map((card, index) => (
              <MetricCard key={index} {...card} />
            ))}
          </div>

          {/* Security Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Security Event Logs</CardTitle>
              <p className="text-sm text-muted-foreground">Detailed log of all security-related events</p>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={securityLogs}
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Configuration Card (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Global Security Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">Manage default settings for all new links</p>
            </CardHeader>
            <CardContent className="h-40 flex items-center justify-center text-muted-foreground">
              <Settings className="h-8 w-8 mr-2" />
              [Placeholder for Security Settings Form]
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Security;
