import React, { useState } from 'react';
import { Card } from './card';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { MapPin } from 'lucide-react';

// URL to a world map topology file (assuming it exists in the public folder)
const geoUrl = "/world-50m.json";

const InteractiveMap = ({ data = [] }) => {
  const [tooltipContent, setTooltipContent] = useState('');

  // Function to determine the color of a country based on traffic
  const getCountryColor = (geo) => {
    if (!data || data.length === 0) return "#374151";
    
    const country = data.find(d => d.name === geo.properties.name);
    if (country) {
      // Simple color scale based on clicks
      if (country.clicks > 4000) return "#4ade80"; // Green for high traffic
      if (country.clicks > 1000) return "#facc15"; // Yellow for medium traffic
      return "#f97316"; // Orange for low traffic
    }
    return "#374151"; // Default dark gray for no traffic
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
                    default: {
                      fill: getCountryColor(geo),
                      stroke: "#2d3748",
                      outline: "none"
                    },
                    hover: {
                      fill: "#60a5fa",
                      stroke: "#2d3748",
                      outline: "none"
                    },
                    pressed: {
                      fill: "#3b82f6",
                      stroke: "#2d3748",
                      outline: "none"
                    }
                  }}
                />
              ))
            }
          </Geographies>
          {data && data.map(({ name, coordinates, clicks }) => (
            <Marker key={name} coordinates={coordinates}>
              <MapPin className="h-4 w-4 text-red-500" />
              <text
                textAnchor="middle"
                y={-10}
                style={{ fontFamily: "system-ui", fill: "#fff", fontSize: "10px" }}
              >
                {name}
              </text>
            </Marker>
          ))}
        </ComposableMap>
        <div className="absolute top-4 left-4 bg-black/50 text-white p-3 rounded-lg text-sm">
          <h4 className="font-bold mb-1">Traffic Legend</h4>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: "#4ade80"}}></span> High Traffic</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: "#facc15"}}></span> Medium Traffic</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: "#f97316"}}></span> Low Traffic</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: "#374151"}}></span> No Traffic</div>
        </div>
      </div>
    </Card>
  );
};

export default InteractiveMap;
