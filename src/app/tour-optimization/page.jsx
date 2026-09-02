'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import MapViewModal from '@/components/ui/MapViewModal';
import {
  Route as RouteIcon,
  Sparkles,
  CheckCircle2,
  Fuel,
  Compass,
  TrendingUp,
  MapPin,
  ArrowRight,
  Zap,
  Sliders,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Play,
  ChevronRight,
  Clock,
  Navigation,
  Tractor,
  Award,
  Layers,
  BarChart3,
  SlidersHorizontal,
  X,
  Check,
  Info,
  Maximize2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

const LeafletTourMap = dynamic(
  () => import('@/components/map/LeafletTourMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[360px] flex items-center justify-center bg-slate-900/90 text-purple-400 font-bold text-sm border border-slate-800 rounded-2xl animate-pulse">
        🗺️ Loading Interactive GIS Field Map...
      </div>
    )
  }
);

const getValidSriLankaCoords = (rawLat, rawLng, fallbackLat = 8.3350, fallbackLng = 80.4450) => {
  const lat = Number(rawLat);
  const lng = Number(rawLng);

  const isValidLat = Number.isFinite(lat) && lat >= 5.0 && lat <= 10.0;
  const isValidLng = Number.isFinite(lng) && lng >= 79.0 && lng <= 82.0;

  return {
    lat: isValidLat ? lat : fallbackLat,
    lng: isValidLng ? lng : fallbackLng,
  };
};

const buildFarmOpportunityPayload = (farms = []) =>
  farms.map((farm) => ({
    id: farm.id,
    name: farm.name,
    acreageHa: Number(farm.acreageHa ?? 0),
    bookingValue: Number(farm.bookingValue ?? 0),
    cropType: farm.cropType || 'Unknown',
  }));

const createSelectionPayload = (farms = [], acreageWeight = 0.6, bookingValueWeight = 0.4, maxFarms = 3) => ({
  availableFarms: buildFarmOpportunityPayload(farms),
  maxFarms: Number(maxFarms),
  acreageWeight: Number(acreageWeight),
  bookingValueWeight: Number(bookingValueWeight),
});

const getSafeDepotId = (farms = []) => {
  const farmIdsSet = new Set(farms.map((f) => Number(f.id ?? f.bookingId ?? f.farmId)));
  let safeId = 0;
  while (farmIdsSet.has(safeId)) {
    safeId -= 1;
  }
  return safeId;
};

const getUniqueDepotId = (depotId, farms = []) => {
  const farmIdsSet = new Set(farms.map((f) => Number(f.id ?? f.bookingId ?? f.farmId)));
  const numericId = Number(depotId);

  if (!Number.isFinite(numericId) || !farmIdsSet.has(numericId)) {
    return Number.isFinite(numericId) ? numericId : getSafeDepotId(farms);
  }

  let safeId = 0;
  while (farmIdsSet.has(safeId)) {
    safeId -= 1;
  }
  return safeId;
};

const createSequencePayload = (farms, startDepot = null, endDepot = null) => {
  const resolvedStartDepot = startDepot || { id: null, name: 'Database Depot', latitude: 8.3350, longitude: 80.4450 };
  const resolvedEndDepot = endDepot || resolvedStartDepot;
  const safeId = getSafeDepotId(farms);
  const startDepotId = getUniqueDepotId(resolvedStartDepot?.id ?? safeId, farms);
  const endDepotId = getUniqueDepotId(resolvedEndDepot?.id ?? safeId, farms);

  return {
    depot: { ...resolvedStartDepot, id: startDepotId },
    farms: farms.map((farm) => {
      const rawId = Number(farm.id ?? farm.bookingId ?? farm.farmId);
      const coords = getValidSriLankaCoords(
        farm.latitude ?? farm.farmLat ?? farm.farm_lat,
        farm.longitude ?? farm.farmLng ?? farm.farm_lng
      );
      return {
        id: Number.isFinite(rawId) ? rawId : 1,
        name: farm.name || `Booking #${rawId}`,
        latitude: coords.lat,
        longitude: coords.lng,
      };
    }),
    returnToDepot: startDepotId === endDepotId,
    fuelConsumptionLitresPerKm: 0.12,
  };
};

const haversineKm = (from, to) => {
  if (!from || !to) return 0;
  const fromCoords = getValidSriLankaCoords(
    from.latitude ?? from.farmLat ?? from.farm_lat ?? from.lat,
    from.longitude ?? from.farmLng ?? from.farm_lng ?? from.lng
  );
  const toCoords = getValidSriLankaCoords(
    to.latitude ?? to.farmLat ?? to.farm_lat ?? to.lat,
    to.longitude ?? to.farmLng ?? to.farm_lng ?? to.lng
  );

  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDifference = toRadians(toCoords.lat - fromCoords.lat);
  const longitudeDifference = toRadians(toCoords.lng - fromCoords.lng);
  const fromLatitude = toRadians(fromCoords.lat);
  const toLatitude = toRadians(toCoords.lat);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDifference / 2) ** 2;

  return 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const createOptimizationPayload = (farms, startDepot = null, endDepot = null) => {
  const resolvedStartDepot = startDepot || { id: null, name: 'Database Depot', latitude: 8.3350, longitude: 80.4450 };
  const resolvedEndDepot = endDepot || resolvedStartDepot;
  const safeId = getSafeDepotId(farms);
  const startDepotId = getUniqueDepotId(resolvedStartDepot?.id ?? safeId, farms);
  const endDepotId = getUniqueDepotId(resolvedEndDepot?.id ?? safeId, farms);

  return {
    depot: { ...resolvedStartDepot, id: startDepotId },
    farms: farms.map((farm) => {
      const rawId = Number(farm.id ?? farm.bookingId ?? farm.farmId);
      const coords = getValidSriLankaCoords(
        farm.latitude ?? farm.farmLat ?? farm.farm_lat,
        farm.longitude ?? farm.farmLng ?? farm.farm_lng
      );
      return {
        id: Number.isFinite(rawId) ? rawId : 1,
        name: farm.name || `Booking #${rawId}`,
        latitude: coords.lat,
        longitude: coords.lng,
      };
    }),
    returnToDepot: startDepotId === endDepotId,
    fuelConsumptionLitresPerKm: 0.12,
    populationSize: 80,
    generations: 120,
    mutationRate: 0.02,
  };
};

