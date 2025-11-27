import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import api from '@/services/api';

// Fix for default marker icon in React Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const AdminMap = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                // In a real implementation, you would fetch this from an API
                // const response = await api.admin.getUserLocations();
                // setLocations(response.locations);

                // Simulating API data for now
                const mockLocations = [
                    { id: 1, city: "New York", country: "USA", lat: 40.7128, lng: -74.0060, users: 120 },
                    { id: 2, city: "London", country: "UK", lat: 51.5074, lng: -0.1278, users: 85 },
                    { id: 3, city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, users: 200 },
                    { id: 4, city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, users: 45 },
                    { id: 5, city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, users: 60 },
                    { id: 6, city: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050, users: 55 },
                    { id: 7, city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, users: 70 },
                    { id: 8, city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, users: 90 },
                    { id: 9, city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, users: 40 },
                    { id: 10, city: "Sao Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, users: 110 },
                ];
                setLocations(mockLocations);
            } catch (error) {
                console.error("Error fetching locations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    User Distribution Map
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-0 overflow-hidden rounded-b-lg relative">
                {loading ? (
                    <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-900">
                        Loading Map...
                    </div>
                ) : (
                    <MapContainer
                        center={[20, 0]}
                        zoom={2}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {locations.map(loc => (
                            <CircleMarker
                                key={loc.id}
                                center={[loc.lat, loc.lng]}
                                radius={Math.log(loc.users) * 3}
                                fillOpacity={0.6}
                                color="#3b82f6"
                                fillColor="#3b82f6"
                            >
                                <Popup>
                                    <div className="text-sm">
                                        <p className="font-bold">{loc.city}, {loc.country}</p>
                                        <p>{loc.users} Users</p>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                )}
            </CardContent>
        </Card>
    );
};

export default AdminMap;
