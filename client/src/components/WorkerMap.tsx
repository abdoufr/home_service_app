import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Phone, User } from 'lucide-react';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Worker {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
}

interface WorkerMapProps {
  workers: Worker[];
  clientLocation?: { lat: number, lng: number } | null;
}

const WorkerMap = ({ workers, clientLocation }: WorkerMapProps) => {
  const center: [number, number] = clientLocation 
    ? [clientLocation.lat, clientLocation.lng] 
    : [36.7538, 3.0588];

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {clientLocation && (
          <Marker position={[clientLocation.lat, clientLocation.lng]}>
            <Popup>
              <strong>Votre position</strong>
            </Popup>
          </Marker>
        )}

        {workers.map(worker => (
          <Marker key={worker.id} position={[worker.latitude, worker.longitude]}>
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <User size={16} color="var(--primary)" />
                  <strong>{worker.name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                  <Phone size={14} />
                  <span>{worker.phone}</span>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '10px', fontSize: '0.8rem', padding: '6px' }}
                  onClick={() => window.location.href = `tel:${worker.phone}`}
                >
                  Appeler
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default WorkerMap;
