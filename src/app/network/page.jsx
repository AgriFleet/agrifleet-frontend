'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { 
  Network as NetworkIcon, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Scale, 
  Cpu, 
  Activity, 
  ArrowRight,
  Zap
} from 'lucide-react';

const NODE_NAMES = {
  1: 'Main Machinery Depot Alpha (Depot)',
  2: 'Junction Medawachchiya Cross',
  3: 'Canal Bridge Crossing Alpha',
  4: 'Farm Gate Plot 1 (Booking #1)',
  5: 'Farm Gate Plot 2 (Booking #2)',
  6: 'South Agricultural Bypass',
  7: 'Farm Gate Plot 3 (Booking #3)',
  8: 'Gravel Road Intersect South',
  9: 'Farm Gate Plot 4 (Booking #4)',
  10: 'Sub-Depot Beta (East Sector)'
};

const getNodeLabel = (nodeId) => {
  return NODE_NAMES[nodeId] ? NODE_NAMES[nodeId] : `Node #${nodeId}`;
};

export default function NetworkPage() {
  const { showSuccess, showError } = useToast();
  const [regionId, setRegionId] = useState(101);
  const [networkData, setNetworkData] = useState(null);
  
  const [uNode, setUNode] = useState(2);
  const [vNode, setVNode] = useState(3);
  const [weight, setWeight] = useState(25.0);
  const [weightResult, setWeightResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [checkingWeight, setCheckingWeight] = useState(false);

  const handleAnalyzeRegion = async () => {
    setLoading(true);
    try {
      const res = await api.network.analyzeRegion(Number(regionId));
      setNetworkData(res.data);
      showSuccess(`🌐 Tarjan bridges & Kruskal MST calculated for Region #${regionId}!`);
    } catch (err) {
      showError('Failed to analyze network region: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleWeightCheck = async (e) => {
    e.preventDefault();
    setCheckingWeight(true);
    try {
      const res = await api.network.checkWeightLimit(Number(uNode), Number(vNode), Number(weight));
      setWeightResult(res.data);
      if (res.data?.isAllowed) {
        showSuccess('✓ Vehicle weight clearance granted!');
      } else {
        showError('⚠ Weight limit violation detected!');
      }
    } catch (err) {
      showError('Weight check failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setCheckingWeight(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-black opacity-90" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Task 3 • Port 8083 Engine
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Network Analysis & <span className="gradient-text-purple">Graph Resilience</span>
              </h1>
              <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                Tarjan DFS bridge detection for single-point-of-failure assets and Kruskal's MST logistics backbone optimization.
              </p>
            </div>
            
            <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700/80 backdrop-blur-sm text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Graph Topology Engine</div>
              <div className="text-sm font-extrabold text-indigo-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> DFS Low-Link & DSU Active
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column */}
          <div className="space-y-6">
            
            {/* Region Analysis */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <NetworkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Regional Resilience</h2>
                  <p className="text-xs text-slate-500">Tarjan Bridges & Kruskal MST</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Target Region ID</label>
                  <input 
                    type="number" 
                    value={regionId} 
                    onChange={e => setRegionId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <button 
                  onClick={handleAnalyzeRegion}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>{loading ? 'Analyzing Graph...' : 'Run Network Analysis ⚡'}</span>
                </button>
              </div>
            </div>

            {/* Machinery Weight Checker */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Weight Limit Verifier</h2>
                  <p className="text-xs text-slate-500">Bridge Tonnage Safety Clearance</p>
                </div>
              </div>

              <form onSubmit={handleWeightCheck} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Source Location (u)</label>
                  <select 
                    value={uNode} 
                    onChange={e => setUNode(e.target.value)} 
                    className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none"
                  >
                    {Object.entries(NODE_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>#{id} - {name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Target Location (v)</label>
                  <select 
                    value={vNode} 
                    onChange={e => setVNode(e.target.value)} 
                    className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none"
                  >
                    {Object.entries(NODE_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>#{id} - {name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Vehicle Weight (Tonnes)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)} 
                    className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={checkingWeight} 
                  className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow disabled:opacity-50"
                >
                  {checkingWeight ? 'Checking Clearance...' : 'Verify Bridge Tolerance'}
                </button>
              </form>

              {weightResult && (
                <div className={`p-4 border rounded-2xl text-xs space-y-1 ${
                  weightResult.isAllowed 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  <div className="font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    {weightResult.isAllowed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {weightResult.isAllowed ? '✓ Clearance Granted' : '⚠ Weight Violation'}
                  </div>
                  <div>Bridge Limit: {weightResult.bridgeLimitTonnes} Tonnes</div>
                  <div>Vehicle Mass: {weightResult.vehicleWeightTonnes} Tonnes</div>
                  <div className="mt-1 text-[11px] opacity-80">{weightResult.warning}</div>
                </div>
              )}
            </div>

          </div>

          {/* Results Visualizer Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {networkData ? (
              <div className="space-y-6">
                
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total MST Backbone Distance</span>
                    <span className="text-3xl font-black text-indigo-500">
                      {Number(networkData.totalBackboneCost || 0).toFixed(2)} <span className="text-sm font-normal text-slate-400">km</span>
                    </span>
                  </div>
                  
                  <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vulnerable Tarjan Bridges</span>
                    <span className="text-3xl font-black text-rose-500">
                      {networkData.criticalBridges?.length || 0} <span className="text-sm font-normal text-slate-400">Single-Point Links</span>
                    </span>
                  </div>
                </div>

                {/* Tarjan Critical Bridges Cards */}
                <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tarjan Critical Bridges (Single-Point-of-Failure Links)
                  </h3>

                  <div className="grid grid-cols-1 gap-3.5">
                    {networkData.criticalBridges?.map((b, idx) => (
                      <div 
                        key={idx} 
                        className="glass-card p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <ShieldAlert className="w-4 h-4" />
                            Critical Vulnerability Link
                          </div>
                          
                          <div className="text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2 pt-1">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              🌉 #{b.u}: {getNodeLabel(b.u)}
                            </span>
                            <span className="text-slate-400 font-mono">⟷</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              #{b.v}: {getNodeLabel(b.v)}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          Span Distance: {b.weight} km
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kruskal MST Backbone Table */}
                <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kruskal MST Minimal Logistics Backbone
                  </h3>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                          <th className="py-3 px-4">Backbone Route Segment</th>
                          <th className="py-3 px-4 text-right">Segment Distance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {networkData.mstBackboneEdges?.map((edge, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="text-indigo-500 font-mono">#{edge.u}</span> {getNodeLabel(edge.u)} 
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-indigo-500 font-mono">#{edge.v}</span> {getNodeLabel(edge.v)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-500">
                              {edge.weight} km
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="glass-panel p-8 rounded-3xl min-h-[450px] flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-2xl font-bold">
                  🌐
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Network Analysis Loaded</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Enter a target region ID and click "Run Network Analysis" to evaluate bridge vulnerability and minimal spanning tree.
                </p>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
