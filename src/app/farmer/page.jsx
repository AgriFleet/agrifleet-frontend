'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export default function FarmerPortal() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State with both property casings to guarantee backend compatibility
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
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to load bookings", err);
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
      alert('Machinery booking successfully submitted!');
    } catch (err) {
      alert('Error submitting booking: ' + (err.response?.data?.message || err.message));
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
                Farmer Portal & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Dispatch</span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
                Request heavy harvesters, monitor weather risk, and track active field service operations in real time.
              </p>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="group relative inline-flex items-center justify-center w-full lg:w-auto px-6 py-3.5 text-sm font-bold text-slate-950 bg-emerald-400 rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(52,211,153,0.3)]"
            >
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
              <span className="relative flex items-center gap-2">
                + Request New Harvester
              </span>
            </button>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Your Recent Booking Requests</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Total Bookings: {bookings.length}
            </span>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-sm font-medium animate-pulse">Syncing bookings from Port 8080...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Crop Type</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Acreage</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Time Window</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Farm Location</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {bookings.map((b) => {
                    const id = b.bookingId || b.booking_id;
                    const crop = b.cropType || b.crop_type;
                    const acreage = b.acreage;
                    const windowStart = b.requiredWindowStart || b.required_window_start;
                    const lat = b.farmLat !== undefined ? b.farmLat : b.farm_lat;
                    const lng = b.farmLng !== undefined ? b.farmLng : b.farm_lng;
                    const status = b.bookingStatus || b.booking_status;

                    return (
                      <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-700">#{id}</td>
                        <td className="py-4 px-5 font-medium text-slate-900">{crop}</td>
                        <td className="py-4 px-5 text-slate-600 font-semibold">{acreage} Acres</td>
                        <td className="py-4 px-5 text-slate-500 font-mono text-xs">{windowStart}</td>
                        <td className="py-4 px-5 font-mono text-xs">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 underline flex items-center gap-1 font-semibold"
                          >
                            <span>🗺️ View Farm Gate</span>
                          </a>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            status === 'CONFIRMED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        No active bookings found. Create your first request above!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Dialog */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 border border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">New Machinery Booking</h3>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors font-bold"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Crop Type</label>
                  <select 
                    value={form.crop_type} 
                    onChange={e => setForm({
                      ...form, 
                      crop_type: e.target.value,
                      cropType: e.target.value
                    })}
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  >
                    <option value="PADDY">Paddy (Rice)</option>
                    <option value="CORN">Corn</option>
                    <option value="WHEAT">Wheat</option>
                    <option value="SUGARCANE">Sugarcane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Field Acreage</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={form.acreage} 
                    onChange={e => setForm({...form, acreage: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Window Start</label>
                    <input 
                      type="datetime-local" 
                      value={form.required_window_start} 
                      onChange={e => setForm({
                        ...form, 
                        required_window_start: e.target.value,
                        requiredWindowStart: e.target.value
                      })}
                      className="w-full bg-slate-50/50 border border-slate-200/80 p-3 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Window End</label>
                    <input 
                      type="datetime-local" 
                      value={form.required_window_end} 
                      onChange={e => setForm({
                        ...form, 
                        required_window_end: e.target.value,
                        requiredWindowEnd: e.target.value
                      })}
                      className="w-full bg-slate-50/50 border border-slate-200/80 p-3 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all shadow-sm"
                    />
                  </div>
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
                    {isSubmitting ? 'Submitting...' : 'Confirm Request'}
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