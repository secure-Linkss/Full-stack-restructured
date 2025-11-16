import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Globe, MapPin, TrendingUp, Users, Loader, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const Geography = () => {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [geoData, setGeoData] = useState({
    countries: [],
    cities: [],
    regions: []
  })

  useEffect(() => {
    fetchGeoData()
  }, [period])

  const fetchGeoData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/analytics/geography?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setGeoData({
          countries: data.countries || [],
          cities: data.cities || [],
          regions: data.regions || []
        })
      }
    } catch (error) {
      console.error('Error fetching geography data:', error)
      toast.error('Failed to load geography data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading Geography Data...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Geographic Analytics</h1>
        <p className="text-slate-400">Track visitor locations and regional performance</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchGeoData} variant="outline" className="bg-slate-800 border-slate-700 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-400" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.countries.map((country, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="text-white font-medium">{country.name}</p>
                      <p className="text-xs text-slate-400">{country.clicks} clicks</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-600">{country.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-400" />
              Top Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.cities.map((city, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                  <div>
                    <p className="text-white font-medium">{city.name}</p>
                    <p className="text-xs text-slate-400">{city.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{city.clicks}</p>
                    <p className="text-xs text-slate-400">clicks</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
              Top Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.regions.map((region, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
                  <div>
                    <p className="text-white font-medium">{region.name}</p>
                    <p className="text-xs text-slate-400">{region.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{region.clicks}</p>
                    <p className="text-xs text-slate-400">clicks</p>
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

export default Geography