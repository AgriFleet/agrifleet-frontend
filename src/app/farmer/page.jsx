'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import MapViewModal from '@/components/ui/MapViewModal';
import { 
  Sprout, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Layers, 
  Clock, 
  X, 
  Filter, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function FarmerPortal() {
  const { showSuccess, showError } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');

  // Map Modal State
  const [mapModal, setMapModal] = useState({ open: false, lat: 8.3350, lng: 80.4450, title: '' });

  // Form State with both property casings for 100% backend compatibility
  const [form, setForm] = useState({
    farmer_id: 1,
    farmerId: 1,
    farm_lat: 8.3350,
    farmLat: 8.3350,
    farm_lng: 80.4450,
    farmLng: 80.4450,
    acreage: 25.0,
    crop_type: 'PADDY',
    cropType: 'PADDY',
    required_window_start: '2026-09-01T07:30',
    requiredWindowStart: '2026-09-01T07:30',
    required_window_end: '2026-09-01T18:00',
    requiredWindowEnd: '2026-09-01T18:00'
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await api.core.getAllBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error("Failed to load bookings", err);
      showError("Could not sync bookings from Core Service (Port 8080)");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.core.createBooking(form);
      setShowModal(false);
      await loadBookings();
      showSuccess('🌾 Harvester booking request successfully submitted!');
    } catch (err) {
      showError('Booking failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMap = (lat, lng, crop, id) => {
    setMapModal({
      open: true,
      lat: lat !== undefined ? lat : 8.3350,
      lng: lng !== undefined ? lng : 80.4450,
      title: `Farm Plot #${id} (${crop})`
    });
  };

  const filteredBookings = bookings.filter((b) => {
    const crop = (b.cropType || b.crop_type || '').toUpperCase();
    const id = (b.bookingId || b.booking_id || '').toString();
    const matchesSearch = crop.includes(searchTerm.toUpperCase()) || id.includes(searchTerm);
    const matchesFilter = cropFilter === 'ALL' || crop === cropFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-black opacity-90" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Port 8080 • Core Service
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Farmer Booking & <span className="gradient-text-emerald">Dispatch Portal</span>
              </h1>
              <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                Submit heavy harvester requests, monitor plot service schedules, and inspect live field location coordinates.
              </p>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Request New Harvester</span>
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID or crop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            {['ALL', 'PADDY', 'CORN', 'WHEAT', 'SUGARCANE'].map((type) => (
              <button
                key={type}
                onClick={() => setCropFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  cropFilter === type
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Display Roster */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-500" />
              Active Booking Requests
            </h2>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Total: {filteredBookings.length}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-xs font-mono">Syncing bookings from Port 8080...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-500 opacity-40" />
              <p className="text-sm font-semibold">No bookings found</p>
              <p className="text-xs text-slate-500">Create a new harvester request using the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBookings.map((b) => {
                const id = b.bookingId || b.booking_id;
                const crop = b.cropType || b.crop_type;
                const acreage = b.acreage;
                const windowStart = b.requiredWindowStart || b.required_window_start;
                const lat = b.farmLat !== undefined ? b.farmLat : b.farm_lat;
                const lng = b.farmLng !== undefined ? b.farmLng : b.farm_lng;
                const status = b.bookingStatus || b.booking_status || 'PENDING';

                return (
                  <div 
                    key={id} 
                    className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 border border-slate-200 dark:border-slate-800 relative group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          Booking #{id}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          status === 'CONFIRMED' || status === 'ALLOCATED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {status}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          🌾 {crop}
                        </h3>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {acreage} Acres
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {windowStart ? windowStart.replace('T', ' ') : 'Flexible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => openMap(lat, lng, crop, id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/10 px-3 py-1.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/60"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Interactive Map</span>
                      </button>

                      <span className="text-[11px] font-mono text-slate-400">
                        {lat ? `${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}` : 'Depot Area'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Dialog for New Harvester Booking */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-extrabold tracking-tight">New Machinery Booking</h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Crop Type</label>
                  <select 
                    value={form.crop_type} 
                    onChange={e => setForm({
                      ...form, 
                      crop_type: e.target.value,
                      cropType: e.target.value
                    })}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="PADDY">Paddy (Rice)</option>
                    <option value="CORN">Corn</option>
                    <option value="WHEAT">Wheat</option>
                    <option value="SUGARCANE">Sugarcane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Field Acreage</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={form.acreage} 
                    onChange={e => setForm({...form, acreage: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Window Start</label>
                    <input 
                      type="datetime-local" 
                      value={form.required_window_start} 
                      onChange={e => setForm({
                        ...form, 
                        required_window_start: e.target.value,
                        requiredWindowStart: e.target.value
                      })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Window End</label>
                    <input 
                      type="datetime-local" 
                      value={form.required_window_end} 
                      onChange={e => setForm({
                        ...form, 
                        required_window_end: e.target.value,
                        requiredWindowEnd: e.target.value
                      })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
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
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm Request'}
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