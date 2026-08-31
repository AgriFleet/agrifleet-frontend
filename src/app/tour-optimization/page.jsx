'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { 
  Route as RouteIcon, 
  Sparkles, 
  CheckCircle2, 
  Fuel, 
  Compass, 
  TrendingUp, 
  MapPin, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const depot = {
  id: 0,
  name: 'Depot Hub',
  latitude: 52.629729,
  longitude: -1.131592,
};

const availableFarms = [
  { id: 1, name: 'North Ridge', acreageHa: 120, bookingValue: 24000, cropType: 'Wheat', latitude: 52.640101, longitude: -1.120701 },
  { id: 2, name: 'East Orchard', acreageHa: 95, bookingValue: 18500, cropType: 'Apples', latitude: 52.621874, longitude: -1.101988 },
  { id: 3, name: 'South Meadow', acreageHa: 145, bookingValue: 31000, cropType: 'Barley', latitude: 52.612966, longitude: -1.155812 },
  { id: 4, name: 'West Field', acreageHa: 110, bookingValue: 22500, cropType: 'Potatoes', latitude: 52.635432, longitude: -1.169430 },
  { id: 5, name: 'River Plot', acreageHa: 175, bookingValue: 38000, cropType: 'Maize', latitude: 52.648902, longitude: -1.142805 },
  { id: 6, name: 'Old Barn', acreageHa: 80, bookingValue: 16000, cropType: 'Clover', latitude: 52.615520, longitude: -1.183401 },
];

const createOptimizationPayload = (farms) => ({
  depot,
  farms: farms.map((farm) => ({
    id: farm.id,
    name: farm.name,
    latitude: farm.latitude,
    longitude: farm.longitude,
  })),
  returnToDepot: true,
  fuelConsumptionLitresPerKm: 0.12,
  populationSize: 80,
  generations: 120,
  mutationRate: 0.02,
});

