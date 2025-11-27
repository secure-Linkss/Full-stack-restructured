import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/Badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Activity, MapPin, Globe, Monitor, Smartphone, Tablet, Loader, RefreshCw, Search, Filter, MousePointer, Users, Shield, Clock, ExternalLink, Copy, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from './ui/PageHeader'
import MetricCard from './ui/MetricCard'
import FilterBar from './ui/FilterBar'
import DataTable from './ui/DataTable' // Import DataTable
import ActionIconGroup from './ui/ActionIconGroup' // Import ActionIconGroup
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
      const filters = {}
      if (searchQuery) filters.search = searchQuery
      if (filterStatus !== 'all') filters.status = filterStatus

      const response = await api.liveActivity.getEvents(filters)
      setActivities(response.activities || [])
      setStats(response.stats || {
        active_now: 0,
        clicks_last_hour: 0,
        unique_visitors: 0,
        total_clicks: 0,
        total_real_visitors: 0,
        total_bot_blocks: 0
      })
    } catch (error) {
      console.error('Error fetching live activity:', error)
      toast.error('Failed to load live activity data')
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

  const handleAction = (action, activity) => {
    if (action === 'Copy IP') {
      navigator.clipboard.writeText(activity.ip_address)
      toast.success('IP Address copied.')
    } else if (action === 'View Details') {
      // Placeholder for a detailed modal/view
      toast.info(`Viewing details for ${activity.unique_id}`)
    } else if (action === 'Delete') {
      // Placeholder for delete logic
      toast.info(`Deleting activity ${activity.unique_id}`)
    }
  }

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <div className="text-sm">
            <div>{new Date(row.timestamp).toLocaleTimeString()}</div>
            <div className="text-xs text-muted-foreground">{new Date(row.timestamp).toLocaleDateString()}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Unique ID',
      accessor: 'unique_id',
      sortable: true,
      cell: (row) => <span className="text-sm font-mono">{row.unique_id}</span>,
    },
    {
      header: 'IP Address',
      accessor: 'ip_address',
      sortable: true,
      cell: (row) => <span className="text-sm font-mono">{row.ip_address}</span>,
    },
    {
      header: 'Location',
      accessor: 'location',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.location}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Device',
      accessor: 'device',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          {getDeviceIcon(row.device)}
          <span className="text-sm">{row.device}</span>
        </div>
      ),
    },
    {
      header: 'Browser',
      accessor: 'browser',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.browser}</span>,
    },
    {
      header: 'ISP',
      accessor: 'isp',
      sortable: true,
      cell: (row) => <span className="text-sm">{row.isp}</span>,
    },
    {
      header: 'Email Captured',
      accessor: 'email',
      sortable: true,
      cell: (row) => <span className="text-sm font-medium text-green-400">{row.email || '-'}</span>,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: (row) => (
        <ActionIconGroup
          actions={[
            { icon: Copy, label: 'Copy IP', onClick: () => handleAction('Copy IP', row) },
            { icon: Eye, label: 'View Details', onClick: () => handleAction('View Details', row) },
            { icon: Trash2, label: 'Delete', onClick: () => handleAction('Delete', row) },
          ]}
        />
      ),
    },
  ];

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
            <DataTable
              columns={columns}
              data={activities}
              pageSize={10}
            // No expanded content needed for this table
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default LiveActivity
