'use client';

import { useState } from 'react';
import { api } from '@/services/api';

// Geographical coordinates & metadata for the 10 agricultural nodes
const NODE_METADATA = {
  1: { name: 'Main Machinery Depot Alpha', type: 'DEPOT', x: 220, y: 180, lat: 8.3114, lng: 80.4037 },
  2: { name: 'Junction Medawachchiya Cross', type: 'JUNCTION', x: 380, y: 150, lat: 8.3245, lng: 80.4120 },
  3: { name: 'Canal Bridge Crossing Alpha', type: 'BRIDGE', x: 550, y: 120, lat: 8.3380, lng: 80.4280 },
  4: { name: 'Farm Gate Plot 1 (Kamal Farm)', type: 'FARM', x: 720, y: 130, lat: 8.3350, lng: 80.4450 },
  5: { name: 'Farm Gate Plot 2 (Sector B)', type: 'FARM', x: 380, y: 40, lat: 8.3620, lng: 80.4120 },
  6: { name: 'South Agricultural Bypass', type: 'JUNCTION', x: 220, y: 280, lat: 8.2950, lng: 80.3950 },
  7: { name: 'Farm Gate Plot 3 (Sector C)', type: 'FARM', x: 80, y: 270, lat: 8.2980, lng: 80.3620 },
  8: { name: 'Gravel Road Intersect South', type: 'JUNCTION', x: 220, y: 390, lat: 8.2750, lng: 80.3900 },
  9: { name: 'Farm Gate Plot 4 (Sector D)', type: 'FARM', x: 380, y: 390, lat: 8.2750, lng: 80.4180 },
  10: { name: 'Sub-Depot Beta (East Sector)', type: 'DEPOT', x: 740, y: 40, lat: 8.3650, lng: 80.4500 }
};

const ALL_ROADS = [
  { u: 1, v: 2, weight: 1.75 },
  { u: 2, v: 3, weight: 2.75 },
  { u: 3, v: 4, weight: 3.04 },
  { u: 2, v: 5, weight: 4.20 },
  { u: 1, v: 6, weight: 2.10 },
  { u: 6, v: 7, weight: 4.44 },
  { u: 6, v: 8, weight: 3.45 },
  { u: 8, v: 9, weight: 6.51 },
  { u: 3, v: 10, weight: 3.60 },
  { u: 4, v: 10, weight: 4.42 }
];

