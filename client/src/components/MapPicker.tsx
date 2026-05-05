import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: { lat: number, lng: number };
}

const MapPicker = ({ onLocationSelect, initialLocation }: MapPickerProps) => {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      },
    });
    return null;
  };

  useEffect(() => {
    if (initialLocation && !position) {
      setPosition([initialLocation.lat, initialLocation.lng]);
    }
  }, [initialLocation]);

  return (
    <div style={{ height: '300px', width: '100%', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer 
        center={position || [36.7538, 3.0588]} // Algiers center as default
        zoom={13} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        {position && <Marker position={position} />}
      </MapContainer>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
        Cliquez sur la carte pour définir votre position
      </p>
    </div>
  );
};

export default MapPicker;
