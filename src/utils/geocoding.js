/**
 * GEOCODING UTILITY
 * Provides latitude/longitude coordinates for countries and cities
 */

// Country coordinates (capital cities or geographic centers)
export const COUNTRY_COORDINATES = {
  "United States": { lat: 37.0902, lng: -95.7129, name: "United States" },
  "United Kingdom": { lat: 55.3781, lng: -3.4360, name: "United Kingdom" },
  "Canada": { lat: 56.1304, lng: -106.3468, name: "Canada" },
  "Germany": { lat: 51.1657, lng: 10.4515, name: "Germany" },
  "France": { lat: 46.2276, lng: 2.2137, name: "France" },
  "Australia": { lat: -25.2744, lng: 133.7751, name: "Australia" },
  "India": { lat: 20.5937, lng: 78.9629, name: "India" },
  "Brazil": { lat: -14.2350, lng: -51.9253, name: "Brazil" },
  "Japan": { lat: 36.2048, lng: 138.2529, name: "Japan" },
  "China": { lat: 35.8617, lng: 104.1954, name: "China" },
  "Russia": { lat: 61.5240, lng: 105.3188, name: "Russia" },
  "Mexico": { lat: 23.6345, lng: -102.5528, name: "Mexico" },
  "South Africa": { lat: -30.5595, lng: 22.9375, name: "South Africa" },
  "Italy": { lat: 41.8719, lng: 12.5674, name: "Italy" },
  "Spain": { lat: 40.4637, lng: -3.7492, name: "Spain" },
  "Netherlands": { lat: 52.1326, lng: 5.2913, name: "Netherlands" },
  "Sweden": { lat: 60.1282, lng: 18.6435, name: "Sweden" },
  "Norway": { lat: 60.4720, lng: 8.4689, name: "Norway" },
  "Denmark": { lat: 56.2639, lng: 9.5018, name: "Denmark" },
  "Poland": { lat: 51.9194, lng: 19.1451, name: "Poland" },
  "Belgium": { lat: 50.5039, lng: 4.4699, name: "Belgium" },
  "Switzerland": { lat: 46.8182, lng: 8.2275, name: "Switzerland" },
  "Austria": { lat: 47.5162, lng: 14.5501, name: "Austria" },
  "Portugal": { lat: 39.3999, lng: -8.2245, name: "Portugal" },
  "Greece": { lat: 39.0742, lng: 21.8243, name: "Greece" },
  "Turkey": { lat: 38.9637, lng: 35.2433, name: "Turkey" },
  "South Korea": { lat: 35.9078, lng: 127.7669, name: "South Korea" },
  "Singapore": { lat: 1.3521, lng: 103.8198, name: "Singapore" },
  "Malaysia": { lat: 4.2105, lng: 101.9758, name: "Malaysia" },
  "Thailand": { lat: 15.8700, lng: 100.9925, name: "Thailand" },
  "Indonesia": { lat: -0.7893, lng: 113.9213, name: "Indonesia" },
  "Philippines": { lat: 12.8797, lng: 121.7740, name: "Philippines" },
  "Vietnam": { lat: 14.0583, lng: 108.2772, name: "Vietnam" },
  "New Zealand": { lat: -40.9006, lng: 174.8860, name: "New Zealand" },
  "Argentina": { lat: -38.4161, lng: -63.6167, name: "Argentina" },
  "Chile": { lat: -35.6751, lng: -71.5430, name: "Chile" },
  "Colombia": { lat: 4.5709, lng: -74.2973, name: "Colombia" },
  "Peru": { lat: -9.1900, lng: -75.0152, name: "Peru" },
  "Egypt": { lat: 26.8206, lng: 30.8025, name: "Egypt" },
  "Nigeria": { lat: 9.0820, lng: 8.6753, name: "Nigeria" },
  "Kenya": { lat: -0.0236, lng: 37.9062, name: "Kenya" },
  "Saudi Arabia": { lat: 23.8859, lng: 45.0792, name: "Saudi Arabia" },
  "UAE": { lat: 23.4241, lng: 53.8478, name: "UAE" },
  "United Arab Emirates": { lat: 23.4241, lng: 53.8478, name: "United Arab Emirates" },
  "Israel": { lat: 31.0461, lng: 34.8516, name: "Israel" },
  "Pakistan": { lat: 30.3753, lng: 69.3451, name: "Pakistan" },
  "Bangladesh": { lat: 23.6850, lng: 90.3563, name: "Bangladesh" },
  "Unknown": { lat: 0, lng: 0, name: "Unknown" }
}