export default function NetworkPage() {
  const [regionId, setRegionId] = useState(101);
  const [networkData, setNetworkData] = useState(null);
  const [activeTab, setActiveTab] = useState('MAP');
  const [hoveredNode, setHoveredNode] = useState(null);
  
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
    if (e) e.preventDefault();
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

  const isBridge = (u, v) => {
    if (!networkData?.criticalBridges) return false;
    return networkData.criticalBridges.some(
      b => (b.u === u && b.v === v) || (b.u === v && b.v === u)
    );
  };

  const isMstEdge = (u, v) => {
    if (!networkData?.mstBackboneEdges) return false;
    return networkData.mstBackboneEdges.some(
      e => (e.u === u && e.v === v) || (e.u === v && e.v === u)
    );
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full bg-rose-600/10 blur-[130px]" />
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-8 max-w-[1440px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800 shadow-2xl p-8 sm:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Port 8083 • Service Live
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Task 3: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Network Analysis & Resilience</span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 max-w-2xl leading-relaxed">
                Graph Intelligence Engine: Linear-Time Tarjan Cut-Edge Bridge Detection for proactive flood resilience & Kruskal Minimum Spanning Tree for cost-minimal machinery logistics.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="bg-slate-800/90 px-4 py-3 rounded-2xl border border-slate-700/80 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resilience Algorithm</div>
                <div className="text-sm font-bold text-rose-400">Tarjan DFS (Θ(V+E))</div>
              </div>
              <div className="bg-slate-800/90 px-4 py-3 rounded-2xl border border-slate-700/80 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Backbone Algorithm</div>
                <div className="text-sm font-bold text-emerald-400">Kruskal DSU (O(E log E))</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Execute Regional Analysis</h2>
                  <p className="text-xs text-slate-400">Run Tarjan & Kruskal Algorithms</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Agricultural Region</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={regionId} 
                    onChange={e => setRegionId(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 p-3.5 pl-4 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-mono font-bold text-slate-400">Region ID</span>
                </div>
              </div>

              <button 
                onClick={handleAnalyzeRegion}
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl p-[1px] font-bold transition-all disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all group-hover:opacity-100 opacity-80" />
                <div className="relative px-6 py-3.5 bg-slate-900 rounded-[11px] text-white text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-opacity-80 transition-all">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Analyzing Graph Topology...
                    </>
                  ) : (
                    <>
                      <span>⚡ Run Network Analysis</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Bridge Tonnage Verifier</h2>
                  <p className="text-xs text-slate-400">Structural Safety Simulation</p>
                </div>
              </div>

              <form onSubmit={handleWeightCheck} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source Location (u)</label>
                  <select 
                    value={uNode} 
                    onChange={e => setUNode(e.target.value)} 
                    className="w-full bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {Object.entries(NODE_METADATA).map(([id, meta]) => (
                      <option key={id} value={id}>#{id} - {meta.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Location (v)</label>
                  <select 
                    value={vNode} 
                    onChange={e => setVNode(e.target.value)} 
                    className="w-full bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {Object.entries(NODE_METADATA).map(([id, meta]) => (
                      <option key={id} value={id}>#{id} - {meta.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Machinery Weight</label>
                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">{weight} Tonnes</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="0.5" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>5T (Light Tractor)</span>
                    <span>25T (Harvester)</span>
                    <span>50T (Heavy Rig)</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={checkingWeight}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow disabled:opacity-50"
                >
                  {checkingWeight ? 'Validating...' : 'Verify Bridge Tolerance 🔍'}
                </button>
              </form>

              {weightResult && (
                <div className={`p-4 rounded-2xl border text-xs font-mono transition-all animate-fadeIn ${
                  weightResult.isAllowed 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider mb-2">
                    <span className="text-base">{weightResult.isAllowed ? '✅' : '🚨'}</span>
                    <span>{weightResult.isAllowed ? 'Clearance Granted' : 'Structural Overload'}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>Bridge Load Limit: <span className="font-bold">{weightResult.bridgeLimitTonnes} T</span></div>
                    <div>Vehicle Payload: <span className="font-bold">{weightResult.vehicleWeightTonnes} T</span></div>
                    <div className="pt-2 text-[11px] font-sans font-medium text-slate-300 border-t border-slate-800/80">
                      {weightResult.warning}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="lg:col-span-8 space-y-6">
            
            {networkData ? (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total MST Backbone</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      {Number(networkData.totalBackboneCost || 0).toFixed(2)} <span className="text-sm font-normal text-slate-400">km</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-sans">9 Optimal Segments (0 Cycles)</div>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Critical Bridge Cuts</div>
                    <div className="text-3xl font-black text-rose-400 font-mono">
                      {networkData.criticalBridges?.length || 0} <span className="text-sm font-normal text-slate-400">Bridges</span>
                    </div>
                    <div className="text-[11px] text-rose-400/80 mt-1 font-sans">Single Points of Failure Detected</div>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Network Topology</div>
                    <div className="text-3xl font-black text-sky-400 font-mono">
                      10 <span className="text-sm font-normal text-slate-400">Nodes</span>
                    </div>
                    <div className="text-[11px] text-sky-400/80 mt-1 font-sans">16 Rural Edge Corridors</div>
                  </div>
                </div>

                <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 gap-1 text-xs font-bold">
                  <button 
                    onClick={() => setActiveTab('MAP')} 
                    className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'MAP' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    🗺️ Interactive Topology Map
                  </button>
                  <button 
                    onClick={() => setActiveTab('BRIDGES')} 
                    className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'BRIDGES' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    🚨 Tarjan Bridges ({networkData.criticalBridges?.length || 0})
                  </button>
                  <button 
                    onClick={() => setActiveTab('MST')} 
                    className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'MST' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    🌳 Kruskal MST Backbone
                  </button>
                </div>

                {activeTab === 'MAP' && (
                  <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">Geographical Network Topology</h3>
                        <p className="text-xs text-slate-400">Visualizing Tarjan single-point cuts (Red) vs MST Backbone (Green)</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" /> Critical Bridge</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> MST Backbone</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-600" /> Rural Road</div>
                      </div>
                    </div>

                    <div className="relative w-full h-[450px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
                      <svg viewBox="0 0 850 480" className="w-full h-full">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {ALL_ROADS.map((road, idx) => {
                          const u = NODE_METADATA[road.u];
                          const v = NODE_METADATA[road.v];
                          const bridge = isBridge(road.u, road.v);
                          const mst = isMstEdge(road.u, road.v);

                          let strokeColor = '#334155';
                          let strokeWidth = 2;
                          let strokeDash = 'none';

                          if (bridge) {
                            strokeColor = '#f43f5e';
                            strokeWidth = 4;
                          } else if (mst) {
                            strokeColor = '#10b981';
                            strokeWidth = 3;
                          }

                          return (
                            <g key={idx}>
                              <line 
                                x1={u.x} y1={u.y} 
                                x2={v.x} y2={v.y} 
                                stroke={strokeColor} 
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDash}
                                strokeLinecap="round"
                              />
                              {bridge && (
                                <line 
                                  x1={u.x} y1={u.y} 
                                  x2={v.x} y2={v.y} 
                                  stroke="#fda4af" 
                                  strokeWidth={1}
                                  className="animate-pulse"
                                />
                              )}
                              <rect 
                                x={(u.x + v.x) / 2 - 16} 
                                y={(u.y + v.y) / 2 - 10} 
                                width="32" height="18" 
                                rx="4" 
                                fill="#0f172a" 
                                stroke={bridge ? '#f43f5e' : '#334155'}
                                strokeWidth="1"
                              />
                              <text 
                                x={(u.x + v.x) / 2} 
                                y={(u.y + v.y) / 2 + 3} 
                                fill={bridge ? '#fca5a5' : '#94a3b8'} 
                                fontSize="9" 
                                fontFamily="monospace" 
                                fontWeight="bold" 
                                textAnchor="middle"
                              >
                                {road.weight}
                              </text>
                            </g>
                          );
                        })}

                        {Object.entries(NODE_METADATA).map(([id, node]) => {
                          const isDepot = node.type === 'DEPOT';
                          const isFarm = node.type === 'FARM';
                          const isHovered = hoveredNode === id;

                          return (
                            <g 
                              key={id} 
                              className="cursor-pointer transition-all"
                              onMouseEnter={() => setHoveredNode(id)}
                              onMouseLeave={() => setHoveredNode(null)}
                            >
                              <circle 
                                cx={node.x} cy={node.y} 
                                r={isHovered ? 20 : 16} 
                                fill={isDepot ? '#6366f1' : isFarm ? '#10b981' : '#0ea5e9'}
                                stroke="#ffffff" 
                                strokeWidth="2.5"
                                className="transition-all duration-300 drop-shadow-md"
                              />
                              <text 
                                x={node.x} y={node.y + 4} 
                                fill="#ffffff" 
                                fontSize="10" 
                                fontWeight="bold" 
                                textAnchor="middle"
                              >
                                {id}
                              </text>
                              <text 
                                x={node.x} y={node.y + 28} 
                                fill="#cbd5e1" 
                                fontSize="10" 
                                fontWeight="600" 
                                textAnchor="middle"
                                className="pointer-events-none drop-shadow"
                              >
                                {node.name.split(' ')[0]}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {hoveredNode && (
                        <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1 font-mono">
                          <div className="text-white font-bold font-sans flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                            Node #{hoveredNode}: {NODE_METADATA[hoveredNode].name}
                          </div>
                          <div className="text-slate-400">Classification: <span className="text-indigo-400 font-bold">{NODE_METADATA[hoveredNode].type}</span></div>
                          <div className="text-slate-400">GPS: {NODE_METADATA[hoveredNode].lat}, {NODE_METADATA[hoveredNode].lng}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'BRIDGES' && (
                  <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                      🚨 Detected Vulnerable Bridges ({networkData.criticalBridges?.length || 0} Links)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {networkData.criticalBridges?.map((b, idx) => (
                        <div key={idx} className="bg-slate-950/80 border border-rose-900/40 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Single Point of Failure</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              #{b.u}: {NODE_METADATA[b.u]?.name || `Node ${b.u}`} <span className="text-rose-400">⟷</span> #{b.v}: {NODE_METADATA[b.v]?.name || `Node ${b.v}`}
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-xl">
                            Road Span: {b.weight} km
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'MST' && (
                  <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        🌳 Kruskal Minimal Spanning Tree (MST)
                      </h3>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                        Total Cost: {Number(networkData.totalBackboneCost || 0).toFixed(2)} km
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                            <th className="py-3 px-4">Segment Connection</th>
                            <th className="py-3 px-4 text-right">Distance (km)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {networkData.mstBackboneEdges?.map((edge, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-200">
                                <span className="text-emerald-400 font-mono font-bold">#{edge.u}</span> {NODE_METADATA[edge.u]?.name} 
                                <span className="text-slate-500 mx-2">➔</span> 
                                <span className="text-emerald-400 font-mono font-bold">#{edge.v}</span> {NODE_METADATA[edge.v]?.name}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                {edge.weight} km
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-slate-900/80 backdrop-blur-xl p-12 rounded-3xl border border-slate-800 shadow-xl min-h-[480px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl animate-pulse">
                  🗺️
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Network Analysis Idle</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Enter Target Region ID <span className="text-indigo-400 font-bold font-mono">101</span> and click <span className="text-white font-bold">"Run Network Analysis"</span> to generate Tarjan's bridge alerts & Kruskal's MST backbone.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
