import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, 13, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const MapContainerComponent = ({ incidents, responders, supplies, selectedCenter }) => {

  const getIncidentIcon = (damageLevel, urgency) => {
    let color = '#f97316';
    let glow = 'rgba(249,115,22,0.7)';
    if (damageLevel === 'severe' || urgency === 'critical') {
      color = '#ef4444';
      glow = 'rgba(239,68,68,0.7)';
    } else if (damageLevel === 'moderate' || urgency === 'high') {
      color = '#f97316';
      glow = 'rgba(249,115,22,0.7)';
    } else {
      color = '#eab308';
      glow = 'rgba(234,179,8,0.7)';
    }

    return L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
          <span style="position:absolute;width:100%;height:100%;border-radius:50%;background:${color};opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 12px ${glow};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:white;">!</div>
        </div>
        <style>@keyframes ping{0%{transform:scale(1);opacity:0.3}75%,100%{transform:scale(2);opacity:0}}</style>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const getVolunteerIcon = (name, status, role) => {
    const color = role === 'responder' ? '#f97316' : '#06b6d4';
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'V';
    const isActive = status === 'active';
    return L.divIcon({
      className: '',
      html: `
        <div style="width:32px;height:32px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 12px ${color}80;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white;${isActive ? `outline:3px solid rgba(34,197,94,0.5);outline-offset:2px;` : ''}">
          ${initials}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const getWarehouseIcon = () => {
    return L.divIcon({
      className: '',
      html: `
        <div style="width:30px;height:30px;border-radius:8px;background:#a855f7;border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 12px rgba(168,85,247,0.6);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">
          📦
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const defaultCenter = [19.0760, 72.8777];
  const activeCenter = selectedCenter && selectedCenter[0] !== 0 ? selectedCenter : defaultCenter;

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '450px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={activeCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', minHeight: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeMapView center={activeCenter} />

        {/* Incident Markers */}
        {incidents.map((incident) => {
          if (!incident.location?.coordinates || incident.status === 'resolved') return null;
          const [lng, lat] = incident.location.coordinates;
          return (
            <Marker key={incident._id} position={[lat, lng]} icon={getIncidentIcon(incident.damageLevel, incident.urgency)}>
              <Popup>
                <div style={{ minWidth: '180px', fontFamily: 'Outfit, sans-serif' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: incident.damageLevel === 'severe' ? '#ef4444' : '#f97316', marginBottom: '6px' }}>
                    🚨 {incident.urgency} — {incident.damageLevel || 'unknown'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{incident.description}</div>
                  {incident.extractedData && (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Victims: <strong>{incident.extractedData.victimCount || 0}</strong>
                    </div>
                  )}
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                <span style={{ fontSize: '11px', fontWeight: '700' }}>{incident.urgency?.toUpperCase()} Alert</span>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Volunteer/Responder Markers */}
        {responders.map((v) => {
          if (!v.coordinates || v.coordinates[0] === 0) return null;
          const [lng, lat] = v.coordinates;
          return (
            <Marker key={v.userId || v._id} position={[lat, lng]} icon={getVolunteerIcon(v.name, v.status, v.role)}>
              <Popup>
                <div style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{v.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Role: <strong style={{ color: '#f97316' }}>{v.role}</strong></div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Skills: {v.skills?.join(', ') || 'General'}</div>
                  <div style={{ fontSize: '11px', color: v.status === 'active' ? '#22c55e' : '#94a3b8', marginTop: '4px', fontWeight: '700' }}>
                    ● {v.status?.toUpperCase()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Supply Depot Markers */}
        {supplies.map((s) => {
          if (!s.warehouseLocation?.coordinates) return null;
          const [lng, lat] = s.warehouseLocation.coordinates;
          return (
            <Marker key={s._id} position={[lat, lng]} icon={getWarehouseIcon()}>
              <Popup>
                <div style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#a855f7', textTransform: 'uppercase', marginBottom: '4px' }}>📦 Supply Depot</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{s.warehouseName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {s.itemName}: <strong>{s.quantity} {s.unit}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Neon Route Optimization Polylines */}
        {incidents.map((incident) => {
          if (!incident.routeWaypoints || incident.routeWaypoints.length === 0 || incident.status === 'resolved') return null;
          const latLngs = incident.routeWaypoints.map(([lng, lat]) => [lat, lng]);
          return (
            <React.Fragment key={`route-${incident._id}`}>
              {/* Outer neon glow */}
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color: '#f97316',
                  weight: 8,
                  opacity: 0.25,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
              {/* Inner bright dashed path */}
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color: '#f97316',
                  weight: 3,
                  opacity: 0.85,
                  dashArray: '8, 8',
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapContainerComponent;
