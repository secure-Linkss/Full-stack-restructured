import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Activity, MapPin, Globe, Monitor, Smartphone, Tablet, Loader, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const LiveActivity = () => {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState({
    active_now: 0,
    clicks_last_hour: 0,
    unique_visitors: 0
  })

  useEffect(() => {
    fetchLiveActivity()
    const interval = setInterval(fetchLiveActivity, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchLiveActivity = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/analytics/live-activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setStats(data.stats || { active_now: 0, clicks_last_hour: 0, unique_visitors: 0 })
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

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Live Activity</h1>
          <p className="text-slate-400">Real-time visitor tracking and activity monitoring</p>
        </div>
        <Button onClick={fetchLiveActivity} variant="outline" className="bg-slate-800 border-slate-700 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Active Now</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.active_now}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Clicks (1h)</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.clicks_last_hour}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Unique Visitors</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.unique_visitors}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-400 animate-pulse" />
            Recent Activity
            <Badge className="ml-3 bg-green-600">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-700 border border-slate-600 hover:border-slate-500 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(activity.device)}
                      <div>
                        <p className="text-white font-medium">{activity.action || 'Page View'}</p>
                        <p className="text-sm text-slate-400 truncate">{activity.page || activity.url}</p>
                      </div>
                    </div>
                    <Badge className="text-xs">
                      {activity.timestamp}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{activity.location || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>{activity.ip_address || 'N/A'}</span>
                    </div>
                    <span>{activity.browser || 'Unknown Browser'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No recent activity</p>
                <p className="text-slate-500 text-sm mt-1">Activity will appear here in real-time</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LiveActivity