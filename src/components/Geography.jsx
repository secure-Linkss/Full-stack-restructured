import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Globe, MapPin, TrendingUp, Users, Loader, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'
import 'leaflet/dist/leaflet.css'

// Component to update map view when data changes
const MapUpdater = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

const Geography = () => {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [mapCenter, setMapCenter] = useState([20, 0])
  const [mapZoom, setMapZoom] = useState(2)
  const [geoData, setGeoData] = useState({
    countries: [],
    cities: [],
    regions: [],
    mapPoints: []
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
          regions: data.regions || [],
          mapPoints: data.mapPoints || []
        })
      }
    } catch (error) {
      console.error('Error fetching geography data:', error)
      toast.error('Failed to load geography data')
    } finally {
      setLoading(false)
    }
  }

  const handleCountryClick = (country) => {
    if (country.coordinates) {
      setMapCenter(country.coordinates)
      setMapZoom(5)
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Geographic Analytics</h1>
        <p className="text-slate-400">Track visitor locations and regional performance with interactive map</p>
      </div>

      {/* Controls */}
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

      {/* Interactive Map */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="h-5 w-5 mr-2 text-blue-400" />
            Interactive World Map
            <Badge className="ml-3 bg-blue-600">{geoData.mapPoints.length} locations</Badge>
          </CardTitle>
          <p className="text-sm text-slate-400">Click on markers to see detailed location information</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-slate-700" style={{ height: '500px' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="/images/Map.jpg"
              />
              <MapUpdater center={mapCenter} zoom={mapZoom} />
              
              {geoData.mapPoints.map((point, index) => (
                <CircleMarker
                  key={index}
                  center={[point.lat, point.lng]}
                  radius={Math.min(point.clicks / 10 + 5, 20)}
                  fillColor="#3b82f6"
                  color="#60a5fa"
                  weight={2}
                  opacity={0.8}
                  fillOpacity={0.6}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-sm mb-1">{point.city}, {point.country}</h3>
                      <p className="text-xs text-slate-600">Clicks: {point.clicks}</p>
                      <p className="text-xs text-slate-600">Visitors: {point.visitors}</p>
                      <p className="text-xs text-slate-600">Emails: {point.emails}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Data Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-400" />
              Top Countries
            </CardTitle>
            <p className="text-sm text-slate-400">Click to zoom on map</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.countries.length > 0 ? (
                geoData.countries.map((country, index) => (
                  <div
                    key={index}
                    onClick={() => handleCountryClick(country)}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag || '🌍'}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{country.name}</p>
                        <p className="text-xs text-slate-400">
                          {country.clicks} clicks • {country.emails || 0} emails
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{country.percentage}%</p>
                      <div className="w-16 h-1.5 bg-slate-600 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No country data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-400" />
              Top Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.cities.length > 0 ? (
                geoData.cities.map((city, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">{city.name}</p>
                      <p className="text-xs text-slate-400">{city.country}</p>
                      {city.postal_code && (
                        <p className="text-xs text-slate-500">Postal: {city.postal_code}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{city.clicks}</p>
                      <p className="text-xs text-slate-400">clicks</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No city data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Regions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
              Top Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {geoData.regions.length > 0 ? (
                geoData.regions.map((region, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">{region.name}</p>
                      <p className="text-xs text-slate-400">{region.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{region.clicks}</p>
                      <p className="text-xs text-slate-400">clicks</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No region data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Geography