'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export default function RoutingPage() {
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
      setNodes(nodesRes.data);
      setEdges(edgesRes.data);
      setCachedRoutes(cacheRes.data);
    } catch (err) {
      console.error('Failed to load initial routing infrastructure data', err);
    }
  };

  // Helper to map node IDs to friendly names
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
      
      // Refresh cache log list
      const cacheRes = await api.routing.getRouteCache();
      setCachedRoutes(cacheRes.data);
    } catch (err) {
      alert('Route calculation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Microservice Port 8081</span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Task 1: Route Optimization</h1>
          <p className="text-slate-300 text-sm mt-1">Compute weather-aware shortest paths using A* Search and Dijkstra algorithms.</p>
        </div>
        <div className="text-right bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
          <div className="text-xs text-slate-400">Network Topology</div>
          <div className="text-sm font-semibold text-emerald-400">{nodes.length} Nodes | {edges.length} Edges</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card (Left Column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Path Parameters</h2>
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Origin Location (Depot / Junction)</label>
            <select 
              value={origin} 
              onChange={e => setOrigin(Number(e.target.value))}
              className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
            >
              {nodes.map(n => (
                <option key={n.nodeId} value={n.nodeId}>
                  {n.nodeName} {n.isDepot ? '📦 [Depot]' : n.isFarmGate ? '🌾 [Farm Gate]' : '📍'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Destination Farm Gate / Node</label>
            <select 
              value={dest} 
              onChange={e => setDest(Number(e.target.value))}
              className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
            >
              {nodes.map(n => (
                <option key={n.nodeId} value={n.nodeId}>
                  {n.nodeName} {n.isDepot ? '📦 [Depot]' : n.isFarmGate ? '🌾 [Farm Gate]' : '📍'}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button 
              onClick={() => handleCalculateRoute('astar')}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow"
            >
              {loading ? 'Running...' : 'Run A* Search'}
            </button>
            <button 
              onClick={() => handleCalculateRoute('dijkstra')}
              disabled={loading}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow"
            >
              {loading ? 'Running...' : 'Run Dijkstra'}
            </button>
          </div>
        </div>

        {/* Results Console / Visual UI (Right Column) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Optimized Route Summary</h2>
              {routeResult && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Algorithm: {routeResult.algorithm}
                </span>
              )}
            </div>

            {routeResult ? (
              <div className="space-y-6">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Distance</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">{routeResult.totalDistanceKm} <span className="text-xs font-normal text-slate-500">km</span></span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Estimated Time</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">{routeResult.totalTravelTimeMins} <span className="text-xs font-normal text-slate-500">mins</span></span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Nodes Explored</span>
                    <span className="text-xl font-extrabold text-blue-600 mt-1 block">{routeResult.nodesVisitedCount} <span className="text-xs font-normal text-slate-500">vertices</span></span>
                  </div>
                </div>

                {/* Step-by-Step Visual Timeline */}
                <div>
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Turn-by-Turn Navigation Path</h3>
                  <div className="space-y-2 border-l-2 border-blue-500 pl-4 ml-2">
                    {routeResult.pathNodeSequence?.map((nodeId, idx) => {
                      const matchedNode = nodes.find(n => n.nodeId === nodeId);
                      return (
                        <div key={idx} className="relative flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-slate-800">
                                {matchedNode ? matchedNode.nodeName : `Node ID: ${nodeId}`}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {matchedNode?.isDepot ? 'Machinery Depot Hub' : matchedNode?.isFarmGate ? 'Target Farm Plot Gate' : 'Junction Waypoint'}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                            ID #{nodeId}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 mb-3 font-bold text-lg">🗺️</div>
                <p className="text-sm font-semibold text-slate-700">No route calculated yet</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">Select your origin and destination parameters from the left panel and execute A* or Dijkstra search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution Cache History Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Route Execution Cache History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <th className="p-3 rounded-l-xl">ID</th>
                <th className="p-3">Algorithm</th>
                <th className="p-3">Origin $\rightarrow$ Dest</th>
                <th className="p-3">Distance (km)</th>
                <th className="p-3">Visited Nodes</th>
                <th className="p-3 rounded-r-xl">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {cachedRoutes.length > 0 ? (
                cachedRoutes.map(row => (
                  <tr key={row.routeId} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">#{row.routeId}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-md font-bold text-[10px] ${row.algorithmUsed === 'ASTAR' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                        {row.algorithmUsed}
                      </span>
                    </td>
                    <td className="p-3">
                      {getNodeName(row.originNode)} $\rightarrow$ {getNodeName(row.destinationNode)}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{row.totalDistanceKm} km</td>
                    <td className="p-3">{row.nodesVisitedCount} nodes</td>
                    <td className="p-3 text-slate-400">{row.computedAt || 'Just now'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-400">No cached route execution entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}