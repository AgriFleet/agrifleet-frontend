'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import MapViewModal from '@/components/ui/MapViewModal';
import { 
  Sprout, 
  Plus, 
  Search, 
  MapPin, 
  Layers, 
  Clock, 
  X, 
  Filter, 
  CheckCircle2,
  AlertCircle,
  Compass,
  Tractor,
  Flag,
  Edit3,
  Trash2
} from 'lucide-react';

export default function FarmerPortal() {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Edit Pending Booking Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Fetch bookings and vehicles from Core Service (Port 8080)
      const [bookingsRes, vehiclesRes] = await Promise.allSettled([
        api.core.getAllBookings(),
        api.core.getAllVehicles()
      ]);

      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data || []);
      if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value.data || []);

      // 2. Fetch allocation assignments from Port 8082 to link vehicles to bookings
      try {
        const batchesRes = await api.allocation.getAllocationBatches();
        const batches = batchesRes.data || [];
        
        let allAssignments = [];
        for (const batch of batches) {
          const batchId = batch.batchId || batch.batch_id || batch.id;
          const assignRes = await api.allocation.getAllocatedAssignments(batchId);
          if (assignRes.data) {
            allAssignments = [...allAssignments, ...assignRes.data];
          }
        }
        setAssignments(allAssignments);
      } catch (allocErr) {
        console.error("Failed to load allocation assignments from Port 8082", allocErr);
      }

    } catch (err) {
      console.error("Failed to load portal data", err);
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
      await loadData();
      alert('🌾 Harvester booking request successfully submitted to Core Service (Port 8080)!');
    } catch (err) {
      alert('Booking failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      // 1. Update booking status in Core Service (Port 8080)
      await api.core.updateBookingStatus(bookingId, newStatus);

      // 2. If status is FINISHED or COMPLETED, free up the assigned vehicle back to AVAILABLE
      if (newStatus === 'FINISHED' || newStatus === 'COMPLETED') {
        const assignedVehicleId = getAssignedVehicleId(bookingId);
        if (assignedVehicleId) {
          const vehicleToUpdate = vehicles.find(v => Number(v.vehicleId || v.vehicle_id) === Number(assignedVehicleId));
          if (vehicleToUpdate) {
            const payload = {
              ...vehicleToUpdate,
              availability_status: 'AVAILABLE',
              availabilityStatus: 'AVAILABLE'
            };
            await api.core.updateVehicle(assignedVehicleId, payload);
          }
        }
      }

      await loadData();
      alert(`Booking #${bookingId} status updated to ${newStatus}! Vehicle status freed to AVAILABLE.`);
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
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
    setIsUpdatingBooking(true);
    try {
      const bookingId = editForm.booking_id || editForm.bookingId;
      await api.core.createBooking(editForm);
      setShowEditModal(false);
      await loadData();
      alert(`🌾 Booking #${bookingId} successfully updated!`);
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUpdatingBooking(false);
    }
  };

  // Handle deleting a pending booking
  const handleDeleteBooking = async (bookingId) => {
    if (!confirm(`Are you sure you want to delete Booking #${bookingId}?`)) return;
    try {
      await api.core.deleteBooking(bookingId);
      setShowEditModal(false); // Close modal if open
      await loadData();
      alert(`🗑️ Booking #${bookingId} successfully deleted!`);
    } catch (err) {
      alert('Deletion failed: ' + (err.response?.data?.message || err.message));
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

  // Helper to find allocated vehicle ID for a given booking ID
  const getAssignedVehicleId = (bookingId) => {
    const match = assignments.find(a => Number(a.bookingId || a.booking_id) === Number(bookingId));
    if (match) {
      return match.vehicleId || match.vehicle_id;
    }
    return null;
  };

  // Separate bookings into 3 sections: Pending, Active/Allocated, and Finished
  const pendingBookings = filteredBookings.filter(b => {
    const status = (b.bookingStatus || b.booking_status || 'PENDING').toUpperCase();
    return status === 'PENDING';
  });

  const allocatedBookings = filteredBookings.filter(b => {
    const status = (b.bookingStatus || b.booking_status || 'PENDING').toUpperCase();
    return status === 'ALLOCATED' || status === 'DISPATCHED' || status === 'IN_PROGRESS';
  });

  const finishedBookings = filteredBookings.filter(b => {
    const status = (b.bookingStatus || b.booking_status || 'PENDING').toUpperCase();
    return status === 'FINISHED' || status === 'COMPLETED';
  });

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
                Port 8080 & Port 8082 • Integrated Services
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Farmer Booking & <span className="text-emerald-400">Dispatch Portal</span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
                Submit heavy harvester requests with GPS coordinates, monitor plot service windows, and inspect assigned machinery and live field maps.
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
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID or crop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white outline-none focus:border-emerald-500 transition-all"
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
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Display List View */}
        <div className="space-y-8">
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 p-16 rounded-3xl flex flex-col items-center justify-center text-slate-400 space-y-3 shadow-xl">
              <div className="w-8 h-8 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-xs font-mono">Syncing bookings and assignments...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 py-16 text-center text-slate-400 space-y-3 rounded-3xl shadow-xl">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-600 opacity-40" />
              <p className="text-sm font-semibold text-slate-300">No bookings found</p>
              <p className="text-xs text-slate-500">Create a new harvester request using the button above.</p>
            </div>
          ) : (
            <>
              {/* 1. PENDING SECTION (TOP) */}
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Pending Booking Requests
                  </h2>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    Count: {pendingBookings.length}
                  </span>
                </div>

                {pendingBookings.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No pending bookings matching the current filters.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                          <th className="p-4">Booking ID</th>
                          <th className="p-4">Crop Type</th>
                          <th className="p-4">Acreage</th>
                          <th className="p-4">Service Period (Start → End)</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-medium">
                        {pendingBookings.map((b) => {
                          const id = b.bookingId || b.booking_id;
                          const crop = b.cropType || b.crop_type;
                          const acreage = b.acreage;
                          const start = b.requiredWindowStart || b.required_window_start;
                          const end = b.requiredWindowEnd || b.required_window_end;
                          const lat = b.farmLat !== undefined ? b.farmLat : b.farm_lat;
                          const lng = b.farmLng !== undefined ? b.farmLng : b.farm_lng;
                          const status = b.bookingStatus || b.booking_status || 'PENDING';

                          return (
                            <tr key={id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-emerald-400">#{id}</td>
                              <td className="p-4 font-bold text-white flex items-center gap-1.5">
                                <Sprout className="w-4 h-4 text-emerald-400" /> {crop}
                              </td>
                              <td className="p-4 text-slate-300">{acreage} Acres</td>
                              <td className="p-4 font-mono text-slate-300">
                                {start ? start.replace('T', ' ') : 'N/A'} <span className="text-emerald-400 font-bold">→</span> {end ? end.replace('T', ' ') : 'N/A'}
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-amber-500/15 text-amber-400 border-amber-500/30">
                                  {status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => handleOpenEditBooking(b)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors border border-slate-700"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => openMap(lat, lng, crop, id)}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-emerald-500/10 px-3 py-1.5 rounded-xl transition-colors border border-slate-800"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Map</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 2. ALLOCATED & DISPATCHED SECTION (MIDDLE) */}
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Allocated & Dispatched Bookings
                  </h2>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    Count: {allocatedBookings.length}
                  </span>
                </div>

                {allocatedBookings.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No allocated or dispatched bookings matching the current filters.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                          <th className="p-4">Booking ID</th>
                          <th className="p-4">Crop Type</th>
                          <th className="p-4">Acreage</th>
                          <th className="p-4">Assigned Vehicle</th>
                          <th className="p-4">Service Period (Start → End)</th>
                          <th className="p-4">Status & Update</th>
                          <th className="p-4 text-right">Map Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-medium">
                        {allocatedBookings.map((b) => {
                          const id = b.bookingId || b.booking_id;
                          const crop = b.cropType || b.crop_type;
                          const acreage = b.acreage;
                          const start = b.requiredWindowStart || b.required_window_start;
                          const end = b.requiredWindowEnd || b.required_window_end;
                          const lat = b.farmLat !== undefined ? b.farmLat : b.farm_lat;
                          const lng = b.farmLng !== undefined ? b.farmLng : b.farm_lng;
                          const status = (b.bookingStatus || b.booking_status || 'ALLOCATED').toUpperCase();
                          const isUpdating = updatingId === id;
                          const assignedVehicleId = getAssignedVehicleId(id);

                          return (
                            <tr key={id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-emerald-400">#{id}</td>
                              <td className="p-4 font-bold text-white flex items-center gap-1.5">
                                <Sprout className="w-4 h-4 text-emerald-400" /> {crop}
                              </td>
                              <td className="p-4 text-slate-300">{acreage} Acres</td>
                              <td className="p-4">
                                {assignedVehicleId ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-emerald-400">
                                    <Tractor className="w-3.5 h-3.5 text-emerald-400" />
                                    Vehicle #{assignedVehicleId}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">Not Assigned</span>
                                )}
                              </td>
                              <td className="p-4 font-mono text-slate-300">
                                {start ? start.replace('T', ' ') : 'N/A'} <span className="text-emerald-400 font-bold">→</span> {end ? end.replace('T', ' ') : 'N/A'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    disabled={isUpdating}
                                    value={status}
                                    onChange={(e) => handleStatusChange(id, e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 py-1.5 px-2.5 rounded-xl outline-none focus:border-emerald-500 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <option value="ALLOCATED">ALLOCATED</option>
                                    <option value="DISPATCHED">DISPATCHED</option>
                                    <option value="IN_PROGRESS">IN PROGRESS</option>
                                    <option value="FINISHED">FINISHED</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                  </select>
                                  {isUpdating && <span className="text-[10px] text-slate-400 animate-pulse">Saving...</span>}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => openMap(lat, lng, crop, id)}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-emerald-500/10 px-3 py-1.5 rounded-xl transition-colors border border-slate-800"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>View Map</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. FINISHED / COMPLETED SECTION (BOTTOM) */}
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Flag className="w-5 h-5 text-sky-400" />
                    Finished / Completed Bookings
                  </h2>
                  <span className="text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
                    Count: {finishedBookings.length}
                  </span>
                </div>

                {finishedBookings.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No finished or completed bookings yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                          <th className="p-4">Booking ID</th>
                          <th className="p-4">Crop Type</th>
                          <th className="p-4">Acreage</th>
                          <th className="p-4">Assigned Vehicle</th>
                          <th className="p-4">Service Period (Start → End)</th>
                          <th className="p-4">Status & Update</th>
                          <th className="p-4 text-right">Map Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-medium">
                        {finishedBookings.map((b) => {
                          const id = b.bookingId || b.booking_id;
                          const crop = b.cropType || b.crop_type;
                          const acreage = b.acreage;
                          const start = b.requiredWindowStart || b.required_window_start;
                          const end = b.requiredWindowEnd || b.required_window_end;
                          const lat = b.farmLat !== undefined ? b.farmLat : b.farm_lat;
                          const lng = b.farmLng !== undefined ? b.farmLng : b.farm_lng;
                          const status = (b.bookingStatus || b.booking_status || 'FINISHED').toUpperCase();
                          const isUpdating = updatingId === id;
                          const assignedVehicleId = getAssignedVehicleId(id);

                          return (
                            <tr key={id} className="hover:bg-slate-900/50 transition-colors opacity-80">
                              <td className="p-4 font-mono font-bold text-sky-400">#{id}</td>
                              <td className="p-4 font-bold text-white flex items-center gap-1.5">
                                <Sprout className="w-4 h-4 text-sky-400" /> {crop}
                              </td>
                              <td className="p-4 text-slate-300">{acreage} Acres</td>
                              <td className="p-4">
                                {assignedVehicleId ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300">
                                    <Tractor className="w-3.5 h-3.5 text-slate-400" />
                                    Vehicle #{assignedVehicleId} (Available)
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">Released</span>
                                )}
                              </td>
                              <td className="p-4 font-mono text-slate-300">
                                {start ? start.replace('T', ' ') : 'N/A'} <span className="text-sky-400 font-bold">→</span> {end ? end.replace('T', ' ') : 'N/A'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <select
                                    disabled={isUpdating}
                                    value={status}
                                    onChange={(e) => handleStatusChange(id, e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-sky-400 py-1.5 px-2.5 rounded-xl outline-none focus:border-sky-500 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <option value="ALLOCATED">ALLOCATED</option>
                                    <option value="DISPATCHED">DISPATCHED</option>
                                    <option value="IN_PROGRESS">IN PROGRESS</option>
                                    <option value="FINISHED">FINISHED</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                  </select>
                                  {isUpdating && <span className="text-[10px] text-slate-400 animate-pulse">Saving...</span>}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => openMap(lat, lng, crop, id)}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-sky-400 bg-slate-900 hover:bg-sky-500/10 px-3 py-1.5 rounded-xl transition-colors border border-slate-800"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                                  <span>View Map</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Dialog for New Harvester Booking with Location Selectors */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-400" />
                  New Machinery Booking & Location
                </h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Crop Type</label>
                  <select 
                    value={form.crop_type} 
                    onChange={e => setForm({
                      ...form, 
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
                    value={form.acreage} 
                    onChange={e => setForm({...form, acreage: parseFloat(e.target.value)})}
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
                        value={form.farm_lat} 
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setForm({...form, farm_lat: val, farmLat: val});
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
                        value={form.farm_lng} 
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setForm({...form, farm_lng: val, farmLng: val});
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
                      value={form.required_window_start} 
                      onChange={e => setForm({
                        ...form, 
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
                      value={form.required_window_end} 
                      onChange={e => setForm({
                        ...form, 
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
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
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

        {/* Edit Pending Booking Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-400" />
                  Edit Pending Booking #{editForm.booking_id || editForm.bookingId}
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleDeleteBooking(editForm.booking_id || editForm.bookingId)}
                    className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 transition-colors"
                    title="Delete Booking"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowEditModal(false)} 
                    className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
                    disabled={isUpdatingBooking}
                    className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isUpdatingBooking ? 'Saving Changes...' : 'Update Booking'}
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