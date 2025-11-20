import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Activity, MapPin, Globe, Monitor, Smartphone, Tablet, Loader, RefreshCw, Search, Filter, MousePointer, Users, Shield, Clock } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from './ui/PageHeader'
import MetricCard from './ui/MetricCard'
import FilterBar from './ui/FilterBar'

// Mock function to simulate fetching data (will be replaced by actual API calls later)
const fetchLiveActivityMock = async (searchQuery, filterStatus) => {
  // In a real scenario, this would call the backend API
  // For now, we'll return a mock structure similar to the original component's expectations
  const mockActivities = [
    {
      unique_id: 'uid_abc123_001', ip_address: '192.168.1.100', location: 'New York, NY', email: 'user1@example.com',
      timestamp: new Date(Date.now() - 5000).toLocaleString(), session_id: 'sess_1', link_id: 'link_a',
      device: 'Desktop', status: 'On Page', browser: 'Chrome 120.0.0.0', os: 'Windows 10', isp: 'Comcast Cable', connection_type: 'Broadband',
    },
    {
      unique_id: 'uid_abc123_002', ip_address: '203.0.113.45', location: 'London, UK', email: null,
      timestamp: new Date(Date.now() - 15000).toLocaleString(), session_id: 'sess_2', link_id: 'link_b',
      device: 'Mobile', status: 'Redirected', browser: 'Safari 17.0', os: 'iOS', isp: 'Vodafone', connection_type: 'Mobile',
    },
    {
      unique_id: 'uid_abc123_003', ip_address: '198.51.100.1', location: 'Tokyo, JP', email: 'user3@example.com',
      timestamp: new Date(Date.now() - 30000).toLocaleString(), session_id: 'sess_3', link_id: 'link_c',
      device: 'Tablet', status: 'On Page', browser: 'Firefox 120.0', os: 'Android', isp: 'NTT', connection_type: 'Broadband',
    },
  ].filter(activity => {
    const matchesSearch = !searchQuery ||
      activity.unique_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterStatus === 'all' || activity.status?.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesFilter
  });

  const mockStats = {
    active_now: 3,
    clicks_last_hour: 150,
    unique_visitors: 80,
    total_clicks: 15000,
    total_real_visitors: 5000,
    total_bot_blocks: 2500
  };

  return { activities: mockActivities, stats: mockStats };
};


const LiveActivity = () => {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState({
    active_now: 0,
    clicks_last_hour: 0,
    unique_visitors: 0,
    total_clicks: 0,
    total_real_visitors: 0,
    total_bot_blocks: 0
  })

  const fetchLiveActivity = async () => {
    try {
      setLoading(true)
      // Replace with actual API call later
      const data = await fetchLiveActivityMock(searchQuery, filterStatus)
      
      setActivities(data.activities || [])
      setStats(data.stats)
      toast.success('Live activity feed refreshed.')
    } catch (error) {
      console.error('Error fetching live activity:', error)
      toast.error('Failed to load live activity.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveActivity()
    const interval = setInterval(fetchLiveActivity, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const getDeviceIcon = (device) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4 text-green-400" />
      case 'tablet': return <Tablet className="h-4 w-4 text-blue-400" />
      default: return <Monitor className="h-4 w-4 text-purple-400" />
    }
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'unknown'
    
    if (statusLower === 'on page') {
      return <Badge className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5">● On Page</Badge>
    } else if (statusLower === 'redirected') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5">↗ Redirected</Badge>
    } else if (statusLower === 'closed') {
      return <Badge className="bg-slate-500/20 text-slate-400 text-xs px-2 py-0.5">✕ Closed</Badge>
    }
    return <Badge className="bg-primary/20 text-primary text-xs px-2 py-0.5">{status}</Badge>
  }

  const metricCards = [
    { title: 'Active Now', value: stats.active_now?.toLocaleString() || 0, icon: Clock, change: 0.0 },
    { title: 'Total Clicks', value: stats.total_clicks?.toLocaleString() || 0, icon: MousePointer, change: 0.0 },
    { title: 'Real Visitors', value: stats.total_real_visitors?.toLocaleString() || 0, icon: Users, change: 0.0 },
    { title: 'Bots Blocked', value: stats.total_bot_blocks?.toLocaleString() || 0, icon: Shield, change: 0.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Live Activity"
        description="Real-time stream of clicks, visitors, and captures"
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* Filter Bar (Simplified for Live Activity) */}
      <FilterBar
        searchPlaceholder="Search by unique ID, IP, email, location..."
        onSearch={setSearchQuery}
        onRefresh={fetchLiveActivity}
        onExport={() => toast.info('Exporting live activity log...')}
        filterOptions={[
          { value: 'all', label: 'All Events' },
          { value: 'on page', label: 'On Page' },
          { value: 'redirected', label: 'Redirected' },
          { value: 'closed', label: 'Closed' },
        ]}
        onFilterChange={setFilterStatus}
        dateRangeOptions={[]}
        onDateRangeChange={() => {}}
        extraButtons={[
          <Button key="filter" variant="outline" size="sm" onClick={() => toast.info('Advanced filter options...')}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        ]}
      />

      {/* Advanced Live Tracking Events Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary animate-pulse" />
                Advanced Live Tracking Events
                <Badge className="ml-3 bg-primary/20 text-primary">{activities.length} events</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Comprehensive real-time tracking with detailed user information and email capture</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Timestamp
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Unique ID
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    IP Address
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Location
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    User Agent
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    ISP
                  </th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      {/* Timestamp Column */}
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1 min-w-[140px]">
                          <span className="text-sm font-medium text-foreground whitespace-nowrap">
                            {activity.timestamp || new Date().toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Session: {activity.session_id || '00:02:45'}
                          </span>
                        </div>
                      </td>

                      {/* Unique ID Column */}
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <span className="text-sm font-mono text-primary">
                            {activity.unique_id || 'uid_abc123_001'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Link: {activity.link_id || 'abc123'}
                          </span>
                        </div>
                      </td>

                      {/* IP Address Column */}
                      <td className="p-3 align-top">
                        <div className="flex items-start gap-2 min-w-[140px]">
                          {getDeviceIcon(activity.device)}
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-mono text-foreground">
                              {activity.ip_address || '192.168.1.100'}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {activity.device || 'Desktop'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="p-3 align-top">
                        <div className="flex items-start gap-2 min-w-[180px]">
                          <MapPin className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-foreground">
                              {activity.city || 'New York'}, {activity.region || 'NY'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {activity.postal_code || '10001'}, {activity.country || 'United States'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="p-3 align-top">
                        <div className="min-w-[100px]">
                          {getStatusBadge(activity.status || 'On Page')}
                        </div>
                      </td>

                      {/* User Agent Column */}
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1 min-w-[160px] max-w-[200px]">
                          <span className="text-sm text-foreground truncate">
                            {activity.browser || 'Chrome 120.0.0.0'}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {activity.os || 'Windows 10'}
                          </span>
                        </div>
                      </td>

                      {/* ISP Column */}
                      <td className="p-3 align-top">
                        <div className="flex items-start gap-2 min-w-[140px]">
                          <Globe className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-foreground truncate">
                              {activity.isp || 'Comcast Cable'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {activity.connection_type || 'Broadband'}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground text-lg">No activity matching your filters</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'Activity will appear here in real-time'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LiveActivity
