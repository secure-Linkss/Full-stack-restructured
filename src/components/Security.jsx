import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'

const Security = () => {
  const [loading, setLoading] = useState(true)
  const [securityData, setSecurityData] = useState({
    threats_blocked: 0,
    suspicious_activities: 0,
    security_score: 0,
    recent_threats: [],
    security_events: []
  })

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/security/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSecurityData(data)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Security Data...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Overview</h1>
          <p className="text-slate-400">Monitor threats and security events</p>
        </div>
        <Button onClick={fetchSecurityData} variant="outline" className="bg-slate-800 border-slate-700 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Security Score</p>
                <p className="text-3xl font-bold text-white mt-1">{securityData.security_score}/100</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Threats Blocked</p>
                <p className="text-3xl font-bold text-white mt-1">{securityData.threats_blocked}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase">Suspicious Activities</p>
                <p className="text-3xl font-bold text-white mt-1">{securityData.suspicious_activities}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityData.recent_threats.map((threat, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="text-white font-medium">{threat.type}</p>
                        <p className="text-sm text-slate-400">{threat.description}</p>
                      </div>
                    </div>
                    <Badge className={
                      threat.severity === 'high' ? 'bg-red-600' :
                      threat.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                    }>
                      {threat.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{threat.ip_address}</span>
                    <span>{threat.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityData.security_events.map((event, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{event.action}</p>
                      <p className="text-sm text-slate-400">{event.details}</p>
                      <p className="text-xs text-slate-500 mt-1">{event.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Security