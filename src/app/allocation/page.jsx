'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

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

      if (batchesRes.status === 'fulfilled') setBatches(batchesRes.value.data);
      if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value.data);
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data);
      
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
      setActiveAssignments(res.data);
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
    } catch (err) {
      alert('Greedy allocation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  // NEW: Handle Confirm & Dispatch Action
  const handleConfirmDispatch = async (assignmentId, bookingId) => {
    setProcessingId(assignmentId);
    try {
      // 1. Confirm assignment in Task 2 (Port 8082)
      await api.allocation.confirmAssignment(assignmentId);
      
      // 2. Update booking status in Core Service (Port 8080)
      await api.core.updateBookingStatus(bookingId, 'ALLOCATED');
      
      // Refresh local data to show updated statuses
      await fetchDashboardData();
      await loadAssignmentsForBatch(activeBatch);
      alert(`Successfully dispatched vehicle for Booking #${bookingId}!`);
    } catch (err) {
      alert('Dispatch failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 pb-20 selection:bg-emerald-100">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-slate-400/10 blur-[100px]" />
      </div>

      <div className="relative z-10 space-y-8 max-w-[1400px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-slate-900/20 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80" />
          
          <div className="relative p-8 sm:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Port 8082 • Online
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Task 2: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Resource Allocation</span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
                Hungarian algorithm batch scheduling and real-time greedy priority assignment for tractors and harvesters.
              </p>
            </div>
            
            <div className="text-right bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700 backdrop-blur-sm">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fleet & Booking Context</div>
              <div className="text-sm font-bold text-emerald-400">
                {vehicles.length} Vehicles Available | {bookings.length} Pending Bookings
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Hungarian Batch Trigger */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shadow-inner">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Global Batch Routing</h2>
                  <p className="text-xs text-slate-500">O(N³) Hungarian Exact Matching</p>
                </div>
              </div>
              <button 
                onClick={handleRunHungarianBatch}
                disabled={isRunning || loading}
                className="w-full group relative inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold text-slate-950 bg-emerald-400 rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_4px_rgba(52,211,153,0.3)] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
                <span className="relative flex items-center gap-2">
                  {isRunning && !bookingIdInput ? 'Processing Batch...' : 'Execute Morning Shift Batch ⚡'}
                </span>
              </button>
            </div>

            {/* Greedy Dispatch Trigger */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-900 text-blue-400 rounded-lg shadow-inner">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Priority Real-Time Dispatch</h2>
                  <p className="text-xs text-slate-500">Greedy Min-Heap Assignment</p>
                </div>
              </div>
              <form onSubmit={handleRunGreedy} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Booking Request</label>
                  <select 
                    value={bookingIdInput}
                    onChange={e => setBookingIdInput(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm"
                  >
                    <option value="" disabled>Select an urgent booking...</option>
                    {bookings.map(b => {
                      const id = b.bookingId || b.booking_id;
                      const status = b.bookingStatus || b.booking_status;
                      return (
                        <option key={id} value={id}>
                          Booking #{id} - {b.cropType || b.crop_type} ({b.acreage} acres) [{status}]
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={isRunning || !bookingIdInput}
                  className="w-full group relative inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold text-white bg-slate-900 rounded-xl overflow-hidden transition-all hover:bg-slate-800 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative flex items-center gap-2">
                    {isRunning && bookingIdInput ? 'Dispatching...' : 'Dispatch Nearest Vehicle'}
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Results & Visualizer Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30 min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Allocation Output Visualizer</h2>
                {activeBatch && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    (activeBatch.batchType || activeBatch.batch_type) === 'SCHEDULED_BATCH' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {(activeBatch.batchType || activeBatch.batch_type).replace('_', ' ')}
                  </span>
                )}
              </div>

              {activeBatch ? (
                <div className="space-y-6 flex-1">
                  {/* Top Level Batch Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Matrix Dim.</span>
                      <span className="text-xl font-extrabold text-slate-900">{activeBatch.matrixDimensions || activeBatch.matrix_dimensions}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Deadhead Cost</span>
                      <span className="text-xl font-extrabold text-emerald-600">{Number(activeBatch.totalNetworkCost || activeBatch.total_network_cost).toFixed(2)} <span className="text-sm font-medium text-slate-500">km</span></span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Compute Time</span>
                      <span className="text-xl font-extrabold text-blue-600">{activeBatch.executionTimeMs || activeBatch.execution_time_ms} <span className="text-sm font-medium text-slate-500">ms</span></span>
                    </div>
                  </div>

                  {/* Individual Assignment Cards */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Matched Vehicle Assignments</h3>
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
                          <div key={aId} className={`bg-white border ${isDispatched ? 'border-emerald-300' : 'border-slate-200'} rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between`}>
                            <div>
                              <div className="absolute top-0 right-0 p-2">
                                <span className={`${isDispatched ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${isDispatched ? 'border-emerald-600' : 'border-slate-200'}`}>
                                  {status}
                                </span>
                              </div>
                              
                              <div className="flex flex-col gap-3 mt-1">
                                {/* Vehicle Side */}
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 w-8 h-8 min-w-[32px] rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">🚜</div>
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Machinery</div>
                                    <div className="text-sm font-bold text-slate-800">
                                      {v ? `Vehicle #${vId} (Owner #${v.ownerId || v.owner_id})` : `Vehicle #${vId}`}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                                      {v ? `${(v.vehicleType || v.vehicle_type).replace('_', ' ')} • ⭐ ${v.rating}` : 'Details Unavailable'}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Connector */}
                                <div className="flex items-center gap-2 pl-4">
                                  <div className="w-0.5 h-6 bg-slate-200"></div>
                                  <div className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                    ↳ {Number(a.deadheadDistanceKm || a.deadhead_distance_km).toFixed(2)} km Transit
                                  </div>
                                </div>

                                {/* Booking Side */}
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 w-8 h-8 min-w-[32px] rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">🌾</div>
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Job</div>
                                    <div className="text-sm font-bold text-slate-800">
                                      {b ? `Booking #${bId} (Farmer #${b.farmerId || b.farmer_id})` : `Booking #${bId}`}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                                      {b ? `${b.cropType || b.crop_type} • ${b.acreage} Acres` : 'Details Unavailable'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            {!isDispatched && (
                              <button
                                onClick={() => handleConfirmDispatch(aId, bId)}
                                disabled={isProcessing}
                                className="mt-5 w-full bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isProcessing ? 'Dispatching...' : 'Approve & Dispatch'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full flex-1 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 mt-4">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 mb-4 font-bold text-2xl">🔗</div>
                  <p className="text-sm font-bold text-slate-700">No Allocation Data Loaded</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                    Execute a global Hungarian batch or dispatch a greedy request from the controls to visualize optimal matching pairings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global History Table */}
        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Allocation Batches History</h2>
            <button onClick={fetchDashboardData} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors">
              ↻ Refresh Logs
            </button>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-sm font-medium animate-pulse">Syncing logs from Port 8082...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="py-4 px-5 text-[10px] font-extrabold uppercase tracking-widest">Batch ID</th>
                    <th className="py-4 px-5 text-[10px] font-extrabold uppercase tracking-widest">Algorithm Type</th>
                    <th className="py-4 px-5 text-[10px] font-extrabold uppercase tracking-widest">Dimensions</th>
                    <th className="py-4 px-5 text-[10px] font-extrabold uppercase tracking-widest">Total Cost</th>
                    <th className="py-4 px-5 text-[10px] font-extrabold uppercase tracking-widest">Exec Time</th>
                    <th className="py-4 px-5 text-[10px] font-extrabold uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {batches.map(b => {
                    const id = b.batchId || b.batch_id || b.id;
                    const type = b.batchType || b.batch_type;
                    const dims = b.matrixDimensions || b.matrix_dimensions || 'N/A';
                    const cost = Number(b.totalNetworkCost || b.total_network_cost || 0).toFixed(2);
                    const time = b.executionTimeMs || b.execution_time_ms || 0;
                    const isActive = activeBatch && (activeBatch.batchId || activeBatch.batch_id || activeBatch.id) === id;

                    return (
                      <tr key={id} className={`transition-colors ${isActive ? 'bg-emerald-50/50' : 'hover:bg-slate-50/80'}`}>
                        <td className="py-4 px-5 font-bold text-slate-700">#{id}</td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            type === 'SCHEDULED_BATCH' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {type === 'SCHEDULED_BATCH' ? 'Hungarian (Exact)' : 'Greedy (Heuristic)'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-600 font-mono text-xs font-medium bg-slate-50/50">{dims}</td>
                        <td className="py-4 px-5 text-slate-900 font-bold">{cost} <span className="text-xs text-slate-400 font-normal">km</span></td>
                        <td className="py-4 px-5 text-slate-500 font-mono text-xs">{time} ms</td>
                        <td className="py-4 px-5 text-right">
                          <button 
                            onClick={() => loadAssignmentsForBatch(b)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isActive 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            {isActive ? 'Viewing' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 text-sm bg-slate-50/50">
                        No allocation batches recorded in the database. 
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}