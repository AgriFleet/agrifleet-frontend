'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const surfaceStyles = {
  'PAVED_HIGHWAY': { color: '#3b82f6', opacity: 1, weight: 5 }, // Blue
  'DIRT_TRACK': { color: '#8b5cf6', opacity: 1, weight: 5 }, // Purple
  'GRAVEL': { color: '#f59e0b', opacity: 1, weight: 5 }, // Orange
  'DEFAULT': { color: '#10b981', opacity: 1, weight: 5 } // Green
};

const defaultEdgeStyle = { color: '#334155', opacity: 0.5, weight: 2, dashArray: '4' };

const getIconHtml = (n) => {
  if (n.isDepot) return `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 shadow-lg text-white border-2 border-white shadow-blue-500/50">🏢</div>`;
  if (n.isFarmGate) return `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 shadow-lg text-white border-2 border-white shadow-emerald-500/50">🚜</div>`;
  return `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-500 shadow-lg text-white border-2 border-white shadow-slate-500/50">📍</div>`;
};

export default function NetworkTopologyMap({ nodes, edges, routeResult }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({ allEdges: [], routeEdges: [], markers: [] });

  // Initialize and destroy map instance
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Create map instance
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false // Custom attribution
      }).setView([8.3, 80.4], 10);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(mapInstanceRef.current);
    }
    
    return () => {
      // Clean up on component unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync data with map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !nodes || nodes.length === 0) return;
    
    // Clear old layers
    layersRef.current.allEdges.forEach(layer => map.removeLayer(layer));
    layersRef.current.routeEdges.forEach(layer => map.removeLayer(layer));
    layersRef.current.markers.forEach(layer => map.removeLayer(layer));
    layersRef.current = { allEdges: [], routeEdges: [], markers: [] };
    
    // 1. Draw all edges
    if (edges) {
      edges.forEach(e => {
        const uNode = nodes.find(n => n.nodeId === (e.uNode || e.unode));
        const vNode = nodes.find(n => n.nodeId === (e.vNode || e.vnode));
        if (uNode && vNode) {
          const polyline = L.polyline([[uNode.lat, uNode.lng], [vNode.lat, vNode.lng]], defaultEdgeStyle).addTo(map);
          layersRef.current.allEdges.push(polyline);
          
          const weight = e.computedWeight || e.baseDistanceKm || e.weight;
          if (weight) {
            const midLat = (uNode.lat + vNode.lat) / 2;
            const midLng = (uNode.lng + vNode.lng) / 2;
            const marker = L.marker([midLat, midLng], {
              icon: L.divIcon({ 
                html: `<div class="bg-slate-900/80 text-slate-400 text-[9px] font-mono px-1 rounded border border-slate-700 backdrop-blur whitespace-nowrap shadow-sm flex items-center justify-center">${Number(weight).toFixed(2)}</div>`, 
                className: '', 
                iconSize: [28, 14], 
                iconAnchor: [14, 7] 
              })
            }).addTo(map);
            layersRef.current.allEdges.push(marker);
          }
        }
      });
    }

    // 2. Draw highlighted route edges
    let hasRoute = false;
    if (routeResult && routeResult.pathNodeSequence) {
      hasRoute = true;
      const seq = routeResult.pathNodeSequence;
      for (let i = 0; i < seq.length - 1; i++) {
        const u = seq[i];
        const v = seq[i + 1];
        const uNode = nodes.find(n => n.nodeId === u);
        const vNode = nodes.find(n => n.nodeId === v);
        const edge = edges?.find(e => 
          ((e.uNode || e.unode) === u && (e.vNode || e.vnode) === v) || 
          ((e.uNode || e.unode) === v && (e.vNode || e.vnode) === u)
        );

        if (uNode && vNode) {
          const surfaceType = edge ? edge.surfaceType : 'DEFAULT';
          const style = surfaceStyles[surfaceType] || surfaceStyles['DEFAULT'];
          const polyline = L.polyline([[uNode.lat, uNode.lng], [vNode.lat, vNode.lng]], style).addTo(map);
          layersRef.current.routeEdges.push(polyline);
        }
      }
    }

    // 3. Draw nodes
    const bounds = L.latLngBounds();
    nodes.forEach(n => {
      const marker = L.marker([n.lat, n.lng], {
        icon: L.divIcon({ html: getIconHtml(n), className: '', iconSize: [32, 32], iconAnchor: [16, 16] })
      }).addTo(map);
      
      const type = n.isDepot ? 'Depot' : n.isFarmGate ? 'Farm Gate' : 'Waypoint';
      marker.bindTooltip(`<div class="font-bold text-slate-800">${n.nodeName}</div><div class="text-[10px] text-slate-500">${type}</div>`, {
        direction: 'top', offset: [0, -16], opacity: 1, className: 'bg-white p-2 rounded-lg shadow-lg border-0'
      });
      
      layersRef.current.markers.push(marker);
    });

    // 4. Fit map bounds
    if (hasRoute) {
      routeResult.pathNodeSequence.forEach(nodeId => {
        const n = nodes.find(n => n.nodeId === nodeId);
        if (n) bounds.extend([n.lat, n.lng]);
      });
    } else {
      nodes.forEach(n => bounds.extend([n.lat, n.lng]));
    }
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
    
  }, [nodes, edges, routeResult]);

  return (
    <div className="w-full h-full relative z-0">
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100%', borderRadius: '1rem', background: '#0f172a' }}
        className="w-full h-full"
      />
      
      {/* Dynamic Map Legend for Road Surfaces and Locations */}
      <div className="absolute bottom-6 right-2 bg-slate-900/95 backdrop-blur shadow-xl border border-slate-700 p-3 rounded-xl z-[1000] pointer-events-none text-slate-100">
        
        {/* Locations Info */}
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Locations</h4>
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-[10px]">🏢</span>
            <span className="text-[10px] font-bold text-slate-300">Depot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-[10px]">🚜</span>
            <span className="text-[10px] font-bold text-slate-300">Farm Gate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-500 text-[10px]">📍</span>
            <span className="text-[10px] font-bold text-slate-300">Waypoint</span>
          </div>
        </div>

        {/* Surfaces Info */}
        {routeResult && routeResult.pathNodeSequence && (
          <>
            <div className="h-px w-full bg-slate-700 my-2"></div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Road Surfaces Taken</h4>
            <div className="flex flex-col gap-1.5">
              {Object.keys(surfaceStyles).filter(key => {
                // Check if this surface type is in the current route
                return edges && routeResult.pathNodeSequence.some((u, i) => {
                  if (i === routeResult.pathNodeSequence.length - 1) return false;
                  const v = routeResult.pathNodeSequence[i+1];
                  const edge = edges.find(e => 
                    ((e.uNode || e.unode) === u && (e.vNode || e.vnode) === v) || 
                    ((e.uNode || e.unode) === v && (e.vNode || e.vnode) === u)
                  );
                  return edge && edge.surfaceType === key;
                });
              }).map(type => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: surfaceStyles[type].color }}></div>
                  <span className="text-[10px] font-bold text-slate-300">{type.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
