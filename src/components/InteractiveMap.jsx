import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const InteractiveMap = ({ geoData }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true,
    })

    // Add tile layer (dark theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map)

    mapInstanceRef.current = map

    // Add markers for countries with traffic
    if (geoData?.countries?.length > 0) {
      geoData.countries.forEach(country => {
        if (country.lat && country.lng) {
          // Create custom icon based on traffic volume
          const getMarkerColor = (clicks) => {
            if (clicks > 1000) return '#ef4444' // red
            if (clicks > 500) return '#f59e0b' // yellow
            return '#10b981' // green
          }

          const getMarkerSize = (clicks) => {
            if (clicks > 1000) return 15
            if (clicks > 500) return 12
            return 8
          }

          const markerColor = getMarkerColor(country.clicks)
          const markerSize = getMarkerSize(country.clicks)

          // Create circle marker
          const marker = L.circleMarker([country.lat, country.lng], {
            radius: markerSize,
            fillColor: markerColor,
            color: markerColor,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.6
          }).addTo(map)

          // Add popup with country information
          marker.bindPopup(`
            <div class="text-center p-2">
              <div class="text-lg font-bold">${country.flag} ${country.country}</div>
              <div class="mt-2 space-y-1">
                <div><strong>Clicks:</strong> ${country.clicks.toLocaleString()}</div>
                <div><strong>Visitors:</strong> ${country.visitors.toLocaleString()}</div>
                <div><strong>Traffic:</strong> ${country.percentage}%</div>
              </div>
            </div>
          `)

          // Add hover effects
          marker.on('mouseover', function() {
            this.setStyle({
              weight: 4,
              opacity: 1,
              fillOpacity: 0.8
            })
          })

          marker.on('mouseout', function() {
            this.setStyle({
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.6
            })
          })
        }
      })
    }

    // Add cities if available
    if (geoData?.cities?.length > 0) {
      geoData.cities.forEach(city => {
        if (city.lat && city.lng) {
          const marker = L.circleMarker([city.lat, city.lng], {
            radius: 5,
            fillColor: '#3b82f6',
            color: '#3b82f6',
            weight: 1,
            opacity: 0.7,
            fillOpacity: 0.5
          }).addTo(map)

          marker.bindPopup(`
            <div class="text-center p-2">
              <div class="font-bold">${city.city}</div>
              <div class="text-sm text-gray-600">${city.country}</div>
              <div class="mt-1">
                <div><strong>Clicks:</strong> ${city.clicks}</div>
                <div><strong>Visitors:</strong> ${city.visitors}</div>
              </div>
            </div>
          `)
        }
      })
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [geoData])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-slate-800/90 rounded-lg p-3 border border-slate-600 z-[1000]">
        <h4 className="text-sm font-semibold text-white mb-2">Traffic Intensity</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-slate-300">High (1000+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-slate-300">Medium (500-999)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-slate-300">Low (1-499)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-slate-300">Cities</span>
          </div>
        </div>
      </div>

      {/* No data message */}
      {(!geoData?.countries?.length && !geoData?.cities?.length) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">🌍</div>
            <p className="text-slate-400 text-lg">No geographic data available</p>
            <p className="text-slate-500">Data will appear as users visit your links</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveMap
