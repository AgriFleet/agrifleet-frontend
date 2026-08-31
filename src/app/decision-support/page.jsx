'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { 
  BrainCircuit, 
  CloudRain, 
  RefreshCw, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Settings2,
  Tractor,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function DecisionSupportPage() {
  const { showSuccess, showError } = useToast();
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
      setRuns(runsRes.data || []);
      setPredictions(predsRes.data || []);
    } catch (err) {
      console.error('Failed to load decision support data', err);
      showError('Failed to sync decision support data from Port 8084');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const demoBookingId = Math.floor(Math.random() * 8) + 1;
      const demoWeights = { cost: 0.35, distance: 0.25, hp: 0.20, rating: 0.20 };
      
      await Promise.all([
        api.decision.runTopsisRanking(demoBookingId, demoWeights),
        api.decision.predictHarvestDelay(demoBookingId)
      ]);
      
      await loadData();
      showSuccess(`📊 TOPSIS evaluation and ML delay prediction simulated for Booking #${demoBookingId}!`);
    } catch (err) {
      showError('Simulation failed: ' + (err.response?.data?.message || err.message));
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
        return { color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> };
      case 'MODERATE_RISK': 
        return { color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> };
      case 'CRITICAL_DELAY': 
        return { color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30', icon: <ShieldAlert className="w-3.5 h-3.5 mr-1" /> };
      default: 
        return { color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', icon: null };
    }
  };

  // Prepare Chart Data for Risk Tier breakdown
  const riskChartData = [
    { tier: 'Low Risk', count: predictions.filter(p => p.predictedRiskTier === 'LOW_RISK').length, fill: '#34d399' },
    { tier: 'Moderate', count: predictions.filter(p => p.predictedRiskTier === 'MODERATE_RISK').length, fill: '#fbbf24' },
    { tier: 'Critical', count: predictions.filter(p => p.predictedRiskTier === 'CRITICAL_DELAY').length, fill: '#f87171' },
  ];

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/60 via-slate-900 to-black opacity-90" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Task 4 • Port 8084 Engine
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Intelligent <span className="gradient-text-emerald">Decision Support System</span>
              </h1>
              <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                Multi-criteria machinery ranking (TOPSIS) and automated ML harvest delay risk prediction models.
              </p>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={loadData}
                disabled={loading || simulating}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-colors border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button 
                onClick={handleSimulate}
                disabled={loading || simulating}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
                <span>Simulate Run</span>
              </button>
            </div>
          </div>
        </div>

        {/* Risk Distribution Chart Summary */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Predictive Machine Learning</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Harvest Delay Risk Overview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time classification based on precipitation probabilities and historical equipment breakdown telemetry.
            </p>
          </div>

          <div className="h-36 w-full lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={11} hide />
                <YAxis dataKey="tier" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* TOPSIS Runs Panel */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-500" />
                TOPSIS Fleet Evaluations
              </h2>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-xs font-extrabold border border-indigo-500/20">
                {runs.length} Runs
              </span>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[550px] pr-1">
              {runs.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 py-16">
                  <Tractor className="w-12 h-12 opacity-20" />
                  <p className="text-xs">No TOPSIS evaluation runs recorded yet.</p>
                </div>
              )}
              
              {runs.map(r => {
                const weights = parseWeights(r.criteriaWeights);
                return (
                  <div 
                    key={r.decisionRunId} 
                    className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          Booking #{r.bookingId}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
                          Run ID: #{r.decisionRunId} • Farmer #{r.farmerId}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <p className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-wider">Criteria Weights</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(weights).map(([key, val]) => (
                          <span key={key} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300">
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
          <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-sky-500" />
                Harvest Delay Risk Predictions
              </h2>
              <span className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-full text-xs font-extrabold border border-sky-500/20">
                {predictions.length} Predictions
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[550px] pr-1">
              {predictions.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 py-16">
                  <CloudRain className="w-12 h-12 opacity-20" />
                  <p className="text-xs">No delay predictions recorded yet.</p>
                </div>
              )}

              {predictions.map(p => {
                const risk = getRiskUI(p.predictedRiskTier);
                const rainPct = (p.rainProbability * 100).toFixed(0);
                
                return (
                  <div 
                    key={p.predictionId} 
                    className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                          Booking #{p.bookingId}
                        </span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                          Field Acreage: {p.fieldAcres.toFixed(1)} Acres
                        </p>
                      </div>
                      
                      <div className={`px-3 py-1 border rounded-full text-xs font-extrabold flex items-center ${risk.color}`}>
                        {risk.icon}
                        {p.predictedRiskTier.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Precipitation Probability</span>
                          <span className="text-sky-500 font-bold">{rainPct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${p.rainProbability > 0.6 ? 'bg-sky-500' : 'bg-sky-400'}`} 
                            style={{ width: `${rainPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500 dark:text-slate-400">Historical Equipment Breakdowns:</span>
                        <span className={`font-bold font-mono ${p.vehicleBreakdownHistory > 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
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
    </div>
  );
}