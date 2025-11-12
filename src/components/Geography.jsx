import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { scaleQuantile } from 'd3-scale'
import { Globe, MapPin, TrendingUp, Users } from 'lucide-react'

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const GeographyComponent = () => {
  const [countryData, setCountryData] = useState([])
  const [topCountries, setTopCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalVisitors, setTotalVisitors] = useState(0)

  useEffect(() => {
    fetchGeographicData()
  }, [])

  const fetchGeographicData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/geographic-distribution')
      
      if (response.ok) {
        const data = await response.json()
        
        // Process country data
        const countries = data.countries || []
        setCountryData(countries)
        
        // Get top 5 countries
        const sorted = [...countries].sort((a, b) => b.visitors - a.visitors).slice(0, 5)
        setTopCountries(sorted)
        
        // Calculate total visitors
        const total = countries.reduce((sum, country) => sum + country.visitors, 0)
        setTotalVisitors(total)
      } else {
        console.error('Failed to fetch geographic data')
        // Set empty data on error
        setCountryData([])
        setTopCountries([])
        setTotalVisitors(0)
      }
    } catch (error) {
      console.error('Error fetching geographic data:', error)
      setCountryData([])
      setTopCountries([])
      setTotalVisitors(0)
    } finally {
      setLoading(false)
    }
  }

  // Create color scale based on visitor data
  const colorScale = countryData.length > 0
    ? scaleQuantile()
        .domain(countryData.map(d => d.visitors))
        .range([
          "#1e3a8a",
          "#1e40af",
          "#1d4ed8",
          "#2563eb",
          "#3b82f6",
          "#60a5fa"
        ])
    : () => "#1e3a8a"

  const getCountryColor = (geo) => {
    const country = countryData.find(c => 
      c.country_code === geo.id || 
      c.country_code === geo.properties.ISO_A2 ||
      c.country_name.toLowerCase() === geo.properties.name.toLowerCase()
    )
    
    return country ? colorScale(country.visitors) : "#0f172a"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Globe className="h-8 w-8" />
              Geographic Distribution
            </h1>
            <p className="text-slate-400">Analyzing visitor distribution across the globe...</p>
          </div>
          
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading geographic data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Geographic Distribution
          </h1>
          <p className="text-slate-400">Track visitor locations and regional performance</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalVisitors.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Countries Reached
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{countryData.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {topCountries[0]?.country_name || 'N/A'}
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {topCountries[0]?.visitors.toLocaleString() || 0} visitors
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* World Map */}
          <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Global Visitor Distribution</CardTitle>
              <CardDescription className="text-slate-400">
                Interactive map showing visitor traffic by country
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 bg-slate-900 rounded-lg overflow-hidden">
                {countryData.length > 0 ? (
                  <ComposableMap
                    projectionConfig={{
                      scale: 147,
                      rotation: [-11, 0, 0]
                    }}
                    width={800}
                    height={400}
                    style={{
                      width: "100%",
                      height: "100%"
                    }}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={getCountryColor(geo)}
                            stroke="#334155"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none" },
                              hover: { 
                                fill: "#3b82f6", 
                                outline: "none",
                                cursor: "pointer"
                              },
                              pressed: { outline: "none" }
                            }}
                          />
                        ))
                      }
                    </Geographies>
                  </ComposableMap>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Globe className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No geographic data available yet</p>
                      <p className="text-slate-500 text-sm mt-2">
                        Start tracking links to see visitor locations
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              {countryData.length > 0 && (
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-sm text-slate-400">Visitors:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-4 bg-gradient-to-r from-slate-800 to-blue-500 rounded"></div>
                    <span className="text-xs text-slate-400">Low to High</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Countries List */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Top Countries</CardTitle>
              <CardDescription className="text-slate-400">
                Highest visitor traffic by region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCountries.length > 0 ? (
                  topCountries.map((country, index) => {
                    const percentage = totalVisitors > 0
                      ? ((country.visitors / totalVisitors) * 100).toFixed(1)
                      : 0
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-700">
                              #{index + 1}
                            </Badge>
                            <span className="text-white font-medium">
                              {country.country_name}
                            </span>
                          </div>
                          <span className="text-slate-400 text-sm">
                            {country.visitors.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>{percentage}% of total</span>
                          <span>{country.city_count || 0} cities</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No country data yet</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Data will appear as visitors click your links
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default GeographyComponent
