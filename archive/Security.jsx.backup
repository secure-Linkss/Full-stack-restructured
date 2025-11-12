import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Unlock,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react'

const Security = () => {
  const [timeRange, setTimeRange] = useState('7')
  const [loading, setLoading] = useState(true)
  const [securityData, setSecurityData] = useState({
    totalThreats: 0,
    blockedIPs: 0,
    suspiciousActivity: 0,
    secureConnections: 0,
    recentEvents: [],
    threatsByType: [],
    ipLogs: []
  })

  useEffect(() => {
    fetchSecurityData()
  }, [timeRange])

  const fetchSecurityData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/security/logs?period=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSecurityData(data)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchSecurityData()
  }

  const handleExport = () => {
    const csvData = [
      ['Timestamp', 'Event Type', 'IP Address', 'Status'],
      ...securityData.recentEvents.map(e => [e.timestamp, e.type, e.ip, e.status])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Security Center</h1>
        <p className="text-slate-400">Monitor threats and security events</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Security Metrics - 4 cards in one row - Mobile: 2 cols, Desktop: 4 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Total Threats</p>
                <p className="text-3xl font-bold text-white">{securityData.totalThreats}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Blocked IPs</p>
                <p className="text-3xl font-bold text-white">{securityData.blockedIPs}</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-full">
                <Lock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Suspicious Activity</p>
                <p className="text-3xl font-bold text-white">{securityData.suspiciousActivity}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <Eye className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Secure Connections</p>
                <p className="text-3xl font-bold text-white">{securityData.secureConnections}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events and IP Logs - Mobile: 1 col, Desktop: 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Security Events</CardTitle>
            <CardDescription>Latest security activities and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {securityData.recentEvents.length > 0 ? (
                securityData.recentEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        event.severity === 'high' ? 'bg-red-500/20' :
                        event.severity === 'medium' ? 'bg-yellow-500/20' :
                        'bg-green-500/20'
                      }`}>
                        {event.severity === 'high' ? (
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        ) : event.severity === 'medium' ? (
                          <Activity className="h-4 w-4 text-yellow-400" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{event.type}</p>
                        <p className="text-xs text-slate-400">{event.ip} • {event.timestamp}</p>
                      </div>
                    </div>
                    <Badge variant={event.status === 'blocked' ? 'destructive' : 'default'}>
                      {event.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No security events recorded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* IP Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">IP Activity Logs</CardTitle>
            <CardDescription>Tracked IP addresses and their activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {securityData.ipLogs.length > 0 ? (
                securityData.ipLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                    <div>
                      <p className="font-mono text-sm text-white">{log.ip}</p>
                      <p className="text-xs text-slate-400">{log.country} • {log.requests} requests</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.blocked ? (
                        <Badge variant="destructive" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Unlock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No IP activity logged</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Threat Types Breakdown</CardTitle>
          <CardDescription>Distribution of detected threats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {securityData.threatsByType.map((threat, index) => (
              <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">{threat.type}</span>
                  <Badge variant="outline">{threat.count}</Badge>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                    style={{ width: `${threat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Security
