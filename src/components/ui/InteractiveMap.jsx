import React, { useState } from 'react';
import { Card } from './card';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { MapPin } from 'lucide-react';

// Use a stable CDN for world atlas topology to ensure it always renders
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const InteractiveMap = ({ data = [] }) => {
  const [tooltipContent, setTooltipContent] = useState('');

  // Function to determine the color of a country based on traffic
  const getCountryColor = (geo) => {
    if (!data || data.length === 0) return "rgba(255,255,255,0.05)";
    
    // Attempt to match names like "United States of America" or "United States"
    const country = data.find(d => 
      d.name === geo.properties.name || 
      geo.properties.name.includes(d.name) || 
      (d.name || '').includes(geo.properties.name)
    );
    
    if (country) {
      if (country.clicks > 4000) return "#10b981"; // Green for high traffic
      if (country.clicks > 1000) return "#f59e0b"; // Yellow for medium traffic
      return "#3b82f6"; // Blue for low traffic
    }
    return "rgba(255,255,255,0.05)"; // Empty state
  };

  return (
    <Card className="col-span-1 lg:col-span-2 p-0 relative">
      <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 150,
          }}
          data-tooltip-id="map-tooltip"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(evt) => {
                    const country = data.find(d => d.name === geo.properties.name);
                    if (country) {
                      setTooltipContent(`${country.name} - ${country.clicks.toLocaleString()} Clicks`);
                    } else {
                      setTooltipContent(`${geo.properties.name} - No Data`);
                    }
                  }}
                  onMouseLeave={() => {
                    setTooltipContent('');
                  }}
                  style={{
                    default: { fill: getCountryColor(geo), stroke: "rgba(255,255,255,0.1)", outline: "none" },
                    hover: { fill: "#141d2e", stroke: "#3b82f6", outline: "none" },
                    pressed: { fill: "#1e2d47", stroke: "#3b82f6", outline: "none" }
                  }}
                />
              ))
            }
          </Geographies>
          {data && data.map(({ name, coordinates, clicks }) => {
            if (!coordinates) return null;
            return (
              <Marker key={name} coordinates={coordinates}>
                <MapPin className="h-4 w-4 text-[#ef4444]" />
                <text textAnchor="middle" y={-10} style={{ fontFamily: "Inter, sans-serif", fill: "#fff", fontSize: "10px" }}>
                  {name}
                </text>
              </Marker>
            )
          })}
        </ComposableMap>
        
        {/* Tooltip implementation */}
        {tooltipContent && (
          <div className="absolute bottom-4 right-4 bg-[#141d2e] border border-[#1e2d47]/60 text-white px-3 py-2 rounded-lg text-sm shadow-xl font-mono">
            {tooltipContent}
          </div>
        )}

        <div className="absolute top-4 left-4 bg-[#141d2e]/80 backdrop-blur-md border border-border text-white p-3 rounded-lg text-[11px] font-medium">
          <h4 className="font-bold mb-2 text-xs uppercase tracking-widest text-[#3b82f6]">Traffic Density</h4>
          <div className="flex items-center mb-1"><span className="w-2.5 h-2.5 rounded bg-[#10b981] mr-2"></span> High Traffic (&gt;4k)</div>
          <div className="flex items-center mb-1"><span className="w-2.5 h-2.5 rounded bg-[#f59e0b] mr-2"></span> Medium Traffic</div>
          <div className="flex items-center mb-1"><span className="w-2.5 h-2.5 rounded bg-[#3b82f6] mr-2"></span> Low Traffic</div>
          <div className="flex items-center"><span className="w-2.5 h-2.5 rounded bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] mr-2"></span> No Signals</div>
        </div>
      </div>
    </Card>
  );
};

export default InteractiveMap;