const formatTourSequenceWithDepots = (respData, algoName, startDepot, endDepot) => {
  if (!respData || !startDepot || !endDepot) return respData;

  const rawSequence = Array.isArray(respData.visitSequence)
    ? [...respData.visitSequence]
    : Array.isArray(respData.tourSequence)
    ? [...respData.tourSequence]
    : [];

  const startDepotStop = {
    id: startDepot.id,
    name: startDepot.name,
    latitude: Number(startDepot.latitude),
    longitude: Number(startDepot.longitude),
    isDepot: true,
  };

  const endDepotStop = {
    id: endDepot.id,
    name: endDepot.name,
    latitude: Number(endDepot.latitude),
    longitude: Number(endDepot.longitude),
    isDepot: true,
  };

  // Strip out ONLY actual depot nodes from raw sequence (never match farm IDs!)
  const farmStopsOnly = rawSequence.filter((stop) => {
    if (!stop) return false;
    if (stop.isDepot === true || stop.type === 'depot') return false;
    const name = String(stop.name || '').trim().toLowerCase();
    const startName = String(startDepot.name || '').trim().toLowerCase();
    const endName = String(endDepot.name || '').trim().toLowerCase();
    if (name && (name === startName || name === endName)) return false;
    if (name.includes('depot') || name.includes('hub')) return false;
    return true;
  });

  // Construct complete ordered sequence: [startDepotStop, ...farmStops, endDepotStop]
  const finalSequence = [
    startDepotStop,
    ...farmStopsOnly.map((f) => ({ ...f, isDepot: false })),
    endDepotStop,
  ];

  // Re-calculate distance across full multi-stop sequence from startDepot through farms to endDepot
  let totalDistanceKm = 0;
  for (let i = 0; i < finalSequence.length - 1; i++) {
    totalDistanceKm += haversineKm(finalSequence[i], finalSequence[i + 1]);
  }

  const fuelConsumptionLitresPerKm = 0.12;
  const estimatedFuelLitres = totalDistanceKm * fuelConsumptionLitresPerKm;

  return {
    ...respData,
    algorithm: algoName,
    startDepotName: startDepot.name,
    endDepotName: endDepot.name,
    startDepot,
    endDepot,
    visitSequence: finalSequence,
    tourSequence: finalSequence,
    totalDistanceKm,
    estimatedFuelLitres,
  };
};

function InteractiveRouteCanvas({
  depots,
  farms,
  selectedFarms,
  activeSequence,
  activeAlgorithm,
  optimizationResult,
  sequenceResult,
  selectedMapAlgo,
  onSelectMapAlgo,
  onOpenMapModal
}) {
  const baseDepotLat = depots[0]?.latitude ?? 8.3350;
  const baseDepotLng = depots[0]?.longitude ?? 80.4450;

  // Combine all nodes for node count badge and Google Maps link
  const allNodesCount = useMemo(() => depots.length + farms.length, [depots, farms]);

  const centerLat = useMemo(() => {
    if (!farms.length) return baseDepotLat;
    const lats = farms.map(f => getValidSriLankaCoords(f.latitude ?? f.farmLat ?? f.farm_lat, f.longitude ?? f.farmLng ?? f.farm_lng).lat);
    return (Math.min(...lats) + Math.max(...lats)) / 2;
  }, [farms, baseDepotLat]);

  const centerLng = useMemo(() => {
    if (!farms.length) return baseDepotLng;
    const lngs = farms.map(f => getValidSriLankaCoords(f.latitude ?? f.farmLat ?? f.farm_lat, f.longitude ?? f.farmLng ?? f.farm_lng).lng);
    return (Math.min(...lngs) + Math.max(...lngs)) / 2;
  }, [farms, baseDepotLng]);

  const externalGmapsUrl = `https://www.google.com/maps/search/?api=1&query=${centerLat.toFixed(4)},${centerLng.toFixed(4)}`;

  // Leg summary calculations
  const routeLegs = useMemo(() => {
    if (!activeSequence || activeSequence.length < 2) return [];
    const legsList = [];
    for (let i = 0; i < activeSequence.length - 1; i++) {
      const p1 = activeSequence[i];
      const p2 = activeSequence[i + 1];
      const dist = haversineKm(p1, p2);
      legsList.push({
        from: p1.name || `Node #${p1.id}`,
        to: p2.name || `Node #${p2.id}`,
        dist
      });
    }
    return legsList;
  }, [activeSequence]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950/90 backdrop-blur-xl shadow-2xl p-4 sm:p-6 text-white">
      {/* Background visual grid & glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Navigation className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-black text-white tracking-tight">Interactive Tour & Live Map Canvas</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time GIS field map tiles & TSP route direction indicators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Map Algorithm Switcher Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => onSelectMapAlgo('GA')}
              disabled={!optimizationResult}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                (selectedMapAlgo === 'GA' || (selectedMapAlgo === 'AUTO' && optimizationResult))
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black'
                  : 'text-slate-400 hover:text-white disabled:opacity-30'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>🧬 GA Route</span>
            </button>
            <button
              onClick={() => onSelectMapAlgo('NN')}
              disabled={!sequenceResult}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                (selectedMapAlgo === 'NN' || (selectedMapAlgo === 'AUTO' && !optimizationResult && sequenceResult))
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black'
                  : 'text-slate-400 hover:text-white disabled:opacity-30'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>🧭 NN Route</span>
            </button>
          </div>



          {activeAlgorithm && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300 animate-pulse">
              Active: {activeAlgorithm}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400">
            {allNodesCount} Nodes Plotted
          </span>
        </div>
      </div>

      {/* Interactive Leaflet Map Canvas Container */}
      <div className="relative w-full h-[380px] bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
        <LeafletTourMap
          depots={depots}
          farms={farms}
          selectedFarms={selectedFarms}
          activeSequence={activeSequence}
          onOpenMapModal={onOpenMapModal}
        />
      </div>

      {/* Route Legs Summary Bar */}
      {activeSequence && activeSequence.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-bold">Tour Flow Order:</span>
            <span className="text-slate-400">
              {activeSequence.map(p => p.name || `Node #${p.id}`).join(' → ')}
            </span>
          </div>
          <div className="font-mono text-purple-300 font-bold">
            {routeLegs.length} Tour Legs • {routeLegs.reduce((sum, l) => sum + l.dist, 0).toFixed(2)} km Total
          </div>
        </div>
      )}
    </div>
  );
}

