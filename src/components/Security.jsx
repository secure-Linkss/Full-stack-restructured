import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Shield, ShieldAlert, CheckCircle, XCircle, RefreshCw, Filter, Settings, AlertTriangle, Ban, Plus, Unlock, Lock, Eye, Copy, Trash2 } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import FilterBar from './ui/FilterBar';
import MetricCard from './ui/MetricCard';
import DataTable from './ui/DataTable';
import ActionIconGroup from './ui/ActionIconGroup';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

// --- Main Security Component ---

const Security = () => {
  const [metrics, setMetrics] = useState({});
  const [securityLogs, setSecurityLogs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [blockedCountries, setBlockedCountries] = useState([]);
  const [newBlockedIP, setNewBlockedIP] = useState('');
  const [newBlockedCountry, setNewBlockedCountry] = useState('');
  const [securitySettings, setSecuritySettings] = useState({
    botProtection: true,
    ipBlocking: true,
    rateLimiting: true,
    geoBlocking: false,
    vpnDetection: true,
    suspiciousActivityDetection: true
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
	      const [
	        metricsData,
	        logs,
	        blockedIPsData,
	        blockedCountriesData,
	        settingsData
	      ] = await Promise.all([
	        api.getSecurityMetrics(),
	        api.getSecurityLogs(days),
	        api.security.getBlockedIPs(),
	        api.security.getBlockedCountries(),
	        api.security.getSettings()
	      ]);
	
	      setMetrics(metricsData);
	      setSecurityLogs(logs);
	      setBlockedIPs(blockedIPsData);
	      setBlockedCountries(blockedCountriesData);
	      setSecuritySettings(settingsData);
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

	  const getSeverityBadge = (severity) => {
	    const severityConfig = {
	      high: { color: 'bg-red-600', text: 'High' },
	      medium: { color: 'bg-yellow-600', text: 'Medium' },
	      low: { color: 'bg-green-600', text: 'Low' }
	    }
	    
	    const config = severityConfig[severity] || severityConfig.low
	    return (
	      <Badge className={`${config.color} text-white`}>
	        {config.text}
	      </Badge>
	    )
	  }

	  const getActionBadge = (action) => {
	    const actionConfig = {
	      blocked: { color: 'bg-red-600', text: 'Blocked' },
	      throttled: { color: 'bg-yellow-600', text: 'Throttled' },
	      flagged: { color: 'bg-orange-600', text: 'Flagged' },
	      allowed: { color: 'bg-green-600', text: 'Allowed' }
	    }
	    
	    const config = actionConfig[action] || actionConfig.allowed
	    return (
	      <Badge className={`${config.color} text-white`}>
	        {config.text}
	      </Badge>
	    )
	  }

	  const updateSecuritySetting = async (key, value) => {
	    setSecuritySettings(prev => ({ ...prev, [key]: value }))
	    try {
	      await api.security.updateSetting({ [key]: value })
	      toast.success('Security setting updated.')
	    } catch (error) {
	      toast.error('Failed to update setting.')
	    }
	  }

	  const addBlockedIP = async () => {
	    if (!newBlockedIP) return
	    try {
	      const newBlock = await api.security.addBlockedIP(newBlockedIP)
	      setBlockedIPs(prev => [newBlock, ...prev])
	      setNewBlockedIP('')
	      toast.success('IP blocked successfully.')
	    } catch (error) {
	      toast.error('Failed to block IP.')
	    }
	  }

	  const removeBlockedIP = async (ip) => {
	    try {
	      await api.security.removeBlockedIP(ip)
	      setBlockedIPs(prev => prev.filter(item => item.ip !== ip))
	      toast.success('IP unblocked successfully.')
	    } catch (error) {
	      toast.error('Failed to unblock IP.')
	    }
	  }

	  const addBlockedCountry = async () => {
	    if (!newBlockedCountry) return
	    try {
	      const newBlock = await api.security.addBlockedCountry(newBlockedCountry)
	      setBlockedCountries(prev => [newBlock, ...prev])
	      setNewBlockedCountry('')
	      toast.success('Country blocked successfully.')
	    } catch (error) {
	      toast.error('Failed to block country.')
	    }
	  }

	  const removeBlockedCountry = async (country) => {
	    try {
	      await api.security.removeBlockedCountry(country)
	      setBlockedCountries(prev => prev.filter(item => item.country !== country))
	      toast.success('Country unblocked successfully.')
	    } catch (error) {
	      toast.error('Failed to unblock country.')
	    }
	  }

	  const securityLogColumns = [
	    {
	      header: 'Timestamp',
	      accessor: 'timestamp',
	      sortable: true,
	      cell: (row) => <span className="text-sm">{new Date(row.timestamp).toLocaleString()}</span>,
	    },
	    {
	      header: 'Event Type',
	      accessor: 'type',
	      sortable: true,
	      cell: (row) => <span className="text-sm">{row.type.replace('_', ' ')}</span>,
	    },
	    {
	      header: 'IP Address',
	      accessor: 'ip',
	      cell: (row) => <code className="text-sm">{row.ip}</code>,
	    },
	    {
	      header: 'Action',
	      accessor: 'action',
	      cell: (row) => getActionBadge(row.action),
	    },
	    {
	      header: 'Severity',
	      accessor: 'severity',
	      cell: (row) => getSeverityBadge(row.severity),
	    },
	    {
	      header: 'User Agent',
	      accessor: 'userAgent',
	      cell: (row) => <span className="text-sm truncate max-w-xs block" title={row.userAgent}>{row.userAgent}</span>,
	    },
	    {
	      header: 'Details',
	      id: 'details',
	      cell: (row) => (
	        <ActionIconGroup
	          actions={[
	            { icon: Eye, label: 'View Details', onClick: () => toast.info(`Viewing details for ${row.id}`) },
	          ]}
	        />
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
	        dateRangeOptions={['24h', '2d', '7d', '30d', '90d', '180d', '365d']}
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

	          {/* Security Settings */}
	          <Card>
	            <CardHeader>
	              <CardTitle>Global Security Configuration</CardTitle>
	              <CardDescription>Manage default settings for all new links</CardDescription>
	            </CardHeader>
	            <CardContent className="space-y-6">
	              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
	                <div className="flex items-center justify-between">
	                  <div>
	                    <Label className="text-foreground font-medium">Bot Protection</Label>
	                    <p className="text-muted-foreground text-sm">Detect and block automated traffic</p>
	                  </div>
	                  <Switch
	                    checked={securitySettings.botProtection}
	                    onCheckedChange={(checked) => updateSecuritySetting('botProtection', checked)}
	                  />
	                </div>
	
	                <div className="flex items-center justify-between">
	                  <div>
	                    <Label className="text-foreground font-medium">IP Blocking</Label>
	                    <p className="text-muted-foreground text-sm">Block suspicious IP addresses</p>
	                  </div>
	                  <Switch
	                    checked={securitySettings.ipBlocking}
	                    onCheckedChange={(checked) => updateSecuritySetting('ipBlocking', checked)}
	                  />
	                </div>
	
	                <div className="flex items-center justify-between">
	                  <div>
	                    <Label className="text-foreground font-medium">Rate Limiting</Label>
	                    <p className="text-muted-foreground text-sm">Limit requests per IP address</p>
	                  </div>
	                  <Switch
	                    checked={securitySettings.rateLimiting}
	                    onCheckedChange={(checked) => updateSecuritySetting('rateLimiting', checked)}
	                  />
	                </div>
	
	                <div className="flex items-center justify-between">
	                  <div>
	                    <Label className="text-foreground font-medium">Geo Blocking</Label>
	                    <p className="text-muted-foreground text-sm">Block traffic from specific countries</p>
	                  </div>
	                  <Switch
	                    checked={securitySettings.geoBlocking}
	                    onCheckedChange={(checked) => updateSecuritySetting('geoBlocking', checked)}
	                  />
	                </div>
	
	                <div className="flex items-center justify-between">
	                  <div>
	                    <Label className="text-foreground font-medium">VPN Detection</Label>
	                    <p className="text-muted-foreground text-sm">Detect VPN and proxy traffic</p>
	                  </div>
	                  <Switch
	                    checked={securitySettings.vpnDetection}
	                    onCheckedChange={(checked) => updateSecuritySetting('vpnDetection', checked)}
	                  />
	                </div>
	
	                <div className="flex items-center justify-between">
	                  <div>
	                    <Label className="text-foreground font-medium">Suspicious Activity Detection</Label>
	                    <p className="text-muted-foreground text-sm">Monitor for unusual patterns</p>
	                  </div>
	                  <Switch
	                    checked={securitySettings.suspiciousActivityDetection}
	                    onCheckedChange={(checked) => updateSecuritySetting('suspiciousActivityDetection', checked)}
	                  />
	                </div>
	              </div>
	            </CardContent>
	          </Card>

	          {/* Blocked IPs */}
	          <Card>
	            <CardHeader>
	              <CardTitle>Blocked IP Addresses</CardTitle>
	              <CardDescription>Manage manually and automatically blocked IP addresses</CardDescription>
	            </CardHeader>
	            <CardContent>
	              <div className="flex gap-2 mb-4">
	                <Input
	                  placeholder="Enter IP address to block"
	                  value={newBlockedIP}
	                  onChange={(e) => setNewBlockedIP(e.target.value)}
	                  className="flex-1"
	                />
	                <Button onClick={addBlockedIP} className="bg-primary hover:bg-primary/90">
	                  <Plus className="h-4 w-4 mr-1" />
	                  Block IP
	                </Button>
	              </div>
	              <DataTable
	                columns={[
	                  { header: 'IP Address', accessor: 'ip', cell: (row) => <code className="text-sm">{row.ip}</code> },
	                  { header: 'Reason', accessor: 'reason' },
	                  { header: 'Blocked At', accessor: 'blockedAt', cell: (row) => <span className="text-sm">{new Date(row.blockedAt).toLocaleString()}</span> },
	                  { header: 'Attempts', accessor: 'attempts' },
	                  { header: 'Actions', id: 'actions', cell: (row) => (
	                    <Button size="sm" variant="outline" onClick={() => removeBlockedIP(row.ip)} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
	                      <Unlock className="h-4 w-4" />
	                    </Button>
	                  )},
	                ]}
	                data={blockedIPs}
	                pageSize={5}
	              />
	            </CardContent>
	          </Card>

	          {/* Blocked Countries */}
	          <Card>
	            <CardHeader>
	              <CardTitle>Blocked Countries</CardTitle>
	              <CardDescription>Manage geo-blocked countries</CardDescription>
	            </CardHeader>
	            <CardContent>
	              <div className="flex gap-2 mb-4">
	                <Input
	                  placeholder="Enter country name or code to block"
	                  value={newBlockedCountry}
	                  onChange={(e) => setNewBlockedCountry(e.target.value)}
	                  className="flex-1"
	                />
	                <Button onClick={addBlockedCountry} className="bg-primary hover:bg-primary/90">
	                  <Plus className="h-4 w-4 mr-1" />
	                  Block Country
	                </Button>
	              </div>
	              <DataTable
	                columns={[
	                  { header: 'Country', accessor: 'country' },
	                  { header: 'Code', accessor: 'code', cell: (row) => <code className="text-sm">{row.code}</code> },
	                  { header: 'Reason', accessor: 'reason' },
	                  { header: 'Blocked At', accessor: 'blockedAt', cell: (row) => <span className="text-sm">{new Date(row.blockedAt).toLocaleString()}</span> },
	                  { header: 'Actions', id: 'actions', cell: (row) => (
	                    <Button size="sm" variant="outline" onClick={() => removeBlockedCountry(row.country)} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
	                      <Unlock className="h-4 w-4" />
	                    </Button>
	                  )},
	                ]}
	                data={blockedCountries}
	                pageSize={5}
	              />
	            </CardContent>
	          </Card>

	          {/* Security Logs Table */}
	          <Card>
	            <CardHeader>
	              <CardTitle>Security Event Logs</CardTitle>
	              <CardDescription>Detailed log of all security-related events</CardDescription>
	            </CardHeader>
	            <CardContent>
	              <DataTable
	                columns={securityLogColumns}
	                data={securityLogs}
	                pageSize={10}
	              />
	            </CardContent>
	          </Card>
        </>
      )}
    </div>
  );
};

export default Security;
