'use client';

import { useState } from 'react';
import { api } from '@/services/api';

const depot = {
  id: 0,
  name: 'Depot',
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
  const [selectionResult, setSelectionResult] = useState(null);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [loadingOptimization, setLoadingOptimization] = useState(false);
  const [error, setError] = useState('');

  const handleSelectFarms = async () => {
    setLoadingSelection(true);
    setError('');
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
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Task 5 selection failed.');
      setSelectionResult(null);
    } finally {
      setLoadingSelection(false);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!selectionResult || !selectionResult.selectedFarms?.length) {
      setError('Select farms first so the route can be optimized.');
      return;
    }

    setLoadingOptimization(true);
    setError('');

    try {
      const selectedFarms = selectionResult.selectedFarms.map((farm) => {
        const source = availableFarms.find((item) => item.id === farm.id);
        return source || farm;
      });

      const payload = createOptimizationPayload(selectedFarms);
      const response = await api.tour.optimizeSequence(payload);
      setOptimizationResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Route optimization failed.');
      setOptimizationResult(null);
    } finally {
      setLoadingOptimization(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-purple-400 font-semibold text-xs uppercase tracking-wider">Microservice Port 8085</span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Task 5: Multi-Job Tour Optimization</h1>
          <p className="text-slate-300 text-sm mt-1">AG-19 farm selection plus AG-18/AG-20 route sequencing for the highest-value, lowest-distance operator schedule.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSelectFarms}
            disabled={loadingSelection}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl shadow transition-colors text-sm whitespace-nowrap"
          >
            {loadingSelection ? 'Selecting...' : 'Select Best Farms'}
          </button>
          <button
            onClick={handleOptimizeRoute}
            disabled={loadingOptimization || !selectionResult}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl shadow transition-colors text-sm whitespace-nowrap"
          >
            {loadingOptimization ? 'Optimizing...' : 'Optimize Route'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Available Farm Opportunities</h2>
          <div className="space-y-3">
            {availableFarms.map((farm) => (
              <div key={farm.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800">{farm.name}</div>
                    <div className="text-xs text-slate-500">{farm.cropType}</div>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <div>{farm.acreageHa} ha</div>
                    <div>£{farm.bookingValue.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Farm Selection Outcome</h2>

          {!selectionResult && (
            <div className="text-slate-500">No farm selection has been run yet. Use the selector to rank the best opportunities.</div>
          )}

          {selectionResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-emerald-700">Total acreage</div>
                  <div className="mt-1 text-xl font-bold text-slate-800">{selectionResult.totalAcreageHa.toFixed(1)} ha</div>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-emerald-700">Booking value</div>
                  <div className="mt-1 text-xl font-bold text-slate-800">£{selectionResult.totalBookingValue.toLocaleString()}</div>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="text-emerald-700">Objective</div>
                  <div className="mt-1 text-sm font-bold text-slate-800">{selectionResult.algorithm}</div>
                </div>
              </div>

              <div className="space-y-2">
                {selectionResult.selectedFarms.map((farm) => (
                  <div key={farm.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-800">{farm.name}</div>
                      <div className="text-slate-500">{farm.cropType}</div>
                    </div>
                    <div className="text-right text-slate-600">
                      <div>{farm.acreageHa} ha</div>
                      <div>£{farm.bookingValue.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Optimized Visit Sequence</h2>

        {!optimizationResult && (
          <div className="text-slate-500">Select the best farms and then optimize the route order to see the recommended depot-to-farm sequence.</div>
        )}

        {optimizationResult && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="text-slate-500">Total distance</div>
                <div className="mt-1 text-xl font-bold text-slate-800">{optimizationResult.totalDistanceKm.toFixed(2)} km</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="text-slate-500">Fuel estimate</div>
                <div className="mt-1 text-xl font-bold text-slate-800">{optimizationResult.estimatedFuelLitres.toFixed(2)} L</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="text-slate-500">Algorithm</div>
                <div className="mt-1 text-xl font-bold text-slate-800">{optimizationResult.algorithm}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500 block mb-2">Recommended route</div>
              <code className="block bg-slate-900 text-purple-300 p-3 rounded-xl text-xs font-mono overflow-x-auto">
                {optimizationResult.visitSequence.map((location) => `${location.name} (${location.id})`).join(' → ')}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}