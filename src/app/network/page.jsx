'use client';

import { useState } from 'react';
import { api } from '@/services/api';

// Mapping technical node IDs to user-friendly names based on AgriFleet seed data
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
    } catch (err) {
      alert('Failed to analyze network region: ' + (err.response?.data?.message || err.message));
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
    } catch (err) {
      alert('Weight check failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setCheckingWeight(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 pb-20 selection:bg-indigo-100">
      {/* Decorative Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-slate-400/10 blur-[100px]" />
      </div>

      <div className="relative z-10 space-y-8 max-w-[1400px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-slate-900/20 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80" />
          
          <div className="relative p-8 sm:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Port 8083 • Online
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Task 3: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300">Network Analysis & Resilience</span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
                Tarjan bridge detection for single-point-of-failure assets and Kruskal's MST logistics backbone optimization.
              </p>
            </div>
            
            <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700 backdrop-blur-sm text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Graph Topology Engine</div>
              <div className="text-sm font-bold text-indigo-400">DFS Low-Link & DSU Active</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Region Analysis Trigger */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shadow-inner">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Regional Resilience</h2>
                  <p className="text-xs text-slate-500">Tarjan Bridges & Kruskal MST</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Region ID</label>
                  <input 
                    type="number" 
                    value={regionId} 
                    onChange={e => setRegionId(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleAnalyzeRegion}
                  disabled={loading}
                  className="w-full group relative inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl overflow-hidden transition-all hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative flex items-center gap-2">
                    {loading ? 'Analyzing Graph...' : 'Run Network Analysis ⚡'}
                  </span>
                </button>
              </div>
            </div>

            {/* Machinery Weight Restriction Checker */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg shadow-inner">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Weight Limit Verifier</h2>
                  <p className="text-xs text-slate-500">Bridge Tonnage Safety Check</p>
                </div>
              </div>

              <form onSubmit={handleWeightCheck} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Source Location (u)</label>
                  <select 
                    value={uNode} 
                    onChange={e => setUNode(e.target.value)} 
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  >
                    {Object.entries(NODE_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>#{id} - {name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Location (v)</label>
                  <select 
                    value={vNode} 
                    onChange={e => setVNode(e.target.value)} 
                    className="w-full bg-slate-50/50 border border-slate-200/80 p-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  >
                    {Object.entries(NODE_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>#{id} - {name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle Weight (Tonnes)</label>
                  <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/50 outline-none shadow-sm" />
                </div>
                <button type="submit" disabled={checkingWeight} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow disabled:opacity-50">
                  {checkingWeight ? 'Checking...' : 'Verify Bridge Tolerance'}
                </button>
              </form>

              {weightResult && (
                <div className={`mt-4 p-4 border rounded-xl text-xs font-mono space-y-1 ${weightResult.isAllowed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <div className="font-bold uppercase tracking-wider mb-2">{weightResult.isAllowed ? '✓ Clearance Granted' : '⚠ Weight Violation'}</div>
                  <div>Limit: {weightResult.bridgeLimitTonnes} Tonnes</div>
                  <div>Payload: {weightResult.vehicleWeightTonnes} Tonnes</div>
                  <div className="mt-2 text-[11px] font-sans font-medium">{weightResult.warning}</div>
                </div>
              )}
            </div>

          </div>

          {/* Results & Visualizer Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {networkData ? (
              <div className="space-y-6">
                
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total MST Backbone Cost</span>
                    <span className="text-3xl font-extrabold text-indigo-600">{Number(networkData.totalBackboneCost || 0).toFixed(2)} <span className="text-sm font-medium text-slate-500">km</span></span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Critical Vulnerable Bridges</span>
                    <span className="text-3xl font-extrabold text-rose-600">{networkData.criticalBridges?.length || 0} <span className="text-sm font-medium text-slate-500">Links</span></span>
                  </div>
                </div>

                {/* Critical Bridges Card Grid */}
                <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Tarjan Critical Bridges (Single-Point-of-Failure)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {networkData.criticalBridges?.map((b, idx) => (
                      <div key={idx} className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="absolute top-0 right-0 p-2">
                          <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase border border-rose-200">
                            High Risk Link
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">Vulnerable Bridge Connection</div>
                          <div className="text-sm font-extrabold text-slate-800 flex flex-wrap items-center gap-2 pt-1">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">🌉 #{b.u}: {getNodeLabel(b.u)}</span>
                            <span className="text-slate-400 font-mono font-normal">⟷</span>
                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">#{b.v}: {getNodeLabel(b.v)}</span>
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 self-stretch sm:self-auto text-right">
                          Span Cost: {b.weight} km
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MST Backbone Edges */}
                <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Kruskal MST Logistics Backbone</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                          <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest">Backbone Route Segment</th>
                          <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-right">Edge Distance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {networkData.mstBackboneEdges?.map((edge, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-700 text-xs flex items-center gap-2">
                              <span className="text-indigo-600 font-mono font-bold">#{edge.u}</span> {getNodeLabel(edge.u)} 
                              <span className="text-slate-400">➔</span> 
                              <span className="text-indigo-600 font-mono font-bold">#{edge.v}</span> {getNodeLabel(edge.v)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600">
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
              <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/30 min-h-[450px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 text-2xl">🌐</div>
                <h3 className="text-base font-bold text-slate-800">No Network Analysis Loaded</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                  Enter a regional ID and click "Run Network Analysis" to evaluate bridge vulnerability and compute the minimal spanning tree backbone.
                </p>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}