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
import api from '../services/api'

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
      
      // Fetch real data from API
      const response = await fetch('/api/events/live', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch live activity')
      }
      
      const data = await response.json()
      
      // Transform API data to component format
      const transformedActivities = (data.events || data || []).map(event => ({
        unique_id: event.uniqueId || event.unique_id || `uid_${event.id}`,
        ip_address: event.ip || event.ip_address,
        location: event.location || `${event.city || 'Unknown'}, ${event.country || 'Unknown'}`,
        email: event.emailCaptured || event.email || event.captured_email,
        timestamp: event.timestamp,
        session_id: event.sessionId || `sess_${event.id}`,
        link_id: event.linkId || event.link_id,
        device: event.device || event.device_type || 'Unknown',
        status: event.status || 'Unknown',
        browser: event.browser || 'Unknown',
        os: event.os || 'Unknown',
        isp: event.isp || event.ispDetails || 'Unknown',
        connection_type: event.connectionType || 'Unknown'
      }))
      
      // Apply filters
      const filteredActivities = transformedActivities.filter(activity => {
        const matchesSearch = !searchQuery ||
          activity.unique_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.email?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter = filterStatus === 'all' || 
          activity.status?.toLowerCase().includes(filterStatus.toLowerCase())

        return matchesSearch && matchesFilter
      })
      
      setActivities(filteredActivities)
      
      // Calculate stats from data
      setStats({
        active_now: filteredActivities.filter(a => a.status?.toLowerCase().includes('on page')).length,
        clicks_last_hour: filteredActivities.length,
        unique_visitors: new Set(filteredActivities.map(a => a.ip_address)).size,
        total_clicks: filteredActivities.length,
        total_real_visitors: filteredActivities.filter(a => !a.status?.toLowerCase().includes('bot')).length,
        total_bot_blocks: filteredActivities.filter(a => a.status?.toLowerCase().includes('bot') || a.status?.toLowerCase().includes('blocked')).length
      })
      
      toast.success('Live activity feed refreshed.')
    } catch (error) {
      console.error('Error fetching live activity:', error)
      toast.error('Failed to load live activity: ' + error.message)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveActivity()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchLiveActivity, 10000)
    return () => clearInterval(interval)
  }, [searchQuery, filterStatus])

  const getDeviceIcon = (device) => {
    const deviceLower = device?.toLowerCase() || ''
    if (deviceLower.includes('mobile') || deviceLower.includes('phone')) return <Smartphone className="h-4 w-4" />
    if (deviceLower.includes('tablet')) return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower.includes('on page')) {
      return <Badge className="bg-green-500/20 text-green-400">On Page</Badge>
    }
    if (statusLower.includes('redirected')) {
      return <Badge className="bg-blue-500/20 text-blue-400">Redirected</Badge>
    }
    if (statusLower.includes('open')) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Open</Badge>
    }
    if (statusLower.includes('bot') || statusLower.includes('blocked')) {
      return <Badge className="bg-red-500/20 text-red-400">Blocked</Badge>
    }
    return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Activity Monitor"
        description="Real-time tracking of visitor interactions and link performance"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Active Now"
          value={stats.active_now}
          icon={Activity}
          change={0}
          description="Currently browsing"
        />
        <MetricCard
          title="Clicks (1h)"
          value={stats.clicks_last_hour}
          icon={MousePointer}
          change={0}
          description="Last hour"
        />
        <MetricCard
          title="Unique Visitors"
          value={stats.unique_visitors}
          icon={Users}
          change={0}
          description="Distinct IPs"
        />
        <MetricCard
          title="Total Clicks"
          value={stats.total_clicks}
          icon={MousePointer}
          change={0}
          description="All time"
        />
        <MetricCard
          title="Real Visitors"
          value={stats.total_real_visitors}
          icon={Users}
          change={0}
          description="Human traffic"
        />
        <MetricCard
          title="Bots Blocked"
          value={stats.total_bot_blocks}
          icon={Shield}
          change={0}
          description="Security blocks"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by UID, IP, email, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="on page">On Page</SelectItem>
                <SelectItem value="redirected">Redirected</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="blocked">Blocked/Bot</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchLiveActivity} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Live Events Stream</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No live activity to display
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium">Timestamp</th>
                    <th className="text-left p-3 text-sm font-medium">Unique ID</th>
                    <th className="text-left p-3 text-sm font-medium">IP Address</th>
                    <th className="text-left p-3 text-sm font-medium">Location</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Device</th>
                    <th className="text-left p-3 text-sm font-medium">Browser</th>
                    <th className="text-left p-3 text-sm font-medium">ISP</th>
                    <th className="text-left p-3 text-sm font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {activity.timestamp}
                        </div>
                      </td>
                      <td className="p-3 text-sm font-mono">{activity.unique_id}</td>
                      <td className="p-3 text-sm font-mono">{activity.ip_address}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {activity.location}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{getStatusBadge(activity.status)}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(activity.device)}
                          {activity.device}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{activity.browser}</td>
                      <td className="p-3 text-sm">{activity.isp}</td>
                      <td className="p-3 text-sm">{activity.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default LiveActivity