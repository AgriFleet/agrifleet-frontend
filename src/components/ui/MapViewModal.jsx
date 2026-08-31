'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, ExternalLink, Navigation } from 'lucide-react';

export default function MapViewModal({ isOpen, onClose, lat, lng, title = 'Location Preview' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const validLat = lat !== undefined && lat !== null ? Number(lat) : 8.3114;
  const validLng = lng !== undefined && lng !== null ? Number(lng) : 80.4037;

  // Open Street Map embed URL for live visual tile render
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${validLng - 0.03}%2C${validLat - 0.03}%2C${validLng + 0.03}%2C${validLat + 0.03}&layer=mapnik&marker=${validLat}%2C${validLng}`;
  const externalGmapsUrl = `https://www.google.com/maps/search/?api=1&query=${validLat},${validLng}`;

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 text-white">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 font-mono">
                GPS Coordinates: {validLat.toFixed(4)}° N, {validLng.toFixed(4)}° E
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Map Embed */}
        <div className="relative w-full h-[360px] bg-slate-950">
          <iframe
            title="Location Map"
            src={osmEmbedUrl}
            className="w-full h-full border-none filter contrast-105 saturate-110"
            loading="lazy"
          />

          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Navigation className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>AgriFleet Active Telemetry Pin</span>
            </div>
            <a
              href={externalGmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
