import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Clock, Cpu, HardDrive, Zap, RefreshCw, Server, CornerDownRight } from 'lucide-react';

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentErrors, setRecentErrors] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch dashboard metrics
      const metricsRes = await fetch('/api/monitoring/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const metricsData = await metricsRes.json();
      
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }
      
      // Fetch endpoint metrics
      const endpointsRes = await fetch('/api/monitoring/endpoints', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const endpointsData = await endpointsRes.json();
      
      if (endpointsData.success) {
        const endpointArray = Object.entries(endpointsData.endpoints).map(([key, value]) => ({
          endpoint: key,
          ...value
        }));
        setEndpoints(endpointArray);
      }
      
      // Fetch recent requests
      const requestsRes = await fetch('/api/monitoring/requests?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const requestsData = await requestsRes.json();
      
      if (requestsData.success) {
        setRecentRequests(requestsData.requests);
      }
      
      // Fetch recent errors
      const errorsRes = await fetch('/api/monitoring/errors?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const errorsData = await errorsRes.json();
      
      if (errorsData.success) {
        setRecentErrors(errorsData.errors);
      }
      
      // Fetch time series data
      const timeseriesRes = await fetch('/api/monitoring/timeseries?metric=requests&hours=24', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const timeseriesData = await timeseriesRes.json();
      
      if (timeseriesData.success) {
        setTimeSeriesData(timeseriesData.data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchMonitoringData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours < 24) return `${Math.round(hours)} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load monitoring data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const topEndpoints = metrics?.top_endpoints || [];
  const slowestEndpoints = metrics?.slowest_endpoints || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time application and system metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMonitoringData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.overview?.total_requests?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.recent?.requests_per_minute?.toFixed(1)} req/min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics?.overview?.error_rate * 100)?.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.recent?.errors_last_hour} errors last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics?.recent?.avg_response_time * 1000)?.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Last hour average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(metrics?.overview?.uptime_hours)}
            </div>
            <p className="text-xs text-muted-foreground">
              Since {new Date(metrics?.overview?.start_time).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Cpu className="w-4 h-4 mr-2" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.system?.cpu?.percent?.toFixed(1)}%</div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${metrics?.system?.cpu?.percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics?.system?.cpu?.count} cores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Server className="w-4 h-4 mr-2" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.system?.memory?.percent?.toFixed(1)}%</div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${metrics?.system?.memory?.percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatBytes(metrics?.system?.memory?.used)} / {formatBytes(metrics?.system?.memory?.total)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <HardDrive className="w-4 h-4 mr-2" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.system?.disk?.percent?.toFixed(1)}%</div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${metrics?.system?.disk?.percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatBytes(metrics?.system?.disk?.used)} / {formatBytes(metrics?.system?.disk?.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Recent Requests</TabsTrigger>
          <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoint Performance</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        {/* Recent Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Last 50 requests processed by the server.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (ms)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentRequests.map((req, index) => (
                      <tr key={index} className={req.status_code >= 400 ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(req.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.method}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.endpoint}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge variant={req.status_code >= 500 ? "destructive" : req.status_code >= 400 ? "secondary" : "default"}>
                            {req.status_code}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(req.duration * 1000).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.user_id || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Errors Tab */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Last 20 errors with details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentErrors.map((err, index) => (
                  <Card key={index} className="border-red-500 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-red-700">{err.error}</div>
                        <div className="text-xs text-gray-500">{new Date(err.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Endpoint:</span> {err.method}:{err.endpoint}
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">User ID:</span> {err.user_id || 'N/A'}
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-red-600">View Traceback</summary>
                        <pre className="mt-2 p-2 bg-red-100 text-xs overflow-x-auto rounded">
                          {err.traceback}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endpoint Performance Tab */}
        <TabsContent value="endpoints">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Most Active Endpoints</CardTitle>
                <CardDescription>Endpoints with the highest request count.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topEndpoints.map((ep, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <CornerDownRight className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{ep.endpoint}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{ep.count.toLocaleString()} reqs</Badge>
                        <Badge variant={ep.error_rate > 0.05 ? "destructive" : "secondary"}>
                          {(ep.error_rate * 100).toFixed(2)}% error
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Slowest Endpoints</CardTitle>
                <CardDescription>Endpoints with the highest average response time.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {slowestEndpoints.map((ep, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <CornerDownRight className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{ep.endpoint}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{(ep.avg_time * 1000).toFixed(0)}ms avg</Badge>
                        <Badge variant="secondary">{ep.count.toLocaleString()} reqs</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          <Card>
            <CardHeader>
              <CardTitle>Request Volume (Last 24 Hours)</CardTitle>
              <CardDescription>Hourly request count.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                  <YAxis />
                  <Tooltip labelFormatter={(ts) => new Date(ts).toLocaleString()} />
                  <Legend />
                  <Bar dataKey="value" name="Requests" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
