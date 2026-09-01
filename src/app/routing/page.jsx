'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { 
  Navigation, 
  MapPin, 
  Zap, 
  Clock, 
  Route as RouteIcon, 
  History, 
  Play, 
  CheckCircle2, 
  Cpu,
  ArrowRight
} from 'lucide-react';

export default function RoutingPage() {
  const { showSuccess, showError } = useToast();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [origin, setOrigin] = useState(1);
  const [dest, setDest] = useState(4);
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
      setNodes(nodesRes.data || []);
      setEdges(edgesRes.data || []);
      setCachedRoutes(cacheRes.data || []);
    } catch (err) {
      console.error('Failed to load initial routing infrastructure data', err);
      showError('Failed to sync road network nodes from Port 8081');
    }
  };

  const getNodeName = (nodeId) => {
    const found = nodes.find(n => n.nodeId === nodeId);
    return found ? found.nodeName : `Node ID: ${nodeId}`;
  };

  const handleCalculateRoute = async (algorithm) => {
    setLoading(true);
    setRouteResult(null);
    try {
      const res = algorithm === 'astar'
        ? await api.routing.calculateRouteAStar(origin, dest)
        : await api.routing.calculateRouteDijkstra(origin, dest);
      
      setRouteResult(res.data);
      showSuccess(`🗺️ Shortest path calculated using ${algorithm === 'astar' ? 'A* Search' : 'Dijkstra'}!`);
      
      // Refresh cache log
      const cacheRes = await api.routing.getRouteCache();
      setCachedRoutes(cacheRes.data || []);
    } catch (err) {
      showError('Route calculation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px]" />
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
                Task 1 • Port 8081 Engine
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Weather-Aware <span className="gradient-text-cyan">Route Optimization</span>
              </h1>
              <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                A* Search and Dijkstra algorithms calculating shortest paths considering weather-aware road resistance.
              </p>
            </div>
            
            <div className="bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700/80 backdrop-blur-sm text-right">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Network Topology</div>
              <div className="text-sm font-extrabold text-sky-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                {nodes.length} Nodes | {edges.length} Edges
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Path Controls Column */}
          <div className="glass-panel p-6 rounded-3xl space-y-5 h-fit">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" />
              Route Parameters
            </h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Origin Location (Depot / Junction)
              </label>
              <select 
                value={origin} 
                onChange={e => setOrigin(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              >
                {nodes.map(n => (
                  <option key={n.nodeId} value={n.nodeId}>
                    {n.nodeName} {n.isDepot ? '📦 [Depot]' : n.isFarmGate ? '🌾 [Farm Gate]' : '📍'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Destination Farm Gate / Node
              </label>
              <select 
                value={dest} 
                onChange={e => setDest(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              >
                {nodes.map(n => (
                  <option key={n.nodeId} value={n.nodeId}>
                    {n.nodeName} {n.isDepot ? '📦 [Depot]' : n.isFarmGate ? '🌾 [Farm Gate]' : '📍'}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button 
                onClick={() => handleCalculateRoute('astar')}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{loading ? 'Executing A*...' : 'Run A* Heuristic Search'}</span>
              </button>
              
              <button 
                onClick={() => handleCalculateRoute('dijkstra')}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl text-xs font-bold transition-colors border border-slate-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? 'Executing Dijkstra...' : 'Run Dijkstra Search'}</span>
              </button>
            </div>
          </div>

          {/* Results Console / Visual UI (Right 2 Columns) */}
          <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <RouteIcon className="w-5 h-5 text-sky-500" />
                  Optimized Route Summary
                </h2>
                {routeResult && (
                  <span className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
                    Algorithm: {routeResult.algorithm}
                  </span>
                )}
              </div>

              {routeResult ? (
                <div className="space-y-6">
                  {/* Metric Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Distance</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                        {routeResult.totalDistanceKm} <span className="text-xs font-normal text-slate-400">km</span>
                      </span>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Travel Duration</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                        {routeResult.totalTravelTimeMins} <span className="text-xs font-normal text-slate-400">mins</span>
                      </span>
                    </div>
                    <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Vertices Visited</span>
                      <span className="text-2xl font-black text-sky-500 mt-1 block">
                        {routeResult.nodesVisitedCount} <span className="text-xs font-normal text-slate-400">nodes</span>
                      </span>
                    </div>
                  </div>

                  {/* Step-by-Step Visual Timeline */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      Turn-by-Turn Navigation Path
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
                              <span className="w-7 h-7 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-sky-500/20">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">
                                  {matchedNode ? matchedNode.nodeName : `Node ID: ${nodeId}`}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {matchedNode?.isDepot ? 'Machinery Depot Hub' : matchedNode?.isFarmGate ? 'Target Farm Plot Gate' : 'Junction Waypoint'}
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
                <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 text-xl font-bold">
                    🗺️
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No route calculated yet</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Select origin & destination parameters and execute A* or Dijkstra search.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Execution Cache History */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-sky-500" />
              Route Execution Cache History
            </h2>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Cached Rows: {cachedRoutes.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">Route ID</th>
                  <th className="p-3.5">Algorithm</th>
                  <th className="p-3.5">Origin → Destination</th>
                  <th className="p-3.5">Distance</th>
                  <th className="p-3.5">Visited Nodes</th>
                  <th className="p-3.5">Computed At</th>
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
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{row.totalDistanceKm} km</td>
                      <td className="p-3.5 text-slate-500">{row.nodesVisitedCount} vertices</td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">{row.computedAt || 'Just now'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500">No cached route execution entries found.</td>
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
