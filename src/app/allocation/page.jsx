'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { 
  Layers, 
  Zap, 
  CheckCircle2, 
  Tractor, 
  Sprout, 
  Clock, 
  Cpu, 
  ArrowRight, 
  RefreshCw,
  Send
} from 'lucide-react';

export default function AllocationPage() {
  const { showSuccess, showError } = useToast();
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

      if (batchesRes.status === 'fulfilled') setBatches(batchesRes.value.data || []);
      if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value.data || []);
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data || []);
      
    } catch (err) {
      console.error('Failed to fetch allocation dashboard data', err);
      showError('Failed to sync allocation data from Port 8082');
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
      showError('Could not load batch assignments');
    }
  };

  const handleRunHungarianBatch = async () => {
    setIsRunning(true);
    setActiveBatch(null);
    try {
      const res = await api.allocation.runScheduledBatch({ batchType: 'SCHEDULED_BATCH' });
      await fetchDashboardData();
      await loadAssignmentsForBatch(res.data);
      showSuccess('⚡ Global Hungarian batch allocation completed!');
    } catch (err) {
      showError('Batch execution failed: ' + (err.response?.data?.message || err.message));
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
      showSuccess(`⚡ Priority greedy allocation dispatched for Booking #${bookingIdInput}!`);
      setBookingIdInput('');
    } catch (err) {
      showError('Greedy allocation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleConfirmDispatch = async (assignmentId, bookingId) => {
    setProcessingId(assignmentId);
    try {
      await api.allocation.confirmAssignment(assignmentId);
      await api.core.updateBookingStatus(bookingId, 'ALLOCATED');
      
      await fetchDashboardData();
      await loadAssignmentsForBatch(activeBatch);
      showSuccess(`🚜 Vehicle dispatched successfully for Booking #${bookingId}!`);
    } catch (err) {
      showError('Dispatch failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/60 via-slate-900 to-black opacity-90" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                Task 2 • Port 8082 Engine
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Resource Allocation & <span className="gradient-text-emerald">Dispatch</span>
              </h1>
              <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                Hungarian algorithm batch scheduling and real-time greedy priority assignment for tractors and harvesters.
              </p>
            </div>
            
            <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700/80 backdrop-blur-sm text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fleet & Booking Context</div>
              <div className="text-sm font-extrabold text-teal-400">
                {vehicles.length} Vehicles | {bookings.length} Demands
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column */}
          <div className="space-y-6">
            
            {/* Hungarian Batch Trigger */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Global Batch Matching</h2>
                  <p className="text-xs text-slate-500">O(N³) Hungarian Exact Algorithm</p>
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

            {/* Greedy Real-Time Trigger */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Priority Real-Time Dispatch</h2>
                  <p className="text-xs text-slate-500">Greedy Min-Heap Assignment</p>
                </div>
              </div>

              <form onSubmit={handleRunGreedy} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Target Booking Request
                  </label>
                  <select 
                    value={bookingIdInput}
                    onChange={e => setBookingIdInput(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
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
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-3.5 rounded-2xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  <span>{isRunning && bookingIdInput ? 'Dispatching...' : 'Dispatch Nearest Vehicle'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl min-h-[420px] flex flex-col justify-between space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" />
                  Allocation Output Visualizer
                </h2>
                {activeBatch && (
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                    (activeBatch.batchType || activeBatch.batch_type) === 'SCHEDULED_BATCH' 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                      : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                  }`}>
                    {(activeBatch.batchType || activeBatch.batch_type).replace('_', ' ')}
                  </span>
                )}
              </div>

              {activeBatch ? (
                <div className="space-y-6 flex-1">
                  {/* Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matrix Dim.</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                        {activeBatch.matrixDimensions || activeBatch.matrix_dimensions}
                      </span>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Network Cost</span>
                      <span className="text-xl font-black text-emerald-500 mt-1 block">
                        {Number(activeBatch.totalNetworkCost || activeBatch.total_network_cost).toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                      </span>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compute Duration</span>
                      <span className="text-xl font-black text-sky-500 mt-1 block">
                        {activeBatch.executionTimeMs || activeBatch.execution_time_ms} <span className="text-xs font-normal text-slate-400">ms</span>
                      </span>
                    </div>
                  </div>

                  {/* Assignments Cards */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
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
                            className={`glass-card p-4 rounded-2xl border ${isDispatched ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800'} relative flex flex-col justify-between space-y-4`}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-mono font-bold text-slate-400">Match #{aId}</span>
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                                  isDispatched 
                                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {status}
                                </span>
                              </div>

                              {/* Vehicle info */}
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white">
                                  <Tractor className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Machinery</div>
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">Vehicle #{vId}</div>
                                  <div className="text-xs text-slate-500">
                                    {v ? `${(v.vehicleType || v.vehicle_type).replace('_', ' ')} • ⭐ ${v.rating}` : 'Equipment Data'}
                                  </div>
                                </div>
                              </div>

                              {/* Transit indicator */}
                              <div className="flex items-center gap-2 pl-3">
                                <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-700" />
                                <div className="text-[11px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                                  ↳ {Number(a.deadheadDistanceKm || a.deadhead_distance_km).toFixed(2)} km Transit
                                </div>
                              </div>

                              {/* Booking info */}
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                                  <Sprout className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase">Target Field Request</div>
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">Booking #{bId}</div>
                                  <div className="text-xs text-slate-500">
                                    {b ? `${b.cropType || b.crop_type} • ${b.acreage} Acres` : 'Field Data'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {!isDispatched && (
                              <button
                                onClick={() => handleConfirmDispatch(aId, bId)}
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
                <div className="flex flex-col items-center justify-center h-full flex-1 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 text-xl font-bold">
                    ⚡
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Allocation Data Loaded</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Execute a global Hungarian batch or trigger a greedy dispatch from the left controls.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Batches History Table */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Allocation Batches History
            </h2>
            <button 
              onClick={fetchDashboardData} 
              className="text-xs font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">Batch ID</th>
                  <th className="p-3.5">Algorithm</th>
                  <th className="p-3.5">Dimensions</th>
                  <th className="p-3.5">Total Cost</th>
                  <th className="p-3.5">Execution Speed</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {batches.map(b => {
                  const id = b.batchId || b.batch_id || b.id;
                  const type = b.batchType || b.batch_type;
                  const dims = b.matrixDimensions || b.matrix_dimensions || 'N/A';
                  const cost = Number(b.totalNetworkCost || b.total_network_cost || 0).toFixed(2);
                  const time = b.executionTimeMs || b.execution_time_ms || 0;
                  const isActive = activeBatch && (activeBatch.batchId || activeBatch.batch_id || activeBatch.id) === id;

                  return (
                    <tr key={id} className={`transition-colors ${isActive ? 'bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                      <td className="p-3.5 font-mono font-bold text-emerald-500">#{id}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase border ${
                          type === 'SCHEDULED_BATCH' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                        }`}>
                          {type === 'SCHEDULED_BATCH' ? 'Hungarian (Exact)' : 'Greedy (Heuristic)'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{dims}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{cost} km</td>
                      <td className="p-3.5 font-mono text-slate-400">{time} ms</td>
                      <td className="p-3.5 text-right">
                        <button 
                          onClick={() => loadAssignmentsForBatch(b)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isActive 
                              ? 'bg-emerald-500 text-slate-950 shadow-md' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-white'
                          }`}
                        >
                          {isActive ? 'Viewing' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}