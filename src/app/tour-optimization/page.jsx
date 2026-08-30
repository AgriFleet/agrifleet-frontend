'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export default function TourOptimizationPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    try {
      const res = await api.tour.getDailyTours();
      setTours(res.data);
    } catch (err) {
      console.error('Failed to load tours', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTour = async () => {
    try {
      await api.tour.generateDailyTour({ vehicleId: 1, date: '2026-09-01' });
      loadTours();
      alert('Genetic Algorithm tour optimization completed successfully!');
    } catch (err) {
      alert('Tour generation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-purple-400 font-semibold text-xs uppercase tracking-wider">Microservice Port 8085</span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Task 5: Multi-Job Tour Optimization</h1>
          <p className="text-slate-300 text-sm mt-1">Genetic Algorithm (TSP) tour sequencing and profit-maximizing shift management.</p>
        </div>
        <button 
          onClick={handleGenerateTour}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-colors text-sm whitespace-nowrap"
        >
          Run GA Tour Optimizer 🧬
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Daily Operator Tours</h2>
        {loading ? (
          <p className="text-slate-500 py-4 animate-pulse">Loading tours...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tours.map(t => (
              <div key={t.tour_id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Tour #{t.tour_id}</h3>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                    {t.tour_status}
                  </span>
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><span className="font-semibold text-slate-700">Vehicle ID:</span> {t.vehicle_id}</p>
                  <p><span className="font-semibold text-slate-700">Tour Date:</span> {t.tour_date}</p>
                  <p><span className="font-semibold text-slate-700">Total Distance:</span> {t.total_tour_distance_km} km</p>
                  <p><span className="font-semibold text-slate-700">Total Acreage:</span> {t.total_acreage_harvested} acres</p>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Optimal Stop Sequence:</span>
                  <code className="block bg-slate-900 text-purple-300 p-2.5 rounded-xl text-xs font-mono overflow-x-auto">
                    {t.optimal_stop_sequence}
                  </code>
                </div>
              </div>
            ))}
            {tours.length === 0 && (
              <div className="col-span-2 py-8 text-center text-slate-400">
                No daily operator tours found. Run the optimizer above to generate tours!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}