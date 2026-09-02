'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper component to auto-fit map bounds when nodes change
function MapBoundsFitter({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
}

// Calculate bearing angle between two lat/lng coordinates in degrees
const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

// Create custom HTML Leaflet DivIcons for pins
const createCustomIcon = (name, type, isSelected, isRouteNode, stepLabel = null) => {
  const isDepot = type === 'depot';

  const bgClass = isDepot
    ? 'bg-purple-600 border-purple-300 text-purple-100 shadow-purple-900/50'
    : isSelected
    ? 'bg-emerald-600 border-emerald-300 text-emerald-100 shadow-emerald-900/50'
    : 'bg-slate-800 border-slate-600 text-slate-300 shadow-slate-950/50';

  const pulseRing = isRouteNode
    ? `<span class="absolute -inset-1.5 rounded-full ${isDepot ? 'bg-purple-500/40' : 'bg-emerald-500/40'} animate-ping"></span>`
    : '';

  const stepBadgeHtml = stepLabel
    ? `<span class="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase shadow-md ${
        stepLabel.includes('START')
          ? 'bg-emerald-500 text-slate-950'
          : stepLabel.includes('END')
          ? 'bg-purple-500 text-white'
          : 'bg-cyan-500 text-slate-950'
      }">${stepLabel}</span>`
    : '';

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer">
      ${pulseRing}
      <div class="w-6 h-6 rounded-full border-2 ${bgClass} flex items-center justify-center shadow-lg transition-transform hover:scale-125 z-10">
        <div class="w-2 h-2 rounded-full bg-white"></div>
      </div>
      <div class="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700/80 text-[10px] font-bold text-white shadow-xl whitespace-nowrap z-20 pointer-events-none drop-shadow-md">
        ${stepBadgeHtml}
        <span>${name}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker-icon',
    iconSize: [110, 45],
    iconAnchor: [55, 12],
  });
};