export default function TourOptimizationPage() {
  const { showSuccess, showError } = useToast();

  // Primary Data States
  const [availableFarms, setAvailableFarms] = useState([]);
  const [depots, setDepots] = useState([]);
  const [startDepotId, setStartDepotId] = useState(null);
  const [endDepotId, setEndDepotId] = useState(null);
  const [selectedManualFarms, setSelectedManualFarms] = useState([]);
  const [selectionResult, setSelectionResult] = useState(null);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [sequenceResult, setSequenceResult] = useState(null);
  const [selectedMapAlgo, setSelectedMapAlgo] = useState('AUTO'); // 'AUTO' | 'GA' | 'NN'

  // Loading States
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [loadingOptimization, setLoadingOptimization] = useState(false);
  const [loadingSequence, setLoadingSequence] = useState(false);
  const [loadingFarms, setLoadingFarms] = useState(true);

  // Modals & UI States
  const [isManualRouteModalOpen, setIsManualRouteModalOpen] = useState(false);
  const [mapModal, setMapModal] = useState({ isOpen: false, lat: 0, lng: 0, title: '' });

  // Filtering & Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('acreage'); // 'acreage' | 'value' | 'name'

  // Tunable Selection Parameters
  const [acreageWeight, setAcreageWeight] = useState(0.6);
  const [bookingValueWeight, setBookingValueWeight] = useState(0.4);
  const [maxFarmsLimit, setMaxFarmsLimit] = useState(3);

  // Derive current workflow step automatically based on optimization state
  const currentWorkflowStep = useMemo(() => {
    if (optimizationResult || sequenceResult) return 3;
    if (selectionResult) return 2;
    return 1;
  }, [selectionResult, optimizationResult, sequenceResult]);

  // Load farms & vehicles data on mount
  useEffect(() => {
    const loadAvailableFarms = async () => {
      try {
        const [farmsResponse, bookingsResponse, depotsResponse] = await Promise.allSettled([
          api.selection.getAvailableFarms(),
          api.core.getAllBookings(),
          api.core.getAllDepots(),
        ]);

        const selectionFarms = farmsResponse.status === 'fulfilled' ? farmsResponse.value?.data || [] : [];
        const coreBookings = bookingsResponse.status === 'fulfilled' ? bookingsResponse.value?.data || [] : [];
        const depotList = depotsResponse.status === 'fulfilled' ? depotsResponse.value?.data || [] : [];

        const combinedFarmsMap = new Map();

        const normalizeFarm = (item) => {
          const farmId = item.id ?? item.bookingId ?? item.booking_id ?? item.farmId;
          if (!farmId) return null;

          const acreageHa = Number(item.acreageHa ?? item.acreage ?? 0);
          const cropType = item.cropType ?? item.crop_type ?? 'Wheat';

          const rawLat = item.farmLat ?? item.farm_lat ?? item.latitude ?? item.farm_latitude ?? item.farmLatitude ?? item.lat;
          const rawLng = item.farmLng ?? item.farm_lng ?? item.longitude ?? item.farm_longitude ?? item.farmLongitude ?? item.lng ?? item.long;

          let latitude = rawLat !== undefined && rawLat !== null && rawLat !== '' ? Number(rawLat) : NaN;
          let longitude = rawLng !== undefined && rawLng !== null && rawLng !== '' ? Number(rawLng) : NaN;

          if (!Number.isFinite(latitude) || latitude === 0) {
            latitude = 8.3350;
          }
          if (!Number.isFinite(longitude) || longitude === 0) {
            longitude = 80.4450;
          }

          const bookingValue = Number(item.bookingValue ?? item.totalValue ?? item.value ?? (acreageHa > 0 ? acreageHa * 250 : 2500));

          return {
            id: Number(farmId),
            name: item.name || `Booking #${farmId}`,
            acreageHa: Number.isFinite(acreageHa) && acreageHa > 0 ? acreageHa : 10,
            bookingValue: Number.isFinite(bookingValue) && bookingValue > 0 ? bookingValue : 2500,
            cropType,
            latitude,
            longitude,
            farmLat: latitude,
            farm_lat: latitude,
            farmLng: longitude,
            farm_lng: longitude,
          };
        };

        selectionFarms.forEach(f => {
          const norm = normalizeFarm(f);
          if (norm) combinedFarmsMap.set(norm.id, norm);
        });

        coreBookings.forEach(b => {
          const norm = normalizeFarm(b);
          if (norm) {
            if (combinedFarmsMap.has(norm.id)) {
              const existing = combinedFarmsMap.get(norm.id);
              combinedFarmsMap.set(norm.id, {
                ...existing,
                ...norm,
                latitude: norm.latitude !== 8.3350 ? norm.latitude : existing.latitude,
                longitude: norm.longitude !== 80.4450 ? norm.longitude : existing.longitude,
                farmLat: norm.latitude !== 8.3350 ? norm.latitude : existing.latitude,
                farmLng: norm.longitude !== 80.4450 ? norm.longitude : existing.longitude,
              });
            } else {
              combinedFarmsMap.set(norm.id, norm);
            }
          }
        });

        const mappedFarms = Array.from(combinedFarmsMap.values());

        const mappedDepots = depotList
          .map((depotItem) => {
            const depotId = depotItem.depotId ?? depotItem.depot_id ?? depotItem.id;
            const rawLat = depotItem.latitude ?? depotItem.lat;
            const rawLng = depotItem.longitude ?? depotItem.lng;

            let latitude = rawLat !== undefined && rawLat !== null && rawLat !== '' ? Number(rawLat) : NaN;
            let longitude = rawLng !== undefined && rawLng !== null && rawLng !== '' ? Number(rawLng) : NaN;

            if (!Number.isFinite(latitude) || latitude === 0) {
              latitude = 8.3114;
            }
            if (!Number.isFinite(longitude) || longitude === 0) {
              longitude = 80.4037;
            }

            const name = depotItem.depotName ?? depotItem.name ?? `Depot #${depotId}`;

            if (!depotId) {
              return null;
            }

            return {
              id: Number(depotId),
              name,
              latitude,
              longitude,
            };
          })
          .filter(Boolean);

        const baseDepots = mappedDepots.length ? mappedDepots : [];

        setAvailableFarms(mappedFarms);
        setDepots(baseDepots);
        setStartDepotId(baseDepots[0]?.id ?? null);
        setEndDepotId(baseDepots[baseDepots.length - 1]?.id ?? null);
        setSelectedManualFarms(mappedFarms.slice(0, 3).map((farm) => farm.id));
      } catch (err) {
        console.error('Failed to load farm data from the database', err);
        setAvailableFarms([]);
        setDepots([]);
        setStartDepotId(null);
        setEndDepotId(null);
        setSelectedManualFarms([]);
      } finally {
        setLoadingFarms(false);
      }
    };

    loadAvailableFarms();
  }, []);

  // Filter & Sort Available Farms
  const filteredFarms = useMemo(() => {
    return availableFarms
      .filter((farm) => {
        const matchesSearch = farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          farm.cropType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCrop = selectedCropFilter === 'ALL' || farm.cropType.toUpperCase() === selectedCropFilter.toUpperCase();
        return matchesSearch && matchesCrop;
      })
      .sort((a, b) => {
        if (sortBy === 'acreage') return b.acreageHa - a.acreageHa;
        if (sortBy === 'value') return b.bookingValue - a.bookingValue;
        return a.name.localeCompare(b.name);
      });
  }, [availableFarms, searchTerm, selectedCropFilter, sortBy]);

  // Extract unique crop types for filter bar
  const cropTypes = useMemo(() => {
    const set = new Set(availableFarms.map(f => f.cropType));
    return Array.from(set);
  }, [availableFarms]);

  // Synchronize route sequence display when start or end depot selection changes
  useEffect(() => {
    if (!depots.length || startDepotId === null || endDepotId === null) return;
    const startDepot = depots.find((item) => item.id === Number(startDepotId)) || depots[0];
    const endDepot = depots.find((item) => item.id === Number(endDepotId)) || depots[depots.length - 1] || depots[0];

    if (optimizationResult) {
      setOptimizationResult((prev) => prev ? formatTourSequenceWithDepots(prev, prev.algorithm || 'Genetic Algorithm (GA)', startDepot, endDepot) : null);
    }
    if (sequenceResult) {
      setSequenceResult((prev) => prev ? formatTourSequenceWithDepots(prev, prev.algorithm || 'Nearest-Neighbour / Exact', startDepot, endDepot) : null);
    }
  }, [startDepotId, endDepotId, depots]);

  // Aggregate top metrics
  const totalAvailableAcreage = useMemo(() => availableFarms.reduce((acc, f) => acc + f.acreageHa, 0), [availableFarms]);
  const totalPotentialRevenue = useMemo(() => availableFarms.reduce((acc, f) => acc + f.bookingValue, 0), [availableFarms]);

  // Compute active sequence for map canvas & polyline route visualization
  const currentActiveSequence = useMemo(() => {
    if (selectedMapAlgo === 'GA' && optimizationResult?.visitSequence?.length) {
      return optimizationResult.visitSequence;
    }
    if (selectedMapAlgo === 'NN' && sequenceResult?.visitSequence?.length) {
      return sequenceResult.visitSequence;
    }
    if (optimizationResult?.visitSequence?.length) return optimizationResult.visitSequence;
    if (sequenceResult?.visitSequence?.length) return sequenceResult.visitSequence;
    if (selectionResult?.selectedFarms?.length && depots.length) {
      const startDepot = depots.find((item) => item.id === Number(startDepotId)) || depots[0];
      const endDepot = depots.find((item) => item.id === Number(endDepotId)) || depots[depots.length - 1] || depots[0];
      return [startDepot, ...selectionResult.selectedFarms, endDepot];
    }
    return [];
  }, [selectedMapAlgo, optimizationResult, sequenceResult, selectionResult, depots, startDepotId, endDepotId]);

  const currentActiveAlgorithm = useMemo(() => {
    if (selectedMapAlgo === 'GA' && optimizationResult) return 'Genetic Algorithm (GA)';
    if (selectedMapAlgo === 'NN' && sequenceResult) return 'Nearest-Neighbour / Exact';
    if (optimizationResult) return 'Genetic Algorithm (GA)';
    if (sequenceResult) return 'Nearest-Neighbour / Exact';
    if (selectionResult) return 'Selection Engine Subset';
    return null;
  }, [selectedMapAlgo, optimizationResult, sequenceResult, selectionResult]);

  // Handler: Run Selection Engine
  const handleSelectFarms = async () => {
    if (!availableFarms.length) {
      showError('No farm data is available in the database yet.');
      setSelectionResult(null);
      return;
    }

    setLoadingSelection(true);
    setOptimizationResult(null);

    try {
      const payload = createSelectionPayload(availableFarms, acreageWeight, bookingValueWeight, maxFarmsLimit);
      const response = await api.selection.maximizeAcreageValue(payload);

      setSelectionResult(response.data);
      showSuccess('🌾 Best farm opportunities selected successfully!');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Task 5 selection failed.');
      setSelectionResult(null);
    } finally {
      setLoadingSelection(false);
    }
  };

  // Handler: Run GA Optimization
  const handleOptimizeRoute = async () => {
    if (!selectionResult || !selectionResult.selectedFarms?.length) {
      showError('Select farms first so the route can be optimized.');
      return;
    }

    if (!depots.length || !startDepotId || !endDepotId) {
      showError('No depots are available in the database for route optimization.');
      return;
    }

    setLoadingOptimization(true);

    try {
      const selectedFarms = selectionResult.selectedFarms.map((farm) => {
        const farmId = farm?.id ?? farm?.bookingId ?? farm?.farmId;
        const source = availableFarms.find((item) => Number(item.id) === Number(farmId));
        return source || farm;
      });

      const startDepot = depots.find((item) => item.id === Number(startDepotId)) || depots[0];
      const endDepot = depots.find((item) => item.id === Number(endDepotId)) || depots[depots.length - 1] || depots[0];
      const payload = createOptimizationPayload(selectedFarms, startDepot, endDepot);
      const response = await api.tour.optimizeGeneticAlgorithm(payload);
      const processed = formatTourSequenceWithDepots(response.data, 'Genetic Algorithm (GA)', startDepot, endDepot);
      setOptimizationResult(processed);
      showSuccess(`🧬 GA route optimized from ${startDepot.name} to ${endDepot.name}!`);
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Route optimization failed.');
      setOptimizationResult(null);
    } finally {
      setLoadingOptimization(false);
    }
  };

  // Handler: Run Exact / Nearest-Neighbour Sequence Optimization
  const handleOptimizeSequence = async () => {
    if (!selectionResult || !selectionResult.selectedFarms?.length) {
      showError('Select farms first so the route can be optimized.');
      return;
    }

    if (!depots.length || !startDepotId || !endDepotId) {
      showError('No depots are available in the database right now.');
      return;
    }

    setLoadingSequence(true);

    try {
      const selectedFarms = selectionResult.selectedFarms.map((farm) => {
        const farmId = farm?.id ?? farm?.bookingId ?? farm?.farmId;
        const source = availableFarms.find((item) => Number(item.id) === Number(farmId));
        return source || farm;
      });

      const startDepot = depots.find((item) => item.id === Number(startDepotId)) || depots[0];
      const endDepot = depots.find((item) => item.id === Number(endDepotId)) || depots[depots.length - 1] || depots[0];
      const payload = createSequencePayload(selectedFarms, startDepot, endDepot);
      const response = await api.tour.optimizeSequence(payload);
      const processed = formatTourSequenceWithDepots(response.data, 'Nearest-Neighbour / Exact', startDepot, endDepot);
      setSequenceResult(processed);
      showSuccess(`🧭 Exact/NN route optimized from ${startDepot.name} to ${endDepot.name}!`);
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Sequence optimization failed.');
      setSequenceResult(null);
    } finally {
      setLoadingSequence(false);
    }
  };

  // Handler: Toggle manual selection
  const toggleManualFarmSelection = (farmId) => {
    setSelectedManualFarms((current) =>
      current.includes(farmId)
        ? current.filter((id) => id !== farmId)
        : [...current, farmId]
    );
  };

  // Handler: Run Custom Manual Route Planning (supports 'GA', 'NN', or 'BOTH')
  const handleManualRoutePlanning = async (algorithmType = 'BOTH') => {
    if (!selectedManualFarms.length) {
      showError('Select at least one farm for a custom route.');
      return;
    }

    if (!depots.length || !startDepotId || !endDepotId) {
      showError('No depots are available from the database for route planning.');
      return;
    }

    const startDepot = depots.find((item) => item.id === Number(startDepotId)) || depots[0];
    const endDepot = depots.find((item) => item.id === Number(endDepotId)) || depots[depots.length - 1] || depots[0];

    // Filter and deduplicate selected farms by ID (type-safe)
    const selectedFarms = availableFarms.filter((farm) => {
      const farmId = farm?.id ?? farm?.bookingId ?? farm?.farmId;
      return selectedManualFarms.some((selectedId) => Number(selectedId) === Number(farmId));
    });

    if (!selectedFarms.length) {
      showError('Selected farm data could not be located in database.');
      return;
    }

    const gaPayload = createOptimizationPayload(selectedFarms, startDepot, endDepot);
    const nnPayload = createSequencePayload(selectedFarms, startDepot, endDepot);

    setLoadingSequence(true);

    try {
      if (algorithmType === 'GA') {
        const response = await api.tour.optimizeGeneticAlgorithm(gaPayload);
        const processed = formatTourSequenceWithDepots(response.data, 'Genetic Algorithm (GA)', startDepot, endDepot);
        setOptimizationResult(processed);
        showSuccess(`🧬 Custom GA route planned (${processed.totalDistanceKm.toFixed(1)} km)!`);
      } else if (algorithmType === 'NN') {
        const response = await api.tour.optimizeSequence(nnPayload);
        const processed = formatTourSequenceWithDepots(response.data, 'Nearest-Neighbour / Exact', startDepot, endDepot);
        setSequenceResult(processed);
        showSuccess(`🧭 Custom NN route planned (${processed.totalDistanceKm.toFixed(1)} km)!`);
      } else {
        const [gaRes, nnRes] = await Promise.allSettled([
          api.tour.optimizeGeneticAlgorithm(gaPayload),
          api.tour.optimizeSequence(nnPayload),
        ]);

        if (gaRes.status === 'fulfilled') {
          setOptimizationResult(formatTourSequenceWithDepots(gaRes.value.data, 'Genetic Algorithm (GA)', startDepot, endDepot));
        }
        if (nnRes.status === 'fulfilled') {
          setSequenceResult(formatTourSequenceWithDepots(nnRes.value.data, 'Nearest-Neighbour / Exact', startDepot, endDepot));
        }
        showSuccess('⚡ Custom route evaluated across BOTH Genetic & NN algorithms!');
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Custom route planning failed.');
    } finally {
      setLoadingSequence(false);
    }
  };

  // Recharts data format for available farm opportunities
  const farmChartData = useMemo(() => {
    return availableFarms.map(f => ({
      name: f.name.length > 12 ? `${f.name.substring(0, 10)}...` : f.name,
      fullName: f.name,
      Acreage: f.acreageHa,
      Value: Number((f.bookingValue / 100).toFixed(1))
    }));
  }, [availableFarms]);



  const openMapModal = (lat, lng, title) => {
    setMapModal({ isOpen: true, lat, lng, title });
  };

  return (
    <div className="relative min-h-screen pb-24 space-y-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 text-slate-100">

      {/* Background Ambient Lights */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse-glow" />
        <div className="absolute top-1/3 left-1/5 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8">

        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-950 opacity-95" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wider uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                Task 5 Engine • Multi-Job Tour & Route Optimization
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Multi-Job Tour <span className="gradient-text-purple">Optimization</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-2xl leading-relaxed">
                Maximize farm revenue selection & Genetic Algorithm TSP route sequencing for lowest-distance operator shift schedules.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
              <button
                onClick={handleSelectFarms}
                disabled={loadingSelection}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 text-xs whitespace-nowrap disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${loadingSelection ? 'animate-spin' : ''}`} />
                <span>{loadingSelection ? 'Selecting...' : 'Select Best Farms'}</span>
              </button>

              <button
                onClick={handleOptimizeRoute}
                disabled={loadingOptimization || !selectionResult}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-purple-600/20 transition-all hover:scale-105 text-xs whitespace-nowrap disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${loadingOptimization ? 'animate-spin' : ''}`} />
                <span>{loadingOptimization ? 'Optimizing...' : 'Optimize Route (GA)'}</span>
              </button>

              <button
                onClick={handleOptimizeSequence}
                disabled={loadingSequence || !selectionResult}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 text-xs whitespace-nowrap disabled:opacity-50"
              >
                <Compass className={`w-4 h-4 ${loadingSequence ? 'animate-spin' : ''}`} />
                <span>{loadingSequence ? 'Optimizing...' : 'Optimize (Exact/NN)'}</span>
              </button>

              <button
                onClick={() => setIsManualRouteModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 text-xs whitespace-nowrap"
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-200" />
                <span>Manual Planner</span>
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Automation Stepper Bar */}
        <div className="glass-panel p-2.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold select-none pointer-events-none">
          {/* Step 1: Farm Selection & Scoring */}
          <div
            className={`w-full sm:w-auto flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all ${currentWorkflowStep === 1
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold border border-purple-400/40'
                : selectionResult
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-500 opacity-60'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${selectionResult
                  ? 'bg-emerald-500 text-slate-950'
                  : currentWorkflowStep === 1
                    ? 'bg-slate-950 text-purple-300 border border-purple-400/50'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                {selectionResult ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
              </span>
              <span>1. Farm Selection & Scoring</span>
            </div>
            {selectionResult && <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Completed</span>}
          </div>

          <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />

          {/* Step 2: Genetic & TSP Optimization */}
          <div
            className={`w-full sm:w-auto flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all ${currentWorkflowStep === 2
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold border border-purple-400/40'
                : (optimizationResult || sequenceResult)
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-500 opacity-60'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${(optimizationResult || sequenceResult)
                  ? 'bg-emerald-500 text-slate-950'
                  : currentWorkflowStep === 2
                    ? 'bg-slate-950 text-purple-300 border border-purple-400/50'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                {(optimizationResult || sequenceResult) ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
              </span>
              <span>2. Genetic & TSP Optimization</span>
            </div>
            {(optimizationResult || sequenceResult) && <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Optimized</span>}
          </div>

          <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />

          {/* Step 3: Visual Route & Shift Verification */}
          <div
            className={`w-full sm:w-auto flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all ${currentWorkflowStep === 3
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold border border-purple-400/40'
                : 'bg-slate-900/60 border border-slate-800 text-slate-500 opacity-60'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentWorkflowStep === 3
                  ? 'bg-slate-950 text-purple-300 border border-purple-400/50'
                  : 'bg-slate-800 text-slate-500'
                }`}>
                3
              </span>
              <span>3. Visual Route & Shift Verification</span>
            </div>
            {currentWorkflowStep === 3 && <span className="text-[10px] font-extrabold text-purple-200 uppercase tracking-wider">Active</span>}
          </div>
        </div>

        {/* Top Analytics Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Database Plots</span>
              <MapPin className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{availableFarms.length} <span className="text-xs font-normal text-slate-400">plots</span></div>
            <div className="text-[11px] text-slate-400">Available across regional database</div>
          </div>

          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Selected Farms</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {selectionResult?.selectedFarms?.length || 0} <span className="text-xs font-normal text-slate-400">selected</span>
            </div>
            <div className="text-[11px] text-slate-400">Scored by acreage & revenue weights</div>
          </div>

          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Tour Distance</span>
              <RouteIcon className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {optimizationResult
                ? `${optimizationResult.totalDistanceKm.toFixed(1)} km`
                : sequenceResult
                  ? `${sequenceResult.totalDistanceKm.toFixed(1)} km`
                  : '-- km'}
            </div>
            <div className="text-[11px] text-slate-400">
              {optimizationResult ? 'GA TSP Optimized' : sequenceResult ? 'Sequence Calculated' : 'Pending Selection'}
            </div>
          </div>

          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Fuel Estimate</span>
              <Fuel className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {optimizationResult
                ? `${optimizationResult.estimatedFuelLitres.toFixed(1)} L`
                : sequenceResult
                  ? `${sequenceResult.estimatedFuelLitres.toFixed(1)} L`
                  : '-- L'}
            </div>
            <div className="text-[11px] text-slate-400">
              {optimizationResult ? 'GA Optimized' : sequenceResult ? 'Sequence Calculated' : 'Pending Optimization'}
            </div>
          </div>
        </div>

        {/* SECTION 1: Farm Opportunities & Selection Outcome */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* Available Farm Opportunities (7 cols) */}
          <div className="xl:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Opportunity Explorer</span>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    Available Farm Opportunities
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-purple-500 font-semibold"
                  >
                    <option value="acreage">Sort by Acreage (High)</option>
                    <option value="value">Sort by Value (High)</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search farms by name or crop..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-purple-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Crop Type Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedCropFilter('ALL')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCropFilter === 'ALL'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                  >
                    All ({availableFarms.length})
                  </button>
                  {cropTypes.map((crop) => (
                    <button
                      key={crop}
                      onClick={() => setSelectedCropFilter(crop)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedCropFilter.toUpperCase() === crop.toUpperCase()
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>

              {/* Farms List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {loadingFarms ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-400 opacity-60" />
                    <p className="text-xs font-semibold">Loading farm opportunities from database...</p>
                  </div>
                ) : filteredFarms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center space-y-3 border-2 border-dashed border-slate-800 rounded-2xl">
                    <MapPin className="w-10 h-10 opacity-30 text-purple-400" />
                    <p className="text-xs font-semibold">No farm plots match your search filter.</p>
                    <button
                      onClick={() => { setSearchTerm(''); setSelectedCropFilter('ALL'); }}
                      className="text-xs text-purple-400 hover:underline"
                    >
                      Clear search filters
                    </button>
                  </div>
                ) : (
                  filteredFarms.map((farm) => {
                    return (
                      <div
                        key={farm.id}
                        className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-xs">
                            #{farm.id}
                          </div>

                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{farm.name}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>🌾 {farm.cropType}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-400">
                                {farm.latitude.toFixed(4)}°, {farm.longitude.toFixed(4)}°
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono text-xs font-bold">
                            <div className="text-emerald-400">{farm.acreageHa} ha</div>
                            <div className="text-purple-300">£{farm.bookingValue.toLocaleString()}</div>
                          </div>

                          <button
                            onClick={() => openMapModal(farm.latitude, farm.longitude, farm.name)}
                            title="Preview GPS Location"
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Eye className="w-4 h-4 text-cyan-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Showing {filteredFarms.length} of {availableFarms.length} plots</span>
              <span className="text-purple-400">Sorted by {sortBy}</span>
            </div>
          </div>

          {/* Maximized Farm Selection Outcome (5 cols) */}
          <div className="xl:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="border-b border-slate-800/80 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Optimization Engine</span>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Maximized Farm Selection Outcome
                </h2>
              </div>

              {/* Interactive Algorithm Weight Controls */}
              <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/40">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                    Objective Function Weighting Parameters
                  </span>
                  <span className="text-purple-400 font-mono text-[11px]">Max: {maxFarmsLimit} Plots</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 flex justify-between">
                      <span>Acreage Weight</span>
                      <span className="font-bold text-emerald-400">{(acreageWeight * 100).toFixed(0)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.1"
                      value={acreageWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setAcreageWeight(val);
                        setBookingValueWeight(parseFloat((1 - val).toFixed(1)));
                      }}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 flex justify-between">
                      <span>Revenue Weight</span>
                      <span className="font-bold text-purple-400">{(bookingValueWeight * 100).toFixed(0)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.1"
                      value={bookingValueWeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setBookingValueWeight(val);
                        setAcreageWeight(parseFloat((1 - val).toFixed(1)));
                      }}
                      className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1"
                    />
                  </div>
                </div>
              </div>

              {!selectionResult ? (
                /* Interactive Empty State Card */
                <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center space-y-4 bg-slate-900/30">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Selection Engine Idle</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Click below to run the Task 5 Optimization algorithm and select the optimal 3 farm opportunity subset.
                    </p>
                  </div>

                  <button
                    onClick={handleSelectFarms}
                    disabled={loadingSelection || !availableFarms.length}
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 text-xs disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loadingSelection ? 'Running Selection Engine...' : 'Run Max Selection Engine'}</span>
                  </button>
                </div>
              ) : (
                /* Results Outcome Container */
                <div className="space-y-5 animate-fade-in-scale">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 space-y-3">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Route Depot Selection</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Depot</label>
                        <select
                          value={startDepotId ?? ''}
                          onChange={(e) => setStartDepotId(e.target.value === '' ? null : Number(e.target.value))}
                          disabled={!depots.length}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100 outline-none focus:border-cyan-500 disabled:opacity-50"
                        >
                          {!depots.length && <option value="">No depots available</option>}
                          {depots.map((depotItem) => (
                            <option key={depotItem.id} value={depotItem.id}>{depotItem.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End Depot</label>
                        <select
                          value={endDepotId ?? ''}
                          onChange={(e) => setEndDepotId(e.target.value === '' ? null : Number(e.target.value))}
                          disabled={!depots.length}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100 outline-none focus:border-cyan-500 disabled:opacity-50"
                        >
                          {!depots.length && <option value="">No depots available</option>}
                          {depots.map((depotItem) => (
                            <option key={depotItem.id} value={depotItem.id}>{depotItem.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">Selected Acreage</div>
                      <div className="mt-1 text-lg font-black text-white">
                        {selectionResult.totalAcreageHa.toFixed(1)} <span className="text-xs font-normal text-slate-400">ha</span>
                      </div>
                    </div>

                    <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">Booking Value</div>
                      <div className="mt-1 text-lg font-black text-white">
                        £{selectionResult.totalBookingValue.toLocaleString()}
                      </div>
                    </div>

                    <div className="glass-card p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5">
                      <div className="text-[10px] font-bold text-purple-400 uppercase">Algorithm</div>
                      <div className="mt-1 text-xs font-extrabold text-white truncate">
                        {selectionResult.algorithm}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300 uppercase tracking-wider text-[11px]">Selected Farm Subset</span>
                      <span className="text-emerald-400 text-[11px] font-mono">{selectionResult.selectedFarms.length} Farms Chosen</span>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {selectionResult.selectedFarms.map((farm) => (
                        <div key={farm.id} className="glass-card p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs hover:border-emerald-500/40">
                          <div>
                            <div className="font-bold text-white">{farm.name}</div>
                            <div className="text-[11px] text-slate-400">🌾 {farm.cropType}</div>
                          </div>
                          <div className="text-right font-mono font-bold">
                            <div className="text-emerald-400">{farm.acreageHa} ha</div>
                            <div className="text-purple-300">£{farm.bookingValue.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectionResult && (
              <div className="pt-4 border-t border-slate-800">
                {!optimizationResult ? (
                  <button
                    onClick={handleOptimizeRoute}
                    disabled={loadingOptimization}
                    className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-purple-600/20 transition-all hover:scale-105 text-xs disabled:opacity-50"
                  >
                    <Zap className={`w-4 h-4 ${loadingOptimization ? 'animate-spin' : ''}`} />
                    <span>{loadingOptimization ? 'Optimizing GA Route...' : 'Next Step: Optimize GA Route →'}</span>
                  </button>
                ) : !sequenceResult ? (
                  <button
                    onClick={handleOptimizeSequence}
                    disabled={loadingSequence}
                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 text-xs disabled:opacity-50"
                  >
                    <Compass className={`w-4 h-4 ${loadingSequence ? 'animate-spin' : ''}`} />
                    <span>{loadingSequence ? 'Optimizing NN Route...' : 'Next Step: Optimize NN Route →'}</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleOptimizeRoute}
                      disabled={loadingOptimization}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-purple-600/80 hover:bg-purple-500 text-white font-bold px-4 py-3 rounded-2xl text-xs transition-all disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Re-run GA Route</span>
                    </button>
                    <button
                      onClick={handleOptimizeSequence}
                      disabled={loadingSequence}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold px-4 py-3 rounded-2xl text-xs transition-all disabled:opacity-50"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Re-run NN Route</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Interactive SVG Telemetry Canvas & Route Visualizer */}
        <InteractiveRouteCanvas
          depots={depots}
          farms={availableFarms}
          selectedFarms={selectionResult?.selectedFarms || []}
          activeSequence={currentActiveSequence}
          activeAlgorithm={currentActiveAlgorithm}
          optimizationResult={optimizationResult}
          sequenceResult={sequenceResult}
          selectedMapAlgo={selectedMapAlgo}
          onSelectMapAlgo={setSelectedMapAlgo}
          onOpenMapModal={openMapModal}
        />

        {/* SECTION 3: Dual Algorithm Comparison View (GA vs. Nearest Neighbour) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Algorithm Comparison</span>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Compass className="w-6 h-6 text-purple-400" />
                TSP Optimization Engines (GA vs. Exact NN)
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Run both engines to compare distance, fuel consumption, and tour duration.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* GA Result Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-2xl">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Genetic Algorithm (GA)</h3>
                      <p className="text-xs text-slate-400">Population: 80 • Generations: 120 • Mutation: 2%</p>
                    </div>
                  </div>

                  <button
                    onClick={handleOptimizeRoute}
                    disabled={loadingOptimization || !selectionResult}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{loadingOptimization ? 'Running...' : 'Run GA'}</span>
                  </button>
                </div>

                {!optimizationResult ? (
                  <div className="py-12 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                    <RouteIcon className="w-8 h-8 opacity-30 text-purple-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-400">GA Route not optimized yet.</p>
                    <p className="text-[11px] text-slate-500">Select farms above and click &quot;Run GA&quot; to calculate shortest TSP loop.</p>
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in-scale">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                        <div className="text-slate-400 font-bold uppercase text-[10px]">Total Distance</div>
                        <div className="mt-1 text-2xl font-black text-white">
                          {optimizationResult.totalDistanceKm.toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                        </div>
                      </div>

                      <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                        <div className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                          <Fuel className="w-3 h-3 text-amber-400" /> Fuel Estimate
                        </div>
                        <div className="mt-1 text-2xl font-black text-amber-400">
                          {optimizationResult.estimatedFuelLitres.toFixed(2)} <span className="text-xs font-normal text-slate-400">L</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                      <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">GA Recommended Tour Sequence</span>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {optimizationResult.visitSequence.map((loc, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {idx > 0 && <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />}
                            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-purple-300 font-mono text-xs font-bold shadow whitespace-nowrap">
                              {loc.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exact / NN Result Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Nearest-Neighbour / Exact TSP</h3>
                      <p className="text-xs text-slate-400">Deterministic Nearest-Neighbour sequence algorithm</p>
                    </div>
                  </div>

                  <button
                    onClick={handleOptimizeSequence}
                    disabled={loadingSequence || !selectionResult}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{loadingSequence ? 'Running...' : 'Run NN'}</span>
                  </button>
                </div>

                {!sequenceResult ? (
                  <div className="py-12 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                    <RouteIcon className="w-8 h-8 opacity-30 text-indigo-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-400">NN Route not optimized yet.</p>
                    <p className="text-[11px] text-slate-500">Select farms above and click &quot;Run NN&quot; to calculate sequence.</p>
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in-scale">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                        <div className="text-slate-400 font-bold uppercase text-[10px]">Total Distance</div>
                        <div className="mt-1 text-2xl font-black text-white">
                          {sequenceResult.totalDistanceKm.toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                        </div>
                      </div>

                      <div className="glass-card p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                        <div className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                          <Fuel className="w-3 h-3 text-amber-400" /> Fuel Estimate
                        </div>
                        <div className="mt-1 text-2xl font-black text-amber-400">
                          {sequenceResult.estimatedFuelLitres.toFixed(2)} <span className="text-xs font-normal text-slate-400">L</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
                      <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">NN Recommended Tour Sequence</span>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {sequenceResult.visitSequence.map((loc, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {idx > 0 && <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />}
                            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-xs font-bold shadow whitespace-nowrap">
                              {loc.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Trade-Off Breakdown Chart */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Trade-Off Breakdown</span>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Acreage (ha) vs. Booking Revenue Score (£/100)
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Visual weighting reference across available database opportunities
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={farmChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="Acreage" fill="#34d399" radius={[6, 6, 0, 0]} name="Acreage (ha)" />
                <Bar dataKey="Value" fill="#c084fc" radius={[6, 6, 0, 0]} name="Value (£/100)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Manual Route Planner Modal */}
      {isManualRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 animate-fade-in-scale">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl shadow-cyan-600/20">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-6 sm:p-8 bg-slate-900/50">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Manual Route Planner</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Custom Depot Dispatcher & Manual Farm Plot Selection Engine</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsManualRouteModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white flex items-center justify-center transition-colors shadow"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Depot Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    Starting Depot
                  </label>
                  <select
                    value={startDepotId}
                    onChange={(e) => setStartDepotId(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-100 outline-none focus:border-cyan-500 transition-all"
                  >
                    {depots.map((depotItem) => (
                      <option key={depotItem.id} value={depotItem.id}>{depotItem.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Ending Depot
                  </label>
                  <select
                    value={endDepotId}
                    onChange={(e) => setEndDepotId(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-slate-100 outline-none focus:border-cyan-500 transition-all"
                  >
                    {depots.map((depotItem) => (
                      <option key={depotItem.id} value={depotItem.id}>{depotItem.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Farm Plot Selection Toolbar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Select Custom Farm Subset</span>
                    <span className="ml-2 text-xs text-cyan-400 font-mono font-bold">
                      {selectedManualFarms.length} of {availableFarms.length} Selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedManualFarms(availableFarms.map(f => f.id))}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
                    >
                      Select All Plots
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedManualFarms([])}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* 2-Column Farm Plot Grid */}
                <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableFarms.map((farm) => {
                    const isSelected = selectedManualFarms.includes(farm.id);

                    return (
                      <button
                        key={farm.id}
                        type="button"
                        onClick={() => toggleManualFarmSelection(farm.id)}
                        className={`w-full rounded-2xl border p-3.5 text-left transition-all flex items-center justify-between gap-3 ${isSelected
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-950'
                            }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{farm.name}</span>
                              <span className="text-[10px] text-purple-300 font-mono">#{farm.id}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">🌾 {farm.cropType}</div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs font-bold shrink-0">
                          <div className="text-emerald-400">{farm.acreageHa} ha</div>
                          <div className="text-purple-300">£{farm.bookingValue.toLocaleString()}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Algorithm Action Button Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">
                  {selectedManualFarms.length > 0 ? (
                    <span className="text-cyan-400 font-bold">Ready to sequence {selectedManualFarms.length} selected farm plots</span>
                  ) : (
                    <span>Pick farm plots above to calculate custom TSP route</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualRoutePlanning('GA')}
                    disabled={loadingSequence || !selectedManualFarms.length}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-3 rounded-2xl shadow-lg shadow-purple-600/20 transition-all hover:scale-105 text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Run GA Route 🧬</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleManualRoutePlanning('NN')}
                    disabled={loadingSequence || !selectedManualFarms.length}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-3 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Run Exact NN 🧭</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleManualRoutePlanning('BOTH')}
                    disabled={loadingSequence || !selectedManualFarms.length}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    <RouteIcon className="w-4 h-4" />
                    <span>Compare Both Engines ⚡</span>
                  </button>
                </div>
              </div>

              {/* Custom Route Calculation Results Container */}
              {(optimizationResult || sequenceResult) && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                    <span>Custom Route Calculation Outcome</span>
                    <span className="text-cyan-400 font-mono text-[11px]">Updated on GIS Map Canvas</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* GA Result Card in Modal */}
                    {optimizationResult && (
                      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-4 animate-fade-in-scale">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Genetic Algorithm (GA)</div>
                            <div className="mt-0.5 text-base font-black text-white">
                              {optimizationResult.startDepotName || 'Depot Hub'} → {optimizationResult.endDepotName || 'Depot Hub'}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                            GA Optimized
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                            <div className="text-slate-400 font-bold uppercase text-[9px]">Distance</div>
                            <div className="text-lg font-black text-white">
                              {optimizationResult.totalDistanceKm.toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                            <div className="text-slate-400 font-bold uppercase text-[9px]">Fuel Burn</div>
                            <div className="text-lg font-black text-amber-400">
                              {optimizationResult.estimatedFuelLitres.toFixed(2)} <span className="text-xs font-normal text-slate-400">L</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
                          <div className="text-[9px] font-extrabold uppercase text-purple-300">GA Tour Visit Order</div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {optimizationResult.visitSequence.map((loc, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                {idx > 0 && <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-purple-300 font-mono text-[11px] font-bold shadow whitespace-nowrap">
                                  {loc.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NN Result Card in Modal */}
                    {sequenceResult && (
                      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-4 animate-fade-in-scale">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">Nearest-Neighbour / Exact</div>
                            <div className="mt-0.5 text-base font-black text-white">
                              {sequenceResult.startDepotName || 'Depot Hub'} → {sequenceResult.endDepotName || 'Depot Hub'}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                            NN Sequence
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                            <div className="text-slate-400 font-bold uppercase text-[9px]">Distance</div>
                            <div className="text-lg font-black text-white">
                              {sequenceResult.totalDistanceKm.toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                            <div className="text-slate-400 font-bold uppercase text-[9px]">Fuel Burn</div>
                            <div className="text-lg font-black text-amber-400">
                              {sequenceResult.estimatedFuelLitres.toFixed(2)} <span className="text-xs font-normal text-slate-400">L</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
                          <div className="text-[9px] font-extrabold uppercase text-indigo-300">NN Tour Visit Order</div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {sequenceResult.visitSequence.map((loc, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                {idx > 0 && <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[11px] font-bold shadow whitespace-nowrap">
                                  {loc.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Location Preview Modal */}
      <MapViewModal
        isOpen={mapModal.isOpen}
        onClose={() => setMapModal(prev => ({ ...prev, isOpen: false }))}
        lat={mapModal.lat}
        lng={mapModal.lng}
        title={mapModal.title}
      />
    </div>
  );
}
