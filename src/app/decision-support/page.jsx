'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { 
  BrainCircuit, 
  CloudRain, 
  RefreshCw, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Settings2,
  Tractor
} from 'lucide-react';

export default function DecisionSupportPage() {
  const [runs, setRuns] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [runsRes, predsRes] = await Promise.all([
        api.decision.getTopsisDecisionRuns(),
        api.decision.getDelayPredictions()
      ]);
      setRuns(runsRes.data);
      setPredictions(predsRes.data);
    } catch (err) {
      console.error('Failed to load decision support data', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulate a new decision run to show off the backend functionality
  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const demoBookingId = Math.floor(Math.random() * 8) + 1; // Random booking ID 1-8
      const demoWeights = { cost: 0.35, distance: 0.25, hp: 0.20, rating: 0.20 };
      
      await Promise.all([
        api.decision.runTopsisRanking(demoBookingId, demoWeights),
        api.decision.predictHarvestDelay(demoBookingId)
      ]);
      
      await loadData();
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setSimulating(false);
    }
  };

  const parseWeights = (weightsStr) => {
    try {
      return JSON.parse(weightsStr);
    } catch {
      return {};
    }
  };

  const getRiskUI = (tier) => {
    switch (tier) {
      case 'LOW_RISK': 
        return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle className="w-4 h-4 mr-1" /> };
      case 'MODERATE_RISK': 
        return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <AlertTriangle className="w-4 h-4 mr-1" /> };
      case 'CRITICAL_DELAY': 
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: <AlertTriangle className="w-4 h-4 mr-1" /> };
      default: 
        return { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: null };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-semibold text-xs uppercase tracking-wider">Microservice Port 8084</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Intelligent Decision Support</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl">
            Multi-criteria machinery ranking (TOPSIS) and automated harvest delay risk prediction models.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadData}
            disabled={loading || simulating}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handleSimulate}
            disabled={loading || simulating}
            className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-md shadow-amber-500/20"
          >
            {simulating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Simulate Run
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* TOPSIS Runs Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <Settings2 className="w-5 h-5 mr-2 text-indigo-500" />
              TOPSIS Fleet Evaluations
            </h2>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
              {runs.length} Runs
            </span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2">
            {runs.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-12">
                <Tractor className="w-12 h-12 opacity-20" />
                <p className="text-sm">No evaluation runs recorded yet.</p>
              </div>
            )}
            
            {runs.map(r => {
              const weights = parseWeights(r.criteriaWeights);
              return (
                <div key={r.decisionRunId} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Booking #{r.bookingId}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Run ID: {r.decisionRunId} • Farmer: {r.farmerId}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Criteria Weights</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(weights).map(([key, val]) => (
                        <span key={key} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 flex items-center shadow-sm">
                          <span className="text-slate-400 mr-1">{key}:</span> {(val * 100).toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Harvest Delay Predictions Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <CloudRain className="w-5 h-5 mr-2 text-sky-500" />
              Harvest Delay Risks
            </h2>
            <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold border border-sky-100">
              {predictions.length} Predictions
            </span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2">
            {predictions.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-12">
                <CloudRain className="w-12 h-12 opacity-20" />
                <p className="text-sm">No delay predictions recorded yet.</p>
              </div>
            )}

            {predictions.map(p => {
              const risk = getRiskUI(p.predictedRiskTier);
              const rainPct = (p.rainProbability * 100).toFixed(0);
              
              return (
                <div key={p.predictionId} className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Booking #{p.bookingId}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{p.fieldAcres.toFixed(1)} Acres</p>
                    </div>
                    <div className={`px-3 py-1.5 border rounded-full text-xs font-bold flex items-center ${risk.color}`}>
                      {risk.icon}
                      {p.predictedRiskTier.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Rain Probability Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Rain Probability</span>
                        <span className="text-slate-700 font-bold">{rainPct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${p.rainProbability > 0.6 ? 'bg-sky-500' : 'bg-sky-300'}`} 
                          style={{ width: `${rainPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Breakdown History */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Historical Breakdowns:</span>
                      <span className={`font-bold ${p.vehicleBreakdownHistory > 0 ? 'text-red-500' : 'text-slate-700'}`}>
                        {p.vehicleBreakdownHistory} Incidents
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}