// Create directional arrow midpoint icon
const createDirectionArrowIcon = (stepNum, angleDeg) => {
  const html = `
    <div class="flex items-center justify-center cursor-pointer pointer-events-none drop-shadow-md">
      <div class="px-1.5 py-0.5 rounded-full bg-purple-950/90 border border-purple-400/70 text-purple-200 text-[10px] font-black shadow-lg flex items-center gap-1">
        <span>Leg #${stepNum}</span>
        <span style="display:inline-block; transform: rotate(${angleDeg}deg);" class="text-emerald-400 font-extrabold text-xs">➔</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-arrow-icon',
    iconSize: [65, 24],
    iconAnchor: [32, 12],
  });
};

export default function LeafletTourMap({
  depots = [],
  farms = [],
  selectedFarms = [],
  activeSequence = [],
  onOpenMapModal
}) {
  // Normalize coordinates
  const validSriLankaCoords = (latVal, lngVal) => {
    let lat = Number(latVal);
    let lng = Number(lngVal);
    const isValidLat = Number.isFinite(lat) && lat >= 5.0 && lat <= 10.0;
    const isValidLng = Number.isFinite(lng) && lng >= 79.0 && lng <= 82.0;
    return {
      lat: isValidLat ? lat : 8.3350,
      lng: isValidLng ? lng : 80.4450
    };
  };

  // Build node list: if an active sequence exists, plot ONLY the active tour stops in sequence!
  const allNodes = useMemo(() => {
    if (activeSequence && activeSequence.length > 0) {
      return activeSequence.map((item, idx) => {
        const isStartDepot = idx === 0;
        const isEndDepot = idx === activeSequence.length - 1 && activeSequence.length > 1;
        const isDepotNode = Boolean(item.isDepot || isStartDepot || isEndDepot || String(item.name || '').toLowerCase().includes('depot'));

        let depotMatch = null;
        let farmMatch = null;

        if (isDepotNode) {
          depotMatch = depots.find(d => Number(d.id) === Number(item.id) || (item.name && d.name && String(d.name).trim().toLowerCase() === String(item.name).trim().toLowerCase()));
        } else {
          farmMatch = farms.find(f => Number(f.id) === Number(item.id ?? item.bookingId ?? item.farmId) || (item.name && f.name && String(f.name).trim().toLowerCase() === String(item.name).trim().toLowerCase()));
        }

        const rawLat = item.latitude ?? depotMatch?.latitude ?? farmMatch?.latitude ?? farmMatch?.farmLat ?? item.lat;
        const rawLng = item.longitude ?? depotMatch?.longitude ?? farmMatch?.longitude ?? farmMatch?.farmLng ?? item.lng;
        const c = validSriLankaCoords(rawLat, rawLng);

        const name = item.name || depotMatch?.name || farmMatch?.name || (isDepotNode ? 'Depot Hub' : `Booking #${item.id}`);

        return {
          ...(isDepotNode ? depotMatch : farmMatch),
          ...item,
          id: item.id ?? `seq-${idx}`,
          name,
          lat: c.lat,
          lng: c.lng,
          isDepot: isDepotNode,
          isSelected: true,
          stepIndex: idx,
        };
      });
    }

    // Fallback when no active sequence: plot available farms & depots
    const list = [];
    depots.forEach(d => {
      const c = validSriLankaCoords(d.latitude, d.longitude);
      list.push({ ...d, lat: c.lat, lng: c.lng, isDepot: true });
    });
    farms.forEach(f => {
      const c = validSriLankaCoords(f.latitude ?? f.farmLat ?? f.farm_lat, f.longitude ?? f.farmLng ?? f.farm_lng);
      const isSelected = selectedFarms.some(sf => {
        const sfId = sf?.id ?? sf?.bookingId ?? sf?.farmId ?? sf;
        return Number(sfId) === Number(f.id);
      });
      list.push({ ...f, lat: c.lat, lng: c.lng, isDepot: false, isSelected });
    });
    return list;
  }, [activeSequence, depots, farms, selectedFarms]);

  // Bounds
  const leafletBounds = useMemo(() => {
    if (!allNodes.length) return [[8.30, 80.38], [8.37, 80.47]];
    return allNodes.map(n => [n.lat, n.lng]);
  }, [allNodes]);

  // Center
  const center = useMemo(() => {
    if (!allNodes.length) return [8.3350, 80.4450];
    const lats = allNodes.map(n => n.lat);
    const lngs = allNodes.map(n => n.lng);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2
    ];
  }, [allNodes]);

  // Route Polyline positions: sequentially follow allNodes order from Start Depot to End Depot
  const routePolyline = useMemo(() => {
    if (!activeSequence || !activeSequence.length || !allNodes.length) return [];
    return allNodes.map(n => [n.lat, n.lng]);
  }, [activeSequence, allNodes]);

  // Directional Leg Arrow Markers
  const directionalLegs = useMemo(() => {
    if (routePolyline.length < 2) return [];
    const legs = [];
    for (let i = 0; i < routePolyline.length - 1; i++) {
      const [lat1, lng1] = routePolyline[i];
      const [lat2, lng2] = routePolyline[i + 1];
      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const bearing = calculateBearing(lat1, lng1, lat2, lng2);
      legs.push({
        id: `leg-${i}`,
        stepNum: i + 1,
        midLat,
        midLng,
        bearing,
      });
    }
    return legs;
  }, [routePolyline]);

  return (
    <div className="w-full h-full relative z-0 rounded-2xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full rounded-2xl z-0"
        style={{ background: '#090d16' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsFitter bounds={leafletBounds} />

        {/* Route Polyline connecting TSP tour sequence directly on map tiles */}
        {routePolyline.length > 1 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: '#a855f7',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.95
            }}
          />
        )}

        {/* Directional Leg Arrow Indicators */}
        {directionalLegs.map((leg) => (
          <Marker
            key={leg.id}
            position={[leg.midLat, leg.midLng]}
            icon={createDirectionArrowIcon(leg.stepNum, leg.bearing)}
            interactive={false}
          />
        ))}

        {/* Render Leaflet Map Markers with Step Badges */}
        {allNodes.map((node) => {
          let seqIndex = node.stepIndex !== undefined ? node.stepIndex : -1;
          if (seqIndex === -1 && activeSequence?.length) {
            seqIndex = activeSequence.findIndex(p => {
              const pId = p?.id ?? p?.bookingId ?? p?.farmId;
              const isIdMatch = pId !== undefined && pId !== null && Number(pId) === Number(node.id);
              const isNameMatch = p?.name && node?.name && String(p.name).trim().toLowerCase() === String(node.name).trim().toLowerCase();
              return isIdMatch || isNameMatch;
            });
          }

          let stepLabel = null;
          if (seqIndex === 0) {
            stepLabel = '🚩 START';
          } else if (seqIndex === activeSequence.length - 1 && activeSequence.length > 1) {
            stepLabel = '🏁 END';
          } else if (seqIndex > 0) {
            stepLabel = `Stop ${seqIndex}`;
          }

          const isRouteNode = seqIndex !== -1;

          const customIcon = createCustomIcon(
            node.name || `Booking #${node.id}`,
            node.isDepot ? 'depot' : 'farm',
            node.isSelected,
            isRouteNode,
            stepLabel
          );

          return (
            <Marker
              key={`${node.isDepot ? 'depot' : 'farm'}-${node.id}`}
              position={[node.lat, node.lng]}
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  if (onOpenMapModal) {
                    onOpenMapModal(node.lat, node.lng, node.name);
                  }
                }
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 font-sans text-xs">
                  <div className="font-bold text-slate-900">{node.name}</div>
                  {stepLabel && (
                    <div className="font-extrabold text-purple-700 text-[11px] mt-0.5">
                      Tour Step: {stepLabel}
                    </div>
                  )}
                  <div className="text-slate-600 mt-0.5">
                    Lat: {node.lat.toFixed(4)}, Lng: {node.lng.toFixed(4)}
                  </div>
                  {node.cropType && <div className="text-emerald-700 font-semibold mt-0.5">Crop: {node.cropType}</div>}
                  {node.acreageHa && <div className="text-slate-700">Acreage: {node.acreageHa} Ha</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
