
import React, { useMemo, useEffect, useState } from 'react';
import { User, Role } from '../types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

interface LiveLocationMapProps {
  users: User[];
  isVisible: boolean;
}

const createCustomIcon = (user: User) => {
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center">
             <img class="w-10 h-10 rounded-full border-2 border-brand-blue object-cover shadow-lg" src="${user.avatar}" alt="${user.name}" />
             <div class="absolute bottom-0 w-2 h-2 bg-green-400 rounded-full right-0 border-2 border-white"></div>
           </div>`,
    className: 'bg-transparent border-0',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const MapBoundsController: React.FC<{ technicians: User[] }> = ({ technicians }) => {
    const map = useMap();
    useEffect(() => {
        // This effect runs after the map is confirmed to be in a sized container
        map.invalidateSize();
        if (technicians.length > 0) {
            const bounds = L.latLngBounds(technicians.map(u => [u.location!.lat, u.location!.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, technicians]);

    return null;
};


const LiveLocationMap: React.FC<LiveLocationMapProps> = ({ users, isVisible }) => {
  const techniciansWithLocation = useMemo(() =>
    users.filter(u => u.role === Role.TECHNICIAN && u.location && u.location.lat && u.location.lng),
    [users]
  );

  const hasLocations = techniciansWithLocation.length > 0;
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    // This effect handles the logic of when to render the map component.
    // It waits for a short, controlled delay after the tab becomes visible.
    let timerId: number | undefined;

    if (isVisible) {
      // This delay gives the browser time to calculate the layout and dimensions
      // of the map's container after its `display` property changes, which
      // is the root cause of the "MutationObserver" error.
      timerId = window.setTimeout(() => {
        setIsMapReady(true);
      }, 150);
    } else {
      // If the component is not visible, unmount the map by resetting the state.
      setIsMapReady(false);
    }

    // Cleanup: clear the timeout if visibility changes or the component unmounts
    // before the timeout completes.
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isVisible]);

  return (
    <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-center">Ubicación del Equipo en Tiempo Real</h3>
      <div className="bg-brand-primary p-2 rounded-lg min-h-[500px] h-[60vh] overflow-hidden">
        {hasLocations ? (
          // Only render the MapContainer when our delay confirms the container is ready.
          isMapReady ? (
            <MapContainer
              center={[techniciansWithLocation[0].location!.lat, techniciansWithLocation[0].location!.lng]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {techniciansWithLocation.map(user => (
                <Marker
                  key={user.id}
                  position={[user.location!.lat, user.location!.lng]}
                  icon={createCustomIcon(user)}
                >
                  <Popup>
                      <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                          <div>
                              <p className="font-bold">{user.name}</p>
                              <p className="text-xs text-gray-500">
                                  Última act: {new Date(user.location!.lastUpdate).toLocaleTimeString()}
                              </p>
                          </div>
                      </div>
                  </Popup>
                </Marker>
              ))}
              <MapBoundsController technicians={techniciansWithLocation} />
            </MapContainer>
          ) : (
            // Display a spinner during the short delay to improve UX
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 border-4 border-t-transparent border-brand-blue rounded-full animate-spin"></div>
                <p className="mt-4 text-brand-light">Cargando mapa...</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-brand-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <p className="mt-4 text-brand-light max-w-md">
              No hay técnicos compartiendo su ubicación. La ubicación se mostrará aquí automáticamente cuando un técnico inicie sesión.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveLocationMap;