export default function TourOptimizationPage() {
  const { showSuccess, showError } = useToast();
  const [selectionResult, setSelectionResult] = useState(null);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [loadingOptimization, setLoadingOptimization] = useState(false);

  const handleSelectFarms = async () => {
    setLoadingSelection(true);
    setOptimizationResult(null);

    try {
      const response = await api.selection.maximizeAcreageValue({
        availableFarms: availableFarms.map((farm) => ({
          id: farm.id,
          name: farm.name,
          acreageHa: farm.acreageHa,
          bookingValue: farm.bookingValue,
          cropType: farm.cropType,
        })),
        maxFarms: 3,
        acreageWeight: 0.6,
        bookingValueWeight: 0.4,
      });

      setSelectionResult(response.data);
      showSuccess('🌾 Best farm opportunities selected successfully!');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Task 5 selection failed.');
      setSelectionResult(null);
    } finally {
      setLoadingSelection(false);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!selectionResult || !selectionResult.selectedFarms?.length) {
      showError('Select farms first so the route can be optimized.');
      return;
    }

    setLoadingOptimization(true);

    try {
      const selectedFarms = selectionResult.selectedFarms.map((farm) => {
        const source = availableFarms.find((item) => item.id === farm.id);
        return source || farm;
      });

      const payload = createOptimizationPayload(selectedFarms);
      const response = await api.tour.optimizeSequence(payload);
      setOptimizationResult(response.data);
      showSuccess('🧬 Genetic Algorithm route sequence optimized!');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Route optimization failed.');
      setOptimizationResult(null);
    } finally {
      setLoadingOptimization(false);
    }
  };

  // Recharts data format for available farm opportunities
  const farmChartData = availableFarms.map(f => ({
    name: f.name,
    Acreage: f.acreageHa,
    Value: f.bookingValue / 100
  }));

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Advanced Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/60 via-slate-900 to-black opacity-90" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                Task 5 • Port 8085 Engine
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Multi-Job Tour <span className="gradient-text-purple">Optimization</span>
              </h1>
              <p className="text-slate-300 text-sm mt-3 max-w-xl leading-relaxed">
                Maximize farm revenue selection & Genetic Algorithm TSP route sequencing for lowest-distance operator shift schedules.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={handleSelectFarms}
                disabled={loadingSelection}
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 text-xs whitespace-nowrap disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loadingSelection ? 'Selecting...' : 'Select Best Farms'}</span>
              </button>
              
              <button
                onClick={handleOptimizeRoute}
                disabled={loadingOptimization || !selectionResult}
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-105 text-xs whitespace-nowrap disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{loadingOptimization ? 'Optimizing...' : 'Optimize Route (GA)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Chart Comparison */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Trade-Off Analysis</span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Acreage vs. Booking Value Breakdown
            </h2>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={farmChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="Acreage" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Value" fill="#c084fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Available Opportunities */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              Available Farm Opportunities
            </h2>

            <div className="space-y-3">
              {availableFarms.map((farm) => (
                <div 
                  key={farm.id} 
                  className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{farm.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">🌾 Crop: {farm.cropType}</div>
                  </div>
                  
                  <div className="text-right font-mono text-xs font-bold">
                    <div className="text-emerald-500">{farm.acreageHa} ha</div>
                    <div className="text-purple-400">£{farm.bookingValue.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farm Selection Outcome */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Maximized Farm Selection Outcome
            </h2>

            {!selectionResult ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Sparkles className="w-10 h-10 opacity-30" />
                <p className="text-xs font-semibold">No farm selection has been run yet.</p>
                <p className="text-[11px] text-slate-500">Click "Select Best Farms" above to maximize objective value.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="text-[10px] font-bold text-emerald-500 uppercase">Total Acreage</div>
                    <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      {selectionResult.totalAcreageHa.toFixed(1)} ha
                    </div>
                  </div>
                  
                  <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="text-[10px] font-bold text-emerald-500 uppercase">Booking Value</div>
                    <div className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      £{selectionResult.totalBookingValue.toLocaleString()}
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
                    <div className="text-[10px] font-bold text-purple-400 uppercase">Algorithm</div>
                    <div className="mt-1 text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {selectionResult.algorithm}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Farm Plots</h3>
                  {selectionResult.selectedFarms.map((farm) => (
                    <div key={farm.id} className="glass-card p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{farm.name}</div>
                        <div className="text-slate-400">{farm.cropType}</div>
                      </div>
                      <div className="text-right font-mono font-bold">
                        <div className="text-emerald-500">{farm.acreageHa} ha</div>
                        <div className="text-purple-400">£{farm.bookingValue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Optimized Visit Sequence */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-500" />
            Genetic Algorithm Visit Sequence
          </h2>

          {!optimizationResult ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <RouteIcon className="w-10 h-10 opacity-30" />
              <p className="text-xs font-semibold">Route sequence not yet optimized.</p>
              <p className="text-[11px] text-slate-500">Select farms and click "Optimize Route" to run GA TSP engine.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-bold uppercase">Total Tour Distance</div>
                  <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                    {optimizationResult.totalDistanceKm.toFixed(2)} <span className="text-xs font-normal text-slate-400">km</span>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    Fuel Estimate
                  </div>
                  <div className="mt-1 text-2xl font-black text-amber-400">
                    {optimizationResult.estimatedFuelLitres.toFixed(2)} <span className="text-xs font-normal text-slate-400">L</span>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 font-bold uppercase">Genetic Algorithm</div>
                  <div className="mt-1 text-base font-extrabold text-purple-400">
                    {optimizationResult.algorithm}
                  </div>
                </div>
              </div>

              {/* Sequence Timeline Code Block */}
              <div className="glass-card p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Visit Flow</span>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {optimizationResult.visitSequence.map((loc, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-purple-300 font-mono text-xs font-bold shadow">
                        {loc.name} (#{loc.id})
                      </span>
                      {idx < optimizationResult.visitSequence.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-purple-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}