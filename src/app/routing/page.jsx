'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import dynamic from 'next/dynamic';
import { 
  Navigation, 
  MapPin, 
  Zap, 
  Clock, 
  Route as RouteIcon, 
  History, 
  Play, 
  Cpu,
  Tractor,
  Warehouse
} from 'lucide-react';

const NetworkTopologyMap = dynamic(() => import('./NetworkTopologyMap'), { ssr: false });

export default function RoutingPage() {
  const { showSuccess, showError } = useToast();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cachedRoutes, setCachedRoutes] = useState([]);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const [nodesRes, edgesRes, cacheRes] = await Promise.all([
        api.routing.getRoadNodes(),
        api.routing.getRoadEdges(),
        api.routing.getRouteCache?.() || Promise.resolve({ data: [] })
      ]);
      const fetchedNodes = nodesRes.data || [];
      setNodes(fetchedNodes);
      setEdges(edgesRes.data || []);
      setCachedRoutes(cacheRes.data || []);
      
      if (fetchedNodes.length > 0) {
        setOrigin(fetchedNodes[0].nodeId);
        if (fetchedNodes.length > 1) {
          setDest(fetchedNodes[1].nodeId);
        } else {
          setDest(fetchedNodes[0].nodeId);
        }
      }
    } catch (err) {
      console.error('Failed to load initial routing infrastructure data', err);
      showError('Failed to sync road map data [Port 8081]');
    }
  };

  const getNodeName = (nodeId) => {
    const found = nodes.find(n => n.nodeId === nodeId);
    return found ? found.nodeName : `Location ID: ${nodeId}`;
  };

  const handleCalculateRoute = async (algorithm) => {
    setLoading(true);
    setRouteResult(null);
    try {
      const res = algorithm === 'astar'
        ? await api.routing.calculateRouteAStar(origin, dest)
        : await api.routing.calculateRouteDijkstra(origin, dest);
      
      setRouteResult(res.data);
      showSuccess(`🗺️ Best path found using ${algorithm === 'astar' ? 'A* Search' : 'Dijkstra'}!`);
      
      // Refresh cache log
      const cacheRes = await api.routing.getRouteCache();
      setCachedRoutes(cacheRes.data || []);
      
    } catch (err) {
      showError('Route finding failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Extract surface types for the current route
  const surfaceTypesInRoute = useMemo(() => {
    if (!routeResult || !routeResult.pathNodeSequence) return [];
    const seq = routeResult.pathNodeSequence;
    const surfaces = new Set();
    for (let i = 0; i < seq.length - 1; i++) {
      const u = seq[i];
      const v = seq[i + 1];
      const edge = edges.find(e => (e.unode === u && e.vnode === v) || (e.unode === v && e.vnode === u) || (e.uNode === u && e.vNode === v) || (e.uNode === v && e.vNode === u));
      if (edge && edge.surfaceType) {
        surfaces.add(edge.surfaceType);
      }
    }
    return Array.from(surfaces);
  }, [routeResult, edges]);

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-950/60 via-slate-900 to-black opacity-90" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                AgriFleet Routing Core [Task 1]
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Smart Fleet <span className="gradient-text-cyan">Route Planner</span>
              </h1>
              <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                Finding the best paths between depots and farms considering weather and road conditions.
              </p>
            </div>
            
            <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700/80 backdrop-blur-sm text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Map Overview [Network Topology]</div>
              <div className="text-sm font-extrabold text-sky-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                {nodes.length} Locations [Nodes] | {edges.length} Connections [Edges]
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Path Controls Column (Left Side) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-5 h-fit">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-sky-500" />
                Route Planner
              </h2>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Starting Location [Origin Node]
                </label>
                <select 
                  value={origin} 
                  onChange={e => setOrigin(Number(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                >
                  {nodes.map(n => (
                    <option key={n.nodeId} value={n.nodeId}>
                      {n.nodeName} {n.isDepot ? '🏢 (Depot)' : n.isFarmGate ? '🚜 (Farm)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Ending Location [Destination Node]
                </label>
                <select 
                  value={dest} 
                  onChange={e => setDest(Number(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                >
                  {nodes.map(n => (
                    <option key={n.nodeId} value={n.nodeId}>
                      {n.nodeName} {n.isDepot ? '🏢 (Depot)' : n.isFarmGate ? '🚜 (Farm)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button 
                  onClick={() => handleCalculateRoute('astar')}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{loading ? 'Finding Path...' : 'Find Best Path (A* Search)'}</span>
                </button>
                
                <button 
                  onClick={() => handleCalculateRoute('dijkstra')}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl text-xs font-bold transition-colors border border-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>{loading ? 'Finding Path...' : 'Find Alternative (Dijkstra)'}</span>
                </button>
              </div>
            </div>

            {/* Explanation / Justification of Route (Moved to Left Side) */}
            {routeResult && (
              <div className="glass-panel p-5 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-500/20 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-full h-fit">
                    <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Route Justification Log</h4>
                </div>
                
                <p className="text-xs font-medium text-indigo-800/90 dark:text-indigo-200/90 leading-relaxed mb-4">
                  The routing engine optimizes the path by calculating distances, road surface conditions, and weather penalties. Below are the actual conditions for the path selected:
                </p>
                
                <div className="space-y-2">
                  {routeResult.pathNodeSequence.map((nodeId, idx, arr) => {
                    if (idx === arr.length - 1) return null; // Skip last node
                    const u = nodeId;
                    const v = arr[idx + 1];
                    
                    const uNodeName = getNodeName(u);
                    const vNodeName = getNodeName(v);
                    
                    const edge = edges.find(e => 
                      (e.uNode === u && e.vNode === v) || 
                      (e.uNode === v && e.vNode === u) ||
                      (e.unode === u && e.vnode === v) || 
                      (e.unode === v && e.vnode === u)
                    );

                    if (!edge) return null;

                    return (
                      <div key={idx} className="text-xs text-indigo-900/80 dark:text-indigo-300/80 bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold truncate max-w-[40%]">{uNodeName}</span>
                          <span className="text-indigo-400">→</span>
                          <span className="font-bold truncate max-w-[40%] text-right">{vNodeName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400 shadow-sm">{edge.surfaceType.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{edge.baseDistanceKm}km (Penalty: {edge.weatherPenaltyMultiplier}x)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Results Console / Visual UI (Right Side) */}
          <div className="lg:col-span-2 glass-panel p-4 sm:p-6 rounded-3xl flex flex-col space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <RouteIcon className="w-5 h-5 text-sky-500" />
                Interactive Map
              </h2>
              {routeResult && (
                <span className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
                  Algorithm: {routeResult.algorithm}
                </span>
              )}
            </div>

            {/* Network Topology Map */}
            <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
              <NetworkTopologyMap 
                nodes={nodes} 
                edges={edges} 
                routeResult={routeResult} 
              />
            </div>

            {routeResult ? (
              <div className="space-y-6">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Distance</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                      {Number(routeResult.totalDistanceKm).toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                    </span>
                  </div>
                  <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Travel Duration</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                      {Math.round(Number(routeResult.totalTravelTimeMins))} <span className="text-xs font-normal text-slate-400">mins</span>
                    </span>
                  </div>
                  <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Locations [Nodes]</span>
                    <span className="text-2xl font-black text-sky-500 mt-1 block">
                      {routeResult.nodesVisitedCount} <span className="text-xs font-normal text-slate-400">stops</span>
                    </span>
                  </div>
                  <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Road Surface [Edges]</span>
                    {surfaceTypesInRoute.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {surfaceTypesInRoute.map((type, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">N/A</span>
                    )}
                  </div>
                </div>

                {/* Step-by-Step Visual Timeline */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Turn-by-Turn Path
                  </h3>
                  
                  <div className="space-y-2.5 border-l-2 border-sky-500/80 pl-4 ml-2">
                    {routeResult.pathNodeSequence?.map((nodeId, idx) => {
                      const matchedNode = nodes.find(n => n.nodeId === nodeId);
                      return (
                        <div 
                          key={idx} 
                          className="relative flex items-center justify-between glass-card p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-sky-500/40 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-7 h-7 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-sky-500/20 shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {matchedNode?.isDepot && <Warehouse className="w-4 h-4 text-sky-500" />}
                                {matchedNode?.isFarmGate && <Tractor className="w-4 h-4 text-emerald-500" />}
                                {!matchedNode?.isDepot && !matchedNode?.isFarmGate && <MapPin className="w-4 h-4 text-slate-400" />}
                                <span>{matchedNode ? matchedNode.nodeName : `Location ID: ${nodeId}`}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {matchedNode?.isDepot ? 'Machinery Depot Hub' : matchedNode?.isFarmGate ? 'Target Farm Plot' : 'Junction Waypoint'}
                              </div>
                            </div>
                          </div>
                          
                          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                            ID #{nodeId}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 text-xl font-bold">
                  📍
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No path created yet</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Select a starting location and destination on the left, then search for the best path.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Execution Cache History */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-sky-500" />
              Past Trips [Execution Cache]
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Saved Entries: {cachedRoutes.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">Trip ID</th>
                  <th className="p-3.5">Method [Algorithm]</th>
                  <th className="p-3.5">From [Origin] → To [Destination]</th>
                  <th className="p-3.5">Distance</th>
                  <th className="p-3.5">Stops [Visited Nodes]</th>
                  <th className="p-3.5">Saved At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {cachedRoutes.length > 0 ? (
                  cachedRoutes.map(row => (
                    <tr key={row.routeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-sky-500">#{row.routeId}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md font-extrabold text-[10px] uppercase border ${
                          row.algorithmUsed === 'ASTAR' 
                            ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' 
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {row.algorithmUsed}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200">
                        {getNodeName(row.originNode)} → {getNodeName(row.destinationNode)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{Number(row.totalDistanceKm).toFixed(2)} km</td>
                      <td className="p-3.5 text-slate-500">{row.nodesVisitedCount} locations</td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">{row.computedAt || 'Just now'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500">No past trips found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}