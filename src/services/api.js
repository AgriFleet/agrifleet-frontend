// src/services/api.js
import axios from 'axios';

// ==========================================
// MICROSERVICE PORT CONFIGURATION
// ==========================================
const SERVICES = {
  CORE:       process.env.NEXT_PUBLIC_CORE_URL       || 'http://localhost:8080/api/v1',
  ROUTING:    process.env.NEXT_PUBLIC_ROUTING_URL    || 'http://localhost:8081/api/v1',
  ALLOCATION: process.env.NEXT_PUBLIC_ALLOCATION_URL || 'http://localhost:8082/api/v1',
  NETWORK:    process.env.NEXT_PUBLIC_NETWORK_URL    || 'http://localhost:8083/api/v1',
  DECISION:   process.env.NEXT_PUBLIC_DECISION_URL   || 'http://localhost:8084/api/v1',
  TOUR:       process.env.NEXT_PUBLIC_TOUR_URL       || 'http://localhost:8085/api/v1',
};

const createClient = (baseURL) => axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

const coreClient = createClient(SERVICES.CORE);
const routingClient = createClient(SERVICES.ROUTING);
const allocationClient = createClient(SERVICES.ALLOCATION);
const networkClient = createClient(SERVICES.NETWORK);
const decisionClient = createClient(SERVICES.DECISION);
const tourClient = createClient(SERVICES.TOUR);

// ==========================================
// CENTRALIZED API SERVICE EXPORT
// ==========================================
export const api = {
  
  // 0. SHARED CORE DOMAIN
  core: {
    getAllVehicles: () => coreClient.get('/vehicles'),
    getVehicleById: (id) => coreClient.get(`/vehicles/${id}`),
    createVehicle: (vehicleData) => coreClient.post('/vehicles', vehicleData),
    updateVehicle: (id, vehicleData) => coreClient.put(`/vehicles/${id}`, vehicleData),
    deleteVehicle: (id) => coreClient.delete(`/vehicles/${id}`),

    getAllDepots: () => coreClient.get('/depots'),
    getDepotById: (id) => coreClient.get(`/depots/${id}`),
    createDepot: (depotData) => coreClient.post('/depots', depotData),
    updateDepot: (id, depotData) => coreClient.put(`/depots/${id}`, depotData),
    deleteDepot: (id) => coreClient.delete(`/depots/${id}`),
    
    getAllBookings: () => coreClient.get('/bookings'),
    getBookingById: (id) => coreClient.get(`/bookings/${id}`),
    createBooking: (bookingData) => coreClient.post('/bookings', bookingData),
    updateBookingStatus: (id, status) => coreClient.put(`/bookings/${id}/status?status=${status}`),
    deleteBooking: (id) => coreClient.delete(`/bookings/${id}`),
  },

  // 1. TASK 1: ROUTE OPTIMIZATION (Port 8081)
  routing: {
    getRoadNodes: () => routingClient.get('/routing/nodes'),
    getRoadEdges: () => routingClient.get('/routing/edges'),
    calculateRouteAStar: (origin, destination) => routingClient.get(`/routing/optimize/astar?start=${origin}&target=${destination}`),
    calculateRouteDijkstra: (origin, destination) => routingClient.get(`/routing/optimize/dijkstra?start=${origin}&target=${destination}`),
    getRouteCache: () => routingClient.get('/routing/cache'),
  },

  // 2. TASK 2: RESOURCE ALLOCATION (Port 8082)
  allocation: {
    runScheduledBatch: (payload) => allocationClient.post('/allocation/batch/hungarian', payload),
    runRealtimeGreedy: (bookingId) => allocationClient.post(`/allocation/realtime/greedy?bookingId=${bookingId}`),
    getAllocationBatches: () => allocationClient.get('/allocation/batches'),
    getAllocatedAssignments: (batchId) => allocationClient.get(`/allocation/assignments?batchId=${batchId}`),
    confirmAssignment: (assignmentId) => allocationClient.put(`/allocation/assignments/${assignmentId}/confirm`),
  },

  // 3. TASK 3: NETWORK ANALYSIS (Port 8083)
  network: {
    getGraph: () => networkClient.get('/network-analysis/graph'),
    analyzeRegion: (regionId) => networkClient.get(`/network-analysis/analyze?regionId=${regionId}`),
    detectBridges: (regionId) => networkClient.get(`/network-analysis/bridges/detect?regionId=${regionId}`),
    calculateMST: (regionId) => networkClient.get(`/network-analysis/mst/calculate?regionId=${regionId}`),
    getNetworkCuts: () => networkClient.get('/network-analysis/cuts'),
    getMSTBackbone: () => networkClient.get('/network-analysis/backbone'),
    checkWeightLimit: (uNode, vNode, weight) => networkClient.post('/network-analysis/weight-check', { uNode, vNode, vehicleWeightTonnes: weight }),
  },

  // 4. TASK 4: INTELLIGENT DECISION SERVICE (Port 8084)
  decision: {
    runTopsisRanking: (bookingId, weights) => decisionClient.post(`/decision-se/topsis/rank?bookingId=${bookingId}`, weights),
    getTopsisDecisionRuns: () => decisionClient.get('/decision/topsis/runs'),
    getRankedCandidates: (decisionRunId) => decisionClient.get(`/decision/topsis/candidates?runId=${decisionRunId}`),
    predictHarvestDelay: (bookingId) => decisionClient.post(`/decision/delays/predict?bookingId=${bookingId}`),
    getDelayPredictions: () => decisionClient.get('/decision/delays/history'),
  },

  // 5. TASK 5: TOUR & MULTI-JOB OPTIMIZATION (Port 8085)
  selection: {
    getAvailableFarms: () => tourClient.get('/selection/farms'),
    maximizeAcreageValue: (payload) => tourClient.post('/selection/maximize-acreage-value', payload),
  },
  tour: {
    optimizeSequence: (payload) => tourClient.post('/tours/optimize-sequence', payload),
    optimizeGeneticAlgorithm: (payload) => tourClient.post('/sequence/optimize-genetic-algorithm', payload),
  }
};
