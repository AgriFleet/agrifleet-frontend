'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import MapViewModal from '@/components/ui/MapViewModal';
import { 
  Tractor, 
  Plus, 
  Search, 
  MapPin, 
  Star, 
  Edit3, 
  X, 
  Filter, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';

export default function VehicleManagementPage() {
  const { showSuccess, showError } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Mode: 'grid' or 'table'
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Map Modal State
  const [mapModal, setMapModal] = useState({ open: false, lat: 8.3114, lng: 80.4037, title: '' });

  // Form State with both property casings for 100% backend compatibility
  const [form, setForm] = useState({
    vehicle_type: 'COMBINE_HARVESTER',
    vehicleType: 'COMBINE_HARVESTER',
    availability_status: 'AVAILABLE',
    availabilityStatus: 'AVAILABLE',
    current_lat: 8.3114,
    currentLat: 8.3114,
    current_lng: 80.4037,
    currentLng: 80.4037,
    rating: 5.0
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await api.core.getAllVehicles();
      setVehicles(res.data || []);
    } catch (err) {
      console.error("Failed to load vehicles", err);
      showError("Could not sync vehicles from Core Service (Port 8080)");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setIsEditMode(false);
    setForm({
      vehicle_type: 'COMBINE_HARVESTER',
      vehicleType: 'COMBINE_HARVESTER',
      availability_status: 'AVAILABLE',
      availabilityStatus: 'AVAILABLE',
      current_lat: 8.3114,
      currentLat: 8.3114,
      current_lng: 80.4037,
      currentLng: 80.4037,
      rating: 5.0
    });
    setShowModal(true);
  };

  const handleOpenEdit = (vehicle) => {
    setIsEditMode(true);
    const vType = vehicle.vehicleType || vehicle.vehicle_type || 'COMBINE_HARVESTER';
    const vStatus = vehicle.availabilityStatus || vehicle.availability_status || 'AVAILABLE';
    const vLat = vehicle.currentLat !== undefined ? vehicle.currentLat : vehicle.current_lat;
    const vLng = vehicle.currentLng !== undefined ? vehicle.currentLng : vehicle.current_lng;
    const vRating = vehicle.rating !== undefined ? vehicle.rating : 5.0;

    setForm({ 
      vehicle_id: vehicle.vehicleId || vehicle.vehicle_id,
      vehicle_type: vType,
      vehicleType: vType,
      availability_status: vStatus,
      availabilityStatus: vStatus,
      current_lat: vLat,
      currentLat: vLat,
      current_lng: vLng,
      currentLng: vLng,
      rating: vRating
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await api.core.updateVehicle(form.vehicle_id, form);
        showSuccess(`🚜 Vehicle #${form.vehicle_id} updated successfully!`);
      } else {
        await api.core.createVehicle(form);
        showSuccess('🚜 New agricultural vehicle registered successfully!');
      }
      setShowModal(false);
      await loadVehicles();
    } catch (err) {
      showError('Error saving vehicle: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMap = (lat, lng, type, id) => {
    setMapModal({
      open: true,
      lat: lat !== undefined ? lat : 8.3114,
      lng: lng !== undefined ? lng : 80.4037,
      title: `Vehicle #${id} - ${type.replace('_', ' ')}`
    });
  };

  const filteredVehicles = vehicles.filter((v) => {
    const type = (v.vehicleType || v.vehicle_type || '').toUpperCase();
    const id = (v.vehicleId || v.vehicle_id || '').toString();
    const status = (v.availabilityStatus || v.availability_status || '').toUpperCase();
    
    const matchesSearch = type.includes(searchTerm.toUpperCase()) || id.includes(searchTerm);
    const matchesFilter = statusFilter === 'ALL' || status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // Separate into Available (top section) and In Use/Other (bottom section)
  const availableVehicles = filteredVehicles.filter((v) => {
    const status = (v.availabilityStatus || v.availability_status || '').toUpperCase();
    return status === 'AVAILABLE';
  });

  const otherVehicles = filteredVehicles.filter((v) => {
    const status = (v.availabilityStatus || v.availability_status || '').toUpperCase();
    return status !== 'AVAILABLE';
  });

  const renderVehicleCard = (v) => {
    const id = v.vehicleId || v.vehicle_id;
    const type = v.vehicleType || v.vehicle_type || 'COMBINE_HARVESTER';
    const lat = v.currentLat !== undefined ? v.currentLat : v.current_lat;
    const lng = v.currentLng !== undefined ? v.currentLng : v.current_lng;
    const status = v.availabilityStatus || v.availability_status || 'AVAILABLE';
    const rating = v.rating || 5.0;

    return (
      <div 
        key={id} 
        className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 border border-slate-200 dark:border-slate-800 relative group"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              Unit #{id}
            </span>

            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              status === 'AVAILABLE'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : status === 'MAINTENANCE'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
            }`}>
              <CheckCircle2 className="w-3 h-3" />
              {status.replace('_', ' ')}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              🚜 {type.replace('_', ' ')}
            </h3>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-amber-400 gap-1 text-xs font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-md border border-amber-400/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {rating} / 5.0
              </div>
              <span className="text-xs text-slate-400">Operator Rating</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => openMap(lat, lng, type, id)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-500/10 px-3 py-1.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/60"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            <span>GPS Map</span>
          </button>

          <button
            onClick={() => handleOpenEdit(v)}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-900 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    );
  };

  const renderVehicleRow = (v) => {
    const id = v.vehicleId || v.vehicle_id;
    const type = v.vehicleType || v.vehicle_type;
    const lat = v.currentLat !== undefined ? v.currentLat : v.current_lat;
    const lng = v.currentLng !== undefined ? v.currentLng : v.current_lng;
    const status = v.availabilityStatus || v.availability_status;
    const rating = v.rating;

    return (
      <tr key={id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
        <td className="py-3.5 px-4 font-mono font-bold text-blue-500">#{id}</td>
        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{type}</td>
        <td className="py-3.5 px-4">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
            status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500' :
            status === 'MAINTENANCE' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'
          }`}>
            {status}
          </span>
        </td>
        <td className="py-3.5 px-4 text-amber-400 font-bold">★ {rating}</td>
        <td className="py-3.5 px-4 font-mono">
          <button
            onClick={() => openMap(lat, lng, type, id)}
            className="text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <MapPin className="w-3 h-3" />
            {lat}, {lng}
          </button>
        </td>
        <td className="py-3.5 px-4 text-right">
          <button
            onClick={() => handleOpenEdit(v)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
          >
            Edit
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/60 via-slate-900 to-black opacity-90" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Port 8080 • Core Service
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Agricultural Fleet <span className="gradient-text-cyan">Roster Management</span>
              </h1>
              <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                Register harvesters, update real-time GPS telemetry, and manage equipment operational statuses.
              </p>
            </div>
            
            <button 
              onClick={handleOpenNew}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Register New Vehicle</span>
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
              {['ALL', 'AVAILABLE', 'IN_USE', 'MAINTENANCE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' : 'text-slate-400'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' : 'text-slate-400'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Vehicle Content Display Sections */}
        <div className="space-y-8">
          {loading ? (
            <div className="glass-panel p-16 rounded-3xl flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-xs font-mono">Syncing fleet telemetry from Port 8080...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="glass-panel py-16 text-center text-slate-400 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Tractor className="w-10 h-10 mx-auto text-slate-500 opacity-40" />
              <p className="text-sm font-semibold">No machinery registered</p>
              <p className="text-xs text-slate-500">Register your first vehicle using the button above.</p>
            </div>
          ) : (
            <>
              {/* AVAILABLE VEHICLES SECTION (TOP) */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Available Vehicles
                  </h2>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    Count: {availableVehicles.length}
                  </span>
                </div>

                {availableVehicles.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No available vehicles match the current filter/search criteria.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {availableVehicles.map(renderVehicleCard)}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold">
                          <th className="py-3.5 px-4">ID</th>
                          <th className="py-3.5 px-4">Machinery Type</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Rating</th>
                          <th className="py-3.5 px-4">GPS Location</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {availableVehicles.map(renderVehicleRow)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* IN USE & MAINTENANCE / OTHER VEHICLES SECTION (BOTTOM) */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-500" />
                    In Use & Maintenance Vehicles
                  </h2>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                    Count: {otherVehicles.length}
                  </span>
                </div>

                {otherVehicles.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No vehicles currently in use or under maintenance.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {otherVehicles.map(renderVehicleCard)}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold">
                          <th className="py-3.5 px-4">ID</th>
                          <th className="py-3.5 px-4">Machinery Type</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Rating</th>
                          <th className="py-3.5 px-4">GPS Location</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {otherVehicles.map(renderVehicleRow)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Form for Create / Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-extrabold tracking-tight">
                  {isEditMode ? `Update Vehicle #${form.vehicle_id}` : 'Register New Machinery'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Machinery Type</label>
                  <select 
                    value={form.vehicle_type} 
                    onChange={e => setForm({
                      ...form, 
                      vehicle_type: e.target.value,
                      vehicleType: e.target.value
                    })}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="COMBINE_HARVESTER">Combine Harvester</option>
                    <option value="TRACTOR">Heavy Tractor</option>
                    <option value="FORAGE_HARVESTER">Forage Harvester</option>
                    <option value="TRANSPORT_TRUCK">Transport Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Availability Status</label>
                  <select 
                    value={form.availability_status} 
                    onChange={e => setForm({
                      ...form, 
                      availability_status: e.target.value,
                      availabilityStatus: e.target.value
                    })}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_USE">In Use (Dispatched)</option>
                    <option value="MAINTENANCE">In Maintenance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Latitude</label>
                    <input 
                      type="number" step="0.0001"
                      value={form.current_lat} 
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setForm({...form, current_lat: val, currentLat: val});
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Longitude</label>
                    <input 
                      type="number" step="0.0001"
                      value={form.current_lng} 
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setForm({...form, current_lng: val, currentLng: val});
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Operator Rating (1.0 - 5.0)</label>
                  <input 
                    type="number" step="0.1" min="1" max="5"
                    value={form.rating} 
                    onChange={e => setForm({...form, rating: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Register Vehicle')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Map View Modal */}
        <MapViewModal
          isOpen={mapModal.open}
          onClose={() => setMapModal({ ...mapModal, open: false })}
          lat={mapModal.lat}
          lng={mapModal.lng}
          title={mapModal.title}
        />

      </div>
    </div>
  );
}