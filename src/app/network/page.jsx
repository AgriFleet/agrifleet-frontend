'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

// Utility: project lat/lng to fixed SVG x/y coordinates
function projectToSVG(lat, lng, allNodes, svgW = 820, svgH = 460) {
  if (!allNodes || allNodes.length === 0) return { x: 0, y: 0 };
  const lats = allNodes.map(n => n.lat);
  const lngs = allNodes.map(n => n.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 70;
  const x = pad + ((lng - minLng) / (maxLng - minLng || 1)) * (svgW - pad * 2);
  const y = svgH - pad - ((lat - minLat) / (maxLat - minLat || 1)) * (svgH - pad * 2);
  return { x, y };
}

function getNodeType(node) {
  if (node.isDepot === 1) return 'DEPOT';
  if (node.isFarmGate === 1) return 'FARM';
  return 'JUNCTION';
}

export default function NetworkPage() {
  const [regionId, setRegionId] = useState(101);
  const [networkData, setNetworkData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [activeTab, setActiveTab] = useState('MAP');
  const [hoveredNode, setHoveredNode] = useState(null);

  const [uNode, setUNode] = useState(2);
  const [vNode, setVNode] = useState(3);
  const [weight, setWeight] = useState(25.0);
  const [weightResult, setWeightResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [checkingWeight, setCheckingWeight] = useState(false);

  // Fetch graph structure on mount
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await api.network.getGraph();
        setGraphData(res.data);
      } catch (err) {
        console.error('Failed to load graph:', err.message);
      }
    };
    fetchGraph();
    handleAnalyzeRegion();
  }, []);

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

  // Build derived data from graphData
  const nodeMap = {};
  const svgPositions = {};
  if (graphData?.nodes) {
    graphData.nodes.forEach(n => { nodeMap[n.nodeId] = n; });
    graphData.nodes.forEach(n => {
      svgPositions[n.nodeId] = projectToSVG(n.lat, n.lng, graphData.nodes);
    });
  }

  // Deduplicate edges for SVG rendering
  const uniqueEdges = [];
  const seenEdges = new Set();
  if (graphData?.edges) {
    graphData.edges.forEach(e => {
      const key = [Math.min(e.uNode, e.vNode), Math.max(e.uNode, e.vNode)].join('-');
      if (!seenEdges.has(key)) {
        seenEdges.add(key);
        uniqueEdges.push({ u: e.uNode, v: e.vNode, weight: e.computedWeight });
      }
    });
  }

  const getNodeName = (id) => nodeMap[id]?.nodeName || `Node ${id}`;
  const getNodeTypeName = (id) => nodeMap[id] ? getNodeType(nodeMap[id]) : 'UNKNOWN';

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full bg-rose-600/10 blur-[130px]" />
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-8 max-w-[1440px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">

        {/* Futuristic Dark Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800 shadow-2xl p-8 sm:p-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Port 8083 * Connected Live
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Task 3: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Network Analysis &amp; Resilience</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                Graph Intelligence Engine: Linear-Time Tarjan Cut-Edge Bridge Detection for flood resilience &amp; Kruskal Minimum Spanning Tree for cost-minimal machinery logistics.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="bg-slate-800/90 px-4 py-3 rounded-2xl border border-slate-700/80 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resilience Algorithm</div>
                <div className="text-xs font-bold text-rose-400">Tarjan DFS (Theta(V+E))</div>
              </div>
              <div className="bg-slate-800/90 px-4 py-3 rounded-2xl border border-slate-700/80 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Backbone Algorithm</div>
                <div className="text-xs font-bold text-emerald-400">Kruskal MST (O(E log E))</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Control Panel */}
          <div className="lg:col-span-4 space-y-6">

            {/* Region Trigger Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Regional Resilience Engine</h2>
                  <p className="text-xs text-slate-400">Tarjan Bridges &amp; Kruskal MST</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Agricultural Region</label>
                <div className="relative">
                  <input
                    type="text"
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Analyzing Graph Topology...' : 'Run Network Analysis'}
              </button>
            </div>

            {/* Bridge Weight Verifier Card */}
            <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Bridge Weight Verifier</h2>
                  <p className="text-xs text-slate-400">Machinery Tonnage Safety Check</p>
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
                    {graphData?.nodes?.map(n => (
                      <option key={n.nodeId} value={n.nodeId}>#{n.nodeId} - {n.nodeName}</option>
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
                    {graphData?.nodes?.map(n => (
                      <option key={n.nodeId} value={n.nodeId}>#{n.nodeId} - {n.nodeName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Machinery Weight</label>
                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-800">{weight} Tonnes</span>
                  </div>
                  <input
                    type="range" min="5" max="50" step="0.5"
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
                  {checkingWeight ? 'Validating...' : 'Verify Bridge Tolerance'}
                </button>
              </form>

              {weightResult && (
                <div className={`p-4 rounded-2xl border text-xs font-mono transition-all ${weightResult.isAllowed ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/50 border-rose-500/40 text-rose-300'}`}>
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider mb-2">
                    <span className="text-base">{weightResult.isAllowed ? '[OK]' : '[WARN]'}</span>
                    <span>{weightResult.isAllowed ? 'Clearance Granted' : 'Overweight Violation'}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>Bridge Safe Capacity: <span className="font-bold">{weightResult.bridgeLimitTonnes} Tonnes</span></div>
                    <div>Vehicle Payload: <span className="font-bold">{weightResult.vehicleWeightTonnes} Tonnes</span></div>
                    <div className="pt-2 text-[11px] font-sans font-medium text-slate-300 border-t border-slate-800/80">{weightResult.warning}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Main Results Panel */}
          <div className="lg:col-span-8 space-y-6">

            {networkData ? (
              <div className="space-y-6">

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total MST Backbone</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono">
                      {Number(networkData.totalBackboneCost).toFixed(2)} <span className="text-sm font-normal text-slate-400">km</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-sans">{networkData.mstBackboneEdges?.length} Optimal Segments (0 Cycles)</div>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Critical Bridge Cuts</div>
                    <div className="text-3xl font-black text-rose-400 font-mono">
                      {networkData.criticalBridges?.length} <span className="text-sm font-normal text-slate-400">Bridges</span>
                    </div>
                    <div className="text-[11px] text-rose-400/80 mt-1 font-sans">Single Points of Failure</div>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Network Topology</div>
                    <div className="text-3xl font-black text-indigo-400 font-mono">
                      {graphData?.nodes?.length ?? 10} <span className="text-sm font-normal text-slate-400">Nodes</span>
                    </div>
                    <div className="text-[11px] text-indigo-400/80 mt-1 font-sans">{uniqueEdges.length} Rural Edge Corridors</div>
                  </div>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 gap-1.5 text-xs font-bold shadow-sm">
                  <button onClick={() => setActiveTab('MAP')} className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'MAP' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                    Interactive Topology Map
                  </button>
                  <button onClick={() => setActiveTab('BRIDGES')} className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'BRIDGES' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                    Tarjan Bridges ({networkData.criticalBridges?.length})
                  </button>
                  <button onClick={() => setActiveTab('MST')} className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'MST' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                    Kruskal MST Backbone
                  </button>
                </div>

                {/* TAB 1: SVG GRAPH MAP */}
                {activeTab === 'MAP' && (
                  <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">Geographical Network Topology</h3>
                        <p className="text-xs text-slate-400">Tarjan single-point cuts (Red) vs MST Backbone (Green)</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" /> Critical Bridge</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> MST Backbone</div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-600" /> Rural Road</div>
                      </div>
                    </div>

                    <div className="relative w-full h-[460px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
                      <svg viewBox="0 0 820 460" className="w-full h-full">
                        <defs>
                          <pattern id="dark-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.2)" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dark-grid)" />

                        {/* Roads */}
                        {uniqueEdges.map((road, idx) => {
                          const u = svgPositions[road.u];
                          const v = svgPositions[road.v];
                          if (!u || !v) return null;
                          const bridge = isBridge(road.u, road.v);
                          const mst = isMstEdge(road.u, road.v);
                          let strokeColor = '#334155';
                          let strokeWidth = 2.5;
                          if (bridge) { strokeColor = '#f43f5e'; strokeWidth = 4; }
                          else if (mst) { strokeColor = '#10b981'; strokeWidth = 3; }

                          return (
                            <g key={idx}>
                              <line x1={u.x} y1={u.y} x2={v.x} y2={v.y} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                              {bridge && (
                                <line x1={u.x} y1={u.y} x2={v.x} y2={v.y} stroke="#fda4af" strokeWidth={1.5} className="animate-pulse" />
                              )}
                              <rect x={(u.x + v.x) / 2 - 16} y={(u.y + v.y) / 2 - 10} width="32" height="18" rx="5" fill="#0f172a" stroke={bridge ? '#f43f5e' : '#334155'} strokeWidth="1.5" />
                              <text x={(u.x + v.x) / 2} y={(u.y + v.y) / 2 + 3.5} fill={bridge ? '#fca5a5' : '#94a3b8'} fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                {road.weight}
                              </text>
                            </g>
                          );
                        })}

                        {/* Nodes */}
                        {graphData?.nodes?.map(node => {
                          const pos = svgPositions[node.nodeId];
                          if (!pos) return null;
                          const type = getNodeType(node);
                          const isDepot = type === 'DEPOT';
                          const isFarm = type === 'FARM';
                          const isHovered = hoveredNode === node.nodeId;

                          return (
                            <g key={node.nodeId} className="cursor-pointer transition-all" onMouseEnter={() => setHoveredNode(node.nodeId)} onMouseLeave={() => setHoveredNode(null)}>
                              <circle cx={pos.x} cy={pos.y} r={isHovered ? 20 : 16} fill={isDepot ? '#6366f1' : isFarm ? '#10b981' : '#0ea5e9'} stroke="#ffffff" strokeWidth="2.5" className="transition-all duration-300 drop-shadow-lg" />
                              <text x={pos.x} y={pos.y + 4} fill="#ffffff" fontSize="10.5" fontWeight="bold" textAnchor="middle">{node.nodeId}</text>
                              <text x={pos.x} y={pos.y + 26} fill="#cbd5e1" fontSize="10.5" fontWeight="bold" textAnchor="middle" className="pointer-events-none">
                                {node.nodeName.split(' ')[0]}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {hoveredNode && nodeMap[hoveredNode] && (
                        <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1 font-mono text-slate-100 animate-fadeIn">
                          <div className="text-white font-bold font-sans flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                            Node #{hoveredNode}: {nodeMap[hoveredNode].nodeName}
                          </div>
                          <div className="text-slate-400">Classification: <span className="text-indigo-400 font-bold">{getNodeTypeName(hoveredNode)}</span></div>
                          <div className="text-slate-400">GPS: {nodeMap[hoveredNode].lat}, {nodeMap[hoveredNode].lng}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: TARJAN BRIDGES CARDS */}
                {activeTab === 'BRIDGES' && (
                  <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Tarjan Critical Bridges ({networkData.criticalBridges?.length} Links)
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {networkData.criticalBridges?.map((b, idx) => (
                        <div key={idx} className="bg-slate-950/80 border border-rose-900/40 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-rose-700/60 transition-all">
                          <div>
                            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Single Point of Failure</div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              #{b.u}: {getNodeName(b.u)} <span className="text-rose-400 font-mono">&lt;-&gt;</span> #{b.v}: {getNodeName(b.v)}
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-xl">
                            Span Cost: {b.weight} km
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: KRUSKAL MST TABLE */}
                {activeTab === 'MST' && (
                  <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kruskal Minimal Spanning Tree (MST)</h3>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                        Total Cost: {Number(networkData.totalBackboneCost).toFixed(2)} km
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
                                <span className="text-emerald-400 font-mono font-bold">#{edge.u}</span> {getNodeName(edge.u)}
                                <span className="text-slate-500 mx-2">-&gt;</span>
                                <span className="text-emerald-400 font-mono font-bold">#{edge.v}</span> {getNodeName(edge.v)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{edge.weight} km</td>
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
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl animate-pulse">
                  *
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Network Analysis Idle</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Enter Target Region ID <span className="text-indigo-400 font-bold font-mono">101</span> and click <span className="text-white font-bold">"Run Network Analysis"</span>.
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