// Major city coordinates
export const CITY_COORDINATES = {
  // United States
  "New York": { lat: 40.7128, lng: -74.0060, country: "United States" },
  "Los Angeles": { lat: 34.0522, lng: -118.2437, country: "United States" },
  "Chicago": { lat: 41.8781, lng: -87.6298, country: "United States" },
  "Houston": { lat: 29.7604, lng: -95.3698, country: "United States" },
  "Miami": { lat: 25.7617, lng: -80.1918, country: "United States" },
  "San Francisco": { lat: 37.7749, lng: -122.4194, country: "United States" },
  "Seattle": { lat: 47.6062, lng: -122.3321, country: "United States" },
  "Boston": { lat: 42.3601, lng: -71.0589, country: "United States" },
  
  // United Kingdom
  "London": { lat: 51.5074, lng: -0.1278, country: "United Kingdom" },
  "Manchester": { lat: 53.4808, lng: -2.2426, country: "United Kingdom" },
  "Birmingham": { lat: 52.4862, lng: -1.8904, country: "United Kingdom" },
  
  // Canada
  "Toronto": { lat: 43.6532, lng: -79.3832, country: "Canada" },
  "Vancouver": { lat: 49.2827, lng: -123.1207, country: "Canada" },
  "Montreal": { lat: 45.5017, lng: -73.5673, country: "Canada" },
  
  // Germany
  "Berlin": { lat: 52.5200, lng: 13.4050, country: "Germany" },
  "Munich": { lat: 48.1351, lng: 11.5820, country: "Germany" },
  "Hamburg": { lat: 53.5511, lng: 9.9937, country: "Germany" },
  
  // France
  "Paris": { lat: 48.8566, lng: 2.3522, country: "France" },
  "Lyon": { lat: 45.7640, lng: 4.8357, country: "France" },
  "Marseille": { lat: 43.2965, lng: 5.3698, country: "France" },
  
  // Australia
  "Sydney": { lat: -33.8688, lng: 151.2093, country: "Australia" },
  "Melbourne": { lat: -37.8136, lng: 144.9631, country: "Australia" },
  "Brisbane": { lat: -27.4698, lng: 153.0251, country: "Australia" },
  
  // India
  "Mumbai": { lat: 19.0760, lng: 72.8777, country: "India" },
  "Delhi": { lat: 28.7041, lng: 77.1025, country: "India" },
  "Bangalore": { lat: 12.9716, lng: 77.5946, country: "India" },
  
  // Japan
  "Tokyo": { lat: 35.6762, lng: 139.6503, country: "Japan" },
  "Osaka": { lat: 34.6937, lng: 135.5023, country: "Japan" },
  "Kyoto": { lat: 35.0116, lng: 135.7681, country: "Japan" },
  
  // China
  "Beijing": { lat: 39.9042, lng: 116.4074, country: "China" },
  "Shanghai": { lat: 31.2304, lng: 121.4737, country: "China" },
  "Guangzhou": { lat: 23.1291, lng: 113.2644, country: "China" },
  
  // Add more cities as needed
  "Unknown": { lat: 0, lng: 0, country: "Unknown" }
}

/**
 * Get coordinates for a country
 * @param {string} countryName - Name of the country
 * @returns {object} - {lat, lng, name}
 */
export const getCountryCoordinates = (countryName) => {
  if (!countryName || countryName === "Unknown") {
    return COUNTRY_COORDINATES["Unknown"]
  }
  
  // Try exact match
  if (COUNTRY_COORDINATES[countryName]) {
    return COUNTRY_COORDINATES[countryName]
  }
  
  // Try case-insensitive match
  const lowerName = countryName.toLowerCase()
  for (const [key, value] of Object.entries(COUNTRY_COORDINATES)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }
  
  // Default to Unknown if not found
  console.warn(`Country coordinates not found for: ${countryName}`)
  return COUNTRY_COORDINATES["Unknown"]
}

/**
 * Get coordinates for a city
 * @param {string} cityName - Name of the city
 * @param {string} countryName - Name of the country (optional)
 * @returns {object} - {lat, lng, country}
 */
export const getCityCoordinates = (cityName, countryName = null) => {
  if (!cityName || cityName === "Unknown") {
    return CITY_COORDINATES["Unknown"]
  }
  
  // Try exact match
  if (CITY_COORDINATES[cityName]) {
    return CITY_COORDINATES[cityName]
  }
  
  // Try case-insensitive match
  const lowerName = cityName.toLowerCase()
  for (const [key, value] of Object.entries(CITY_COORDINATES)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }
  
  // If not found, try to use country coordinates with slight offset
  if (countryName && COUNTRY_COORDINATES[countryName]) {
    const countryCoords = COUNTRY_COORDINATES[countryName]
    // Add small random offset to avoid exact overlap
    return {
      lat: countryCoords.lat + (Math.random() - 0.5) * 2,
      lng: countryCoords.lng + (Math.random() - 0.5) * 2,
      country: countryName
    }
  }
  
  console.warn(`City coordinates not found for: ${cityName}`)
  return CITY_COORDINATES["Unknown"]
}

/**
 * Enrich geo data with coordinates
 * @param {object} geoData - {countries: [], cities: []}
 * @returns {object} - Enriched geoData with lat/lng
 */
export const enrichGeoData = (geoData) => {
  const enrichedCountries = geoData.countries?.map(country => {
    const coords = getCountryCoordinates(country.name || country.country)
    return {
      ...country,
      lat: coords.lat,
      lng: coords.lng
    }
  }) || []
  
  const enrichedCities = geoData.cities?.map(city => {
    const coords = getCityCoordinates(city.city || city.name, city.country)
    return {
      ...city,
      lat: coords.lat,
      lng: coords.lng
    }
  }) || []
  
  return {
    countries: enrichedCountries,
    cities: enrichedCities
  }
}

export default {
  COUNTRY_COORDINATES,
  CITY_COORDINATES,
  getCountryCoordinates,
  getCityCoordinates,
  enrichGeoData
}
