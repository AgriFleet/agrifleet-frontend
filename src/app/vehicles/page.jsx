'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State with both property casings to guarantee backend compatibility
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
      setVehicles(res.data);
    } catch (err) {
      console.error("Failed to load vehicles", err);
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
        alert('Vehicle updated successfully!');
      } else {
        await api.core.createVehicle(form);
        alert('New vehicle registered successfully!');
      }
      setShowModal(false);
      await loadVehicles();
    } catch (err) {
      alert('Error saving vehicle: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 pb-20 selection:bg-emerald-100">
      {/* Decorative Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-slate-400/10 blur-[100px]" />
      </div>

      <div className="relative z-10 space-y-8 max-w-[1400px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-slate-900/20 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-900 to-black opacity-80" />
          
          <div className="relative p-8 sm:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Port 8080 • Core Domain
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Machinery Fleet <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Management</span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
                Register new agricultural vehicles, update locations, and manage real-time operational availability statuses.
              </p>
            </div>
            
            <button 
              onClick={handleOpenNew}
              className="group relative inline-flex items-center justify-center w-full lg:w-auto px-6 py-3.5 text-sm font-bold text-slate-950 bg-emerald-400 rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(52,211,153,0.3)]"
            >
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
              <span className="relative flex items-center gap-2">
                + Register New Vehicle
              </span>
            </button>
          </div>
        </div>

        {/* Vehicle Data Table */}
        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Fleet Roster</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Total Units: {vehicles.length}
            </span>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-sm font-medium animate-pulse">Syncing fleet data from Port 8080...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Machinery Type</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">GPS Location</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Rating</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {vehicles.map((v) => {
                    const id = v.vehicleId || v.vehicle_id;
                    const type = v.vehicleType || v.vehicle_type;
                    const lat = v.currentLat !== undefined ? v.currentLat : v.current_lat;
                    const lng = v.currentLng !== undefined ? v.currentLng : v.current_lng;
                    const status = v.availabilityStatus || v.availability_status;
                    const rating = v.rating;

                    return (
                      <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-700">#{id}</td>
                        <td className="py-4 px-5 font-semibold text-slate-900">{type}</td>
                        <td className="py-4 px-5 font-mono text-xs">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 underline flex items-center gap-1 font-semibold"
                          >
                            <span>📍 {lat}, {lng}</span>
                          </a>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 
                            status === 'MAINTENANCE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-amber-500 font-bold">★ {rating}</td>
                        <td className="py-4 px-5 text-right">
                          <button 
                            onClick={() => handleOpenEdit(v)}
                            className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-semibold px-3.5 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Edit Unit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {vehicles.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        No vehicles found in the fleet database. Register your first unit above!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Insert / Update Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {isEditMode ? `Update Vehicle #${form.vehicle_id}` : 'Register New Vehicle'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors font-bold"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Machinery Type</label>
                  <select 
                    value={form.vehicle_type} 
                    onChange={e => setForm({
                      ...form, 
                      vehicle_type: e.target.value,
                      vehicleType: e.target.value
                    })}
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  >
                    <option value="COMBINE_HARVESTER">Combine Harvester</option>
                    <option value="TRACTOR">Heavy Tractor</option>
                    <option value="FORAGE_HARVESTER">Forage Harvester</option>
                    <option value="TRANSPORT_TRUCK">Transport Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Availability Status</label>
                  <select 
                    value={form.availability_status} 
                    onChange={e => setForm({
                      ...form, 
                      availability_status: e.target.value,
                      availabilityStatus: e.target.value
                    })}
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_USE">In Use (Dispatched)</option>
                    <option value="MAINTENANCE">In Maintenance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Latitude</label>
                    <input 
                      type="number" step="0.0001"
                      value={form.current_lat} 
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setForm({...form, current_lat: val, currentLat: val});
                      }}
                      className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Longitude</label>
                    <input 
                      type="number" step="0.0001"
                      value={form.current_lng} 
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setForm({...form, current_lng: val, currentLng: val});
                      }}
                      className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operator Rating (1.0 - 5.0)</label>
                  <input 
                    type="number" step="0.1" min="1" max="5"
                    value={form.rating} 
                    onChange={e => setForm({...form, rating: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Register Vehicle')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}