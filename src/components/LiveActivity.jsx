import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Activity, MapPin, Globe, Monitor, Smartphone, Tablet, Loader, RefreshCw, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'

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

  useEffect(() => {
    fetchLiveActivity()
    const interval = setInterval(fetchLiveActivity, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchLiveActivity = async () => {
    try {
      if (loading) setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/analytics/live-activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setStats({
          active_now: data.stats?.active_now || 0,
          clicks_last_hour: data.stats?.clicks_last_hour || 0,
          unique_visitors: data.stats?.unique_visitors || 0,
          total_clicks: data.stats?.total_clicks || 0,
          total_real_visitors: data.stats?.total_real_visitors || 0,
          total_bot_blocks: data.stats?.total_bot_blocks || 0
        })
      }
    } catch (error) {
      console.error('Error fetching live activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (device) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4 text-green-400" />
      case 'tablet': return <Tablet className="h-4 w-4 text-blue-400" />
      default: return <Monitor className="h-4 w-4 text-purple-400" />
    }
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'unknown'
    
    if (statusLower === 'open' || statusLower === 'on page') {
      return <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">● On Page</Badge>
    } else if (statusLower === 'redirected') {
      return <Badge className="bg-yellow-500 text-white text-xs px-2 py-0.5">↗ Redirected</Badge>
    } else if (statusLower === 'closed') {
      return <Badge className="bg-slate-500 text-white text-xs px-2 py-0.5">✕ Closed</Badge>
    }
    return <Badge className="bg-slate-600 text-white text-xs px-2 py-0.5">{status}</Badge>
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.unique_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || activity.status?.toLowerCase() === filterStatus.toLowerCase()
    
    return matchesSearch && matchesFilter
  })

  if (loading && activities.length === 0) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Live Activity...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-green-400 animate-pulse" />
          <h1 className="text-3xl font-bold text-white">Live Activity</h1>
          <Badge className="bg-green-600 text-white animate-pulse">Live</Badge>
        </div>
        <p className="text-slate-400">Real-time tracking events and user interactions</p>
        <p className="text-xs text-slate-500 mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Total Clicks</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total_clicks?.toLocaleString() || 0}</p>
                <p className="text-xs text-yellow-400 mt-1">+{((stats.clicks_last_hour / stats.total_clicks) * 100 || 0).toFixed(1)}% vs last period</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Total Real Visitors</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total_real_visitors?.toLocaleString() || 0}</p>
                <p className="text-xs text-blue-400 mt-1">+{stats.unique_visitors} vs last period</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Total Bot Blocks</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total_bot_blocks?.toLocaleString() || 0}</p>
                <p className="text-xs text-red-400 mt-1">+{((stats.total_bot_blocks / stats.total_clicks) * 100 || 0).toFixed(1)}% of traffic</p>
              </div>
              <Activity className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:flex-none sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by unique ID, IP, email, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="on page">On Page</SelectItem>
              <SelectItem value="redirected">Redirected</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={fetchLiveActivity}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Advanced Live Tracking Events Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-400 animate-pulse" />
                Advanced Live Tracking Events
                <Badge className="ml-3 bg-green-600 text-white">{filteredActivities.length} events</Badge>
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">Comprehensive real-time tracking with detailed user information and email capture</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Timestamp
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Unique ID
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    IP Address
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Location
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    User Agent
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    ISP
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Timestamp Column */}
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1 min-w-[140px]">
                          <span className="text-sm font-medium text-white whitespace-nowrap">
                            {activity.timestamp || new Date().toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500">
                            Session: {activity.session_id || '00:02:45'}
                          </span>
                        </div>
                      </td>

                      {/* Unique ID Column */}
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <span className="text-sm font-mono text-blue-400">
                            {activity.unique_id || 'uid_abc123_001'}
                          </span>
                          <span className="text-xs text-slate-500">
                            Link: {activity.link_id || 'abc123'}
                          </span>
                        </div>
                      </td>

                      {/* IP Address Column */}
                      <td className="p-3 align-top">
                        <div className="flex items-start gap-2 min-w-[140px]">
                          {getDeviceIcon(activity.device)}
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-mono text-white">
                              {activity.ip_address || '192.168.1.100'}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">
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
                            <span className="text-sm text-white">
                              {activity.city || 'New York'}, {activity.region || 'NY'}
                            </span>
                            <span className="text-xs text-slate-400">
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
                          <span className="text-sm text-white truncate">
                            {activity.browser || 'Chrome 120.0.0.0'}
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {activity.os || 'Windows 10'}
                          </span>
                        </div>
                      </td>

                      {/* ISP Column */}
                      <td className="p-3 align-top">
                        <div className="flex items-start gap-2 min-w-[140px]">
                          <Globe className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-white truncate">
                              {activity.isp || 'Comcast Cable'}
                            </span>
                            <span className="text-xs text-slate-500">
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
                      <Activity className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">No activity matching your filters</p>
                      <p className="text-slate-500 text-sm mt-1">
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