'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { 
  Layers, 
  Zap, 
  Tractor, 
  Sprout, 
  Clock, 
  ArrowRight, 
  RefreshCw,
  Send,
  Edit3,
  X,
  Compass,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import MapViewModal from '@/components/ui/MapViewModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function AllocationPage() {
  const [batches, setBatches] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [activeBatch, setActiveBatch] = useState(null);
  const [activeAssignments, setActiveAssignments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Pagination states for Batch History
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // New states for editing/updating pending bookings modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    booking_id: '',
    bookingId: '',
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

  // Map Modal State for quick coordinate check
  const [mapModal, setMapModal] = useState({ open: false, lat: 8.3350, lng: 80.4450, title: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [batchesRes, vehiclesRes, bookingsRes] = await Promise.allSettled([
        api.allocation.getAllocationBatches(),
        api.core.getAllVehicles(),
        api.core.getAllBookings()
      ]);

      if (batchesRes.status === 'fulfilled') {
        setBatches(batchesRes.value.data || []);
        setCurrentPage(1); // Reset pagination on data refresh
      }
      if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value.data || []);
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data || []);
      
    } catch (err) {
      console.error('Failed to fetch allocation dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentsForBatch = async (batch) => {
    try {
      const batchId = batch.batchId || batch.batch_id || batch.id;
      const res = await api.allocation.getAllocatedAssignments(batchId);
      setActiveBatch(batch);
      setActiveAssignments(res.data || []);
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  const handleRunHungarianBatch = async () => {
    setIsRunning(true);
    setActiveBatch(null);
    try {
      const res = await api.allocation.runScheduledBatch({ batchType: 'SCHEDULED_BATCH' });
      await fetchDashboardData();
      await loadAssignmentsForBatch(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert('Batch execution failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunGreedy = async (e) => {
    e.preventDefault();
    if (!bookingIdInput) return;
    setIsRunning(true);
    setActiveBatch(null);
    try {
      const res = await api.allocation.runRealtimeGreedy(Number(bookingIdInput));
      await fetchDashboardData();
      await loadAssignmentsForBatch(res.data);
      setBookingIdInput('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert('Greedy allocation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleConfirmDispatch = async (assignmentId, bookingId, vehicleId) => {
    setProcessingId(assignmentId);
    try {
      // 1. Confirm assignment status in Task 2 (Port 8082)
      await api.allocation.confirmAssignment(assignmentId);
      
      // 2. Update booking status to 'ALLOCATED' in Core Service (Port 8080)
      await api.core.updateBookingStatus(bookingId, 'ALLOCATED');

      // 3. Update vehicle availability status to 'IN_USE' in Core Service (Port 8080)
      const vehicleToUpdate = vehicles.find(v => (v.vehicleId || v.vehicle_id) === vehicleId);
      if (vehicleToUpdate) {
        const payload = { 
          ...vehicleToUpdate, 
          availability_status: 'IN_USE', 
          availabilityStatus: 'IN_USE' 
        };
        await api.core.updateVehicle(vehicleId, payload);
      }
      
      await fetchDashboardData();
      if (activeBatch) {
        await loadAssignmentsForBatch(activeBatch);
      }
      alert(`🚜 Vehicle successfully dispatched! `);
    } catch (err) {
      alert('Dispatch failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  // Open edit modal for pending bookings
  const handleOpenEditBooking = (b) => {
    const id = b.bookingId || b.booking_id;
    const crop = b.cropType || b.crop_type || 'PADDY';
    const acreage = b.acreage || 25.0;
    const start = b.requiredWindowStart || b.required_window_start || '2026-09-01T07:30';
    const end = b.requiredWindowEnd || b.required_window_end || '2026-09-01T18:00';
    const lat = b.farmLat !== undefined ? b.farmLat : (b.farm_lat || 8.3350);
    const lng = b.farmLng !== undefined ? b.farmLng : (b.farm_lng || 80.4450);

    setEditForm({
      booking_id: id,
      bookingId: id,
      farmer_id: b.farmerId || b.farmer_id || 1,
      farmerId: b.farmerId || b.farmer_id || 1,
      farm_lat: lat,
      farmLat: lat,
      farm_lng: lng,
      farmLng: lng,
      acreage: acreage,
      crop_type: crop,
      cropType: crop,
      required_window_start: start,
      requiredWindowStart: start,
      required_window_end: end,
      requiredWindowEnd: end
    });
    setShowEditModal(true);
  };

  // Handle saving the updated pending booking via Core Service
  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const bookingId = editForm.booking_id || editForm.bookingId;
      await api.core.createBooking(editForm);
      setShowEditModal(false);
      await fetchDashboardData();
      alert(`🌾 Booking #${bookingId} successfully updated!`);
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUpdating(false);
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

  const availableBookingsForGreedy = bookings.filter(b => {
    const status = (b.bookingStatus || b.booking_status || '').toUpperCase();
    return status === 'PENDING';
  });

  const pendingBookings = availableBookingsForGreedy;
  const allocatedBookings = bookings.filter(b => {
    const s = (b.bookingStatus || b.booking_status || '').toUpperCase();
    return s === 'ALLOCATED' || s === 'DISPATCHED' || s === 'IN_PROGRESS';
  });
  const finishedBookings = bookings.filter(b => {
    const s = (b.bookingStatus || b.booking_status || '').toUpperCase();
    return s === 'FINISHED' || s === 'COMPLETED';
  });

  const availableVehicles = vehicles.filter(v => (v.availabilityStatus || v.availability_status) === 'AVAILABLE');
  const inUseVehicles = vehicles.filter(v => (v.availabilityStatus || v.availability_status) !== 'AVAILABLE');

  const demandData = [
    { name: 'Pending', value: pendingBookings.length, color: '#fbbf24' }, 
    { name: 'Allocated/Active', value: allocatedBookings.length, color: '#34d399' }, 
    { name: 'Finished', value: finishedBookings.length, color: '#38bdf8' }, 
  ];

  const fleetData = [
    { name: 'Available / In-Use', value: availableVehicles.length, color: '#34d399' }, 
    { name: 'Maintenance', value: inUseVehicles.length, color: '#f43f5e' }, 
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <p className="text-xs font-bold text-white mb-1">{payload[0].name}</p>
          <p className="text-sm font-mono font-black" style={{ color: payload[0].payload.color }}>
            {payload[0].value} Units
          </p>
        </div>
      );
    }
    return null;
  };

  const totalBatches = batches.length;
  const totalPages = Math.ceil(totalBatches / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalBatches);
  const currentBatches = batches.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-emerald-500/30">
      
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-black opacity-90" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Task 2 • Port 8082 Engine
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Resource Allocation & <span className="text-emerald-400">Dispatch</span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
                Hungarian algorithm batch scheduling and real-time greedy priority assignment for tractors and harvesters.
              </p>
            </div>
            
            <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700/80 backdrop-blur-sm text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fleet & Booking Context</div>
              <div className="text-sm font-extrabold text-emerald-400">
                 Vehicles vs Demands
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Demand Status Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
            <div className="w-1/2">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Demand Telemetry
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">Live distribution of farmer harvester booking statuses.</p>
              <div className="space-y-2">
                {demandData.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-1/2 h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {demandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
            <div className="w-1/2">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-2">
                <Tractor className="w-4 h-4 text-sky-400" /> Fleet Availability
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">Real-time status of connected heavy agricultural machinery.</p>
              <div className="space-y-2">
                {fleetData.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-1/2 h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {fleetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">Global Batch Matching</h2>
                  <p className="text-xs text-slate-400">O(N³) Hungarian Exact Algorithm</p>
                </div>
              </div>

              <button 
                onClick={handleRunHungarianBatch}
                disabled={isRunning || loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{isRunning && !bookingIdInput ? 'Processing Batch...' : 'Execute Hungarian Batch ⚡'}</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">Priority Real-Time Dispatch</h2>
                  <p className="text-xs text-slate-400">Greedy Min-Heap Assignment</p>
                </div>
              </div>

              <form onSubmit={handleRunGreedy} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Target Booking Request
                  </label>
                  <select 
                    value={bookingIdInput}
                    onChange={e => setBookingIdInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">Select an active pending booking...</option>
                    {availableBookingsForGreedy.map(b => {
                      const id = b.bookingId || b.booking_id;
                      const status = b.bookingStatus || b.booking_status;
                      return (
                        <option key={id} value={id} className="bg-slate-900 text-white">
                          Booking #{id} - {b.cropType || b.crop_type} ({b.acreage} acres) [{status}]
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={isRunning || !bookingIdInput}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <span>{isRunning && bookingIdInput ? 'Dispatching...' : 'Dispatch Nearest Vehicle'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl min-h-[420px] flex flex-col justify-between space-y-6 shadow-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  Allocation Output Visualizer
                </h2>
                {activeBatch && (
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                    (activeBatch.batchType || activeBatch.batch_type) === 'SCHEDULED_BATCH' 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                  }`}>
                    {(activeBatch.batchType || activeBatch.batch_type).replace('_', ' ')}
                  </span>
                )}
              </div>

              {activeBatch ? (
                <div className="space-y-6 flex-1">
                  {/* Metrics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matrix Dim.</span>
                      <span className="text-xl font-black text-white mt-1 block">
                        {activeBatch.matrixDimensions || activeBatch.matrix_dimensions}
                      </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Network Cost</span>
                      <span className="text-xl font-black text-emerald-400 mt-1 block">
                        {Number(activeBatch.totalNetworkCost || activeBatch.total_network_cost).toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                      </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compute Duration</span>
                      <span className="text-xl font-black text-sky-400 mt-1 block">
                        {activeBatch.executionTimeMs || activeBatch.execution_time_ms} <span className="text-xs font-normal text-slate-400">ms</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Matched Machinery & Job Pairings
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeAssignments.map(a => {
                        const aId = a.assignmentId || a.assignment_id;
                        const vId = a.vehicleId || a.vehicle_id;
                        const bId = a.bookingId || a.booking_id;
                        const status = a.assignmentStatus || a.assignment_status;
                        
                        const v = vehicles.find(veh => (veh.vehicleId || veh.vehicle_id) === vId);
                        const b = bookings.find(book => (book.bookingId || book.booking_id) === bId);
                        
                        const isDispatched = status === 'DISPATCHED';
                        const isProcessing = processingId === aId;

                        return (
                          <div 
                            key={aId} 
                            className={`p-4 rounded-2xl border ${
                              isDispatched 
                                ? 'border-emerald-500/40 bg-emerald-500/5' 
                                : 'border-slate-800 bg-slate-950'
                            } relative flex flex-col justify-between space-y-4 shadow-sm`}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-mono font-bold text-slate-400">Match #{aId}</span>
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                                  isDispatched 
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}>
                                  {status}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white">
                                  <Tractor className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Machinery</div>
                                  <div className="text-sm font-bold text-white">Vehicle #{vId}</div>
                                  <div className="text-xs text-slate-400">
                                    {v ? `${(v.vehicleType || v.vehicle_type).replace('_', ' ')} • ⭐ ${v.rating}` : 'Equipment Data'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pl-3">
                                <div className="w-0.5 h-5 bg-slate-800" />
                                <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                                  ↳ {Number(a.deadheadDistanceKm || a.deadhead_distance_km).toFixed(2)} km Transit
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                                  <Sprout className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Target Field Request</div>
                                  <div className="text-sm font-bold text-white">Booking #{bId}</div>
                                  <div className="text-xs text-slate-400">
                                    {b ? `${b.cropType || b.crop_type} • ${b.acreage} Acres` : 'Field Data'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {!isDispatched && (
                              <button
                                onClick={() => handleConfirmDispatch(aId, bId, vId)}
                                disabled={isProcessing}
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                              >
                                {isProcessing ? 'Dispatching...' : 'Approve & Dispatch Vehicle'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full flex-1 text-center border-2 border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950/40">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3 text-xl font-bold">
                    ⚡
                  </div>
                  <p className="text-sm font-bold text-white">No Allocation Data Loaded</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Execute a global Hungarian batch or trigger a greedy dispatch from the left controls.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Allocation Batches History & Pending Bookings Roster
            </h2>
            <button 
              onClick={fetchDashboardData} 
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Data</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Bookings Quick Edit Roster</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <th className="p-3.5">Booking ID</th>
                    <th className="p-3.5">Crop</th>
                    <th className="p-3.5">Acreage</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Edit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {bookings.filter(b => (b.bookingStatus || b.booking_status || 'PENDING').toUpperCase() === 'PENDING').map(b => {
                    const id = b.bookingId || b.booking_id;
                    const crop = b.cropType || b.crop_type;
                    const acreage = b.acreage;
                    const status = b.bookingStatus || b.booking_status || 'PENDING';
                    return (
                      <tr key={id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-emerald-400">#{id}</td>
                        <td className="p-3.5 font-bold text-white">{crop}</td>
                        <td className="p-3.5 text-slate-300">{acreage} Acres</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenEditBooking(b)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Edit Booking</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {bookings.filter(b => (b.bookingStatus || b.booking_status || 'PENDING').toUpperCase() === 'PENDING').length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-500">No pending bookings available for editing.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Algorithm Execution Logs</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <th className="p-3.5">Batch ID</th>
                    <th className="p-3.5">Algorithm</th>
                    <th className="p-3.5">Dimensions</th>
                    <th className="p-3.5">Total Cost</th>
                    <th className="p-3.5">Execution Speed</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {currentBatches.map(b => {
                    const id = b.batchId || b.batch_id || b.id;
                    const type = b.batchType || b.batch_type;
                    const dims = b.matrixDimensions || b.matrix_dimensions || 'N/A';
                    const cost = Number(b.totalNetworkCost || b.total_network_cost || 0).toFixed(2);
                    const time = b.executionTimeMs || b.execution_time_ms || 0;
                    const isActive = activeBatch && (activeBatch.batchId || activeBatch.batch_id || activeBatch.id) === id;

                    return (
                      <tr key={id} className={`transition-colors ${isActive ? 'bg-emerald-500/10' : 'hover:bg-slate-900/50'}`}>
                        <td className="p-3.5 font-mono font-bold text-emerald-400">#{id}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase border ${
                            type === 'SCHEDULED_BATCH' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          }`}>
                            {type === 'SCHEDULED_BATCH' ? 'Hungarian (Exact)' : 'Greedy (Heuristic)'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">{dims}</td>
                        <td className="p-3.5 font-bold text-white">{cost} km</td>
                        <td className="p-3.5 font-mono text-slate-400">{time} ms</td>
                        <td className="p-3.5 text-right">
                          <button 
                            onClick={() => {
                              loadAssignmentsForBatch(b);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isActive 
                                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                          >
                            {isActive ? 'Viewing' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {currentBatches.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-slate-500">No allocation batches recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalBatches > 0 && (
              <div className="flex justify-end items-center mt-4 gap-4 text-xs font-medium text-slate-400">
                <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg">
                  {startIndex + 1}–{endIndex} of {totalBatches}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                Edit Pending Booking #{editForm.booking_id || editForm.bookingId}
              </h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Crop Type</label>
                <select 
                  value={editForm.crop_type} 
                  onChange={e => setEditForm({
                    ...editForm, 
                    crop_type: e.target.value,
                    cropType: e.target.value
                  })}
                  className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="PADDY">Paddy (Rice)</option>
                  <option value="CORN">Corn</option>
                  <option value="WHEAT">Wheat</option>
                  <option value="SUGARCANE">Sugarcane</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Field Acreage</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={editForm.acreage} 
                  onChange={e => setEditForm({...editForm, acreage: parseFloat(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              {/* GPS Coordinates Selectors */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Farm Plot GPS Location Coordinates
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Latitude</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={editForm.farm_lat} 
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setEditForm({...editForm, farm_lat: val, farmLat: val});
                      }}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Longitude</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={editForm.farm_lng} 
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setEditForm({...editForm, farm_lng: val, farmLng: val});
                      }}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Window Start</label>
                  <input 
                    type="datetime-local" 
                    value={editForm.required_window_start} 
                    onChange={e => setEditForm({
                      ...editForm, 
                      required_window_start: e.target.value,
                      requiredWindowStart: e.target.value
                    })}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Window End</label>
                  <input 
                    type="datetime-local" 
                    value={editForm.required_window_end} 
                    onChange={e => setEditForm({
                      ...editForm, 
                      required_window_end: e.target.value,
                      requiredWindowEnd: e.target.value
                    })}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving Changes...' : 'Update Booking'}
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
  );
}