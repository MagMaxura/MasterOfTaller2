import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { User } from '../types';
import { supabase } from '../config';

// MapLibre GL — open-source fork of Mapbox GL, no API key required.
// Uses free OpenStreetMap tiles via a public style.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

interface TechnicianLocation {
  user_id: string;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  is_online: boolean;
  updated_at: string;
}

interface LiveLocationMapProps {
  users: User[];
  isVisible: boolean;
}

const STALE_MINUTES = 10;

const LiveLocationMap: React.FC<LiveLocationMapProps> = ({ users, isVisible }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, maplibregl.Marker>>({});
  const [locations, setLocations] = useState<TechnicianLocation[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase.from('technician_locations').select('*');
      if (data) setLocations(data as TechnicianLocation[]);
    };
    fetchLocations();

    const channel = supabase
      .channel('technician_locations_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technician_locations' }, payload => {
        setLocations(prev => {
          const incoming = payload.new as TechnicianLocation;
          const idx = prev.findIndex(l => l.user_id === incoming.user_id);
          if (idx >= 0) { const u = [...prev]; u[idx] = incoming; return u; }
          return [...prev, incoming];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const now = Date.now();
    setOnlineCount(locations.filter(l => l.is_online && (now - new Date(l.updated_at).getTime()) / 60000 < STALE_MINUTES).length);
  }, [locations]);

  useEffect(() => {
    if (!isVisible || !mapContainer.current || map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [-60.7, -32.9],
      zoom: 12,
    });
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
  }, [isVisible]);

  useEffect(() => {
    if (!map.current) return;
    const now = Date.now();

    locations.forEach(loc => {
      const user = users.find(u => u.id === loc.user_id);
      if (!user) return;
      const age = (now - new Date(loc.updated_at).getTime()) / 60000;
      const isActive = loc.is_online && age < STALE_MINUTES;
      const lastSeen = age < 1 ? 'ahora mismo' : age < 60 ? `hace ${Math.floor(age)} min` : `hace ${Math.floor(age / 60)}h`;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="font-family:sans-serif;padding:4px 2px;">
          <strong style="font-size:13px;">${user.name}</strong><br/>
          <span style="font-size:11px;color:#64748b;">${user.role}</span><br/>
          <span style="font-size:11px;color:${isActive ? '#22c55e' : '#94a3b8'};">${isActive ? '● En línea' : '● Sin señal'} · ${lastSeen}</span>
          ${loc.accuracy_m ? `<br/><span style="font-size:10px;color:#94a3b8;">Precisión: ±${Math.round(loc.accuracy_m)}m</span>` : ''}
        </div>
      `);

      if (markers.current[loc.user_id]) {
        markers.current[loc.user_id].setLngLat([loc.lng, loc.lat]).setPopup(popup);
      } else {
        const el = document.createElement('div');
        el.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;';
        el.innerHTML = `
          <div style="width:44px;height:44px;border-radius:50%;border:3px solid ${isActive ? '#22c55e' : '#94a3b8'};overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.35);background:#1e293b;">
            <img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="position:absolute;bottom:-1px;right:-1px;width:13px;height:13px;border-radius:50%;background:${isActive ? '#22c55e' : '#94a3b8'};border:2px solid white;${isActive ? 'box-shadow:0 0 6px #22c55e80;' : ''}"></div>
          <div style="margin-top:3px;background:rgba(15,23,42,.85);color:white;font-size:10px;font-weight:800;padding:2px 7px;border-radius:99px;white-space:nowrap;">${user.name.split(' ')[0]}</div>
        `;
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([loc.lng, loc.lat]).setPopup(popup).addTo(map.current!);
        el.addEventListener('click', () => marker.togglePopup());
        markers.current[loc.user_id] = marker;
      }
    });

    Object.keys(markers.current).forEach(uid => {
      if (!locations.find(l => l.user_id === uid)) { markers.current[uid].remove(); delete markers.current[uid]; }
    });

    if (locations.length > 0 && map.current) {
      const bounds = new maplibregl.LngLatBounds();
      locations.forEach(l => bounds.extend([l.lng, l.lat]));
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 });
    }
  }, [locations, users]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-white rounded-2xl px-5 py-3 border border-brand-accent shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-black text-brand-highlight">{onlineCount} en línea</span>
        </div>
        <span className="text-brand-accent">|</span>
        <span className="text-xs text-brand-light font-semibold">{locations.length} técnico{locations.length !== 1 ? 's' : ''} con ubicación registrada</span>
        <span className="ml-auto text-[10px] text-brand-light italic">Tiempo real · actualización automática</span>
      </div>
      <div className="rounded-3xl overflow-hidden border border-brand-accent shadow-premium" style={{ height: '600px' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="flex items-center gap-6 text-xs font-semibold text-brand-light px-2">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> En línea (últimos {STALE_MINUTES} min)</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400" /> Sin señal / desconectado</div>
      </div>
    </div>
  );
};

export default LiveLocationMap;
