import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface VehicleLocationMapProps {
  latitude?: number;
  longitude?: number;
  vehicleInfo?: string;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

export default function VehicleLocationMap({
  latitude,
  longitude,
  vehicleInfo = "Localização da Viatura",
  onLocationUpdate
}: VehicleLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const updateMarkerPosition = (lat: number, lng: number) => {
    if (mapInstance.current) {
      // Remove marker antigo se existir
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Adicionar novo marcador
      markerRef.current = L.marker([lat, lng], { icon: DefaultIcon })
        .addTo(mapInstance.current)
        .bindPopup(vehicleInfo);

      // Centralizar mapa na nova posição
      mapInstance.current.setView([lat, lng], 15);

      setCurrentPosition({ lat, lng });

      if (onLocationUpdate) {
        onLocationUpdate(lat, lng);
      }
    }
  };

  const startTracking = () => {
    if ('geolocation' in navigator) {
      setIsTracking(true);

      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateMarkerPosition(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização. Verifique as permissões do navegador.');
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Watch position changes
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          updateMarkerPosition(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Erro ao rastrear localização:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocalização não é suportada pelo seu navegador.');
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Default location: Brasília
    const defaultLat = currentPosition?.lat || -15.7801;
    const defaultLng = currentPosition?.lng || -47.9292;

    // Inicializar o mapa
    mapInstance.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

    // Adicionar tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Adicionar marcador inicial se houver posição
    if (currentPosition) {
      markerRef.current = L.marker([currentPosition.lat, currentPosition.lng], { icon: DefaultIcon })
        .addTo(mapInstance.current)
        .bindPopup(vehicleInfo);
    }

    // Cleanup
    return () => {
      stopTracking();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update marker when latitude/longitude props change
  useEffect(() => {
    if (latitude && longitude && mapInstance.current) {
      updateMarkerPosition(latitude, longitude);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={isTracking ? stopTracking : startTracking}
          variant={isTracking ? "destructive" : "default"}
          size="sm"
        >
          <MapPin className="w-4 h-4 mr-2" />
          {isTracking ? 'Parar Rastreamento' : 'Obter Localização GPS'}
        </Button>
        {currentPosition && (
          <div className="flex items-center text-sm text-muted-foreground">
            <span>
              Lat: {currentPosition.lat.toFixed(6)}, Lng: {currentPosition.lng.toFixed(6)}
            </span>
          </div>
        )}
      </div>
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-lg overflow-hidden border border-border"
      />
    </div>
  );
}
