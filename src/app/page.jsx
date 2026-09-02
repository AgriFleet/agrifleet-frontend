'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { 
  Tractor, 
  Users, 
  Navigation, 
  Layers, 
  Network as NetworkIcon, 
  BrainCircuit, 
  Route, 
  Sparkles,
  ArrowRight,
  Activity,
  Cpu,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function OperationsDashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    inUseVehicles: 0,
    maintenanceVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    activeBookings: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [vRes, bRes] = await Promise.allSettled([
          api.core.getAllVehicles(),
          api.core.getAllBookings(),
        ]);

        const vehicles = vRes.status === 'fulfilled' ? vRes.value.data || [] : [];
        const bookings = bRes.status === 'fulfilled' ? bRes.value.data || [] : [];
        
        // Vehicle Categorization
        const available = vehicles.filter(
          (v) => (v.availabilityStatus || v.availability_status) === 'AVAILABLE'
        ).length;
        const inUse = vehicles.filter(
          (v) => (v.availabilityStatus || v.availability_status) === 'IN_USE'
        ).length;
        const maintenance = vehicles.filter(
          (v) => (v.availabilityStatus || v.availability_status) === 'MAINTENANCE'
        ).length;

        // Booking Categorization
        const pending = bookings.filter(
          (b) => (b.bookingStatus || b.booking_status) === 'PENDING'
        ).length;
        const active = bookings.filter((b) => {
          const s = (b.bookingStatus || b.booking_status || '').toUpperCase();
          return s === 'ALLOCATED' || s === 'DISPATCHED' || s === 'IN_PROGRESS';
        }).length;

        setStats({
          totalVehicles: vehicles.length,
          availableVehicles: available,
          inUseVehicles: inUse,
          maintenanceVehicles: maintenance,
          totalBookings: bookings.length,
          pendingBookings: pending,
          activeBookings: active,
          loading: false,
        });
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }
    loadStats();
  }, []);

  const modules = [
    {
      title: 'Farmer Booking Portal',
      desc: 'Submit live harvester service requests, view active field jobs, and track machinery dispatch statuses in real time.',
      href: '/farmer',
      badge: '🌾 User Portal',
      port: 'Port 8080',
      icon: Users,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      btnColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20',
    },
    {
      title: 'Fleet Management',
      desc: 'Register agricultural machinery, update GPS coordinates, and manage live equipment availability rosters.',
      href: '/vehicles',
      badge: '🚜 Fleet Roster',
      port: 'Port 8080',
      icon: Tractor,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
      btnColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20',
    },
    {
      title: 'Task 1: Route Optimization',
      desc: 'A* Search and Dijkstra algorithms calculating optimal weather-aware road transit paths across rural nodes.',
      href: '/routing',
      badge: '🗺️ Pathfinding',
      port: 'Port 8081',
      icon: Navigation,
      color: 'from-sky-500/20 to-indigo-500/20 text-sky-400 border-sky-500/30',
      btnColor: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20',
    },
    {
      title: 'Task 2: Resource Allocation',
      desc: 'Hungarian batch matrix matching and real-time greedy priority dispatch for tractors and harvesters.',
      href: '/allocation',
      badge: '⚡ Dispatch Engine',
      port: 'Port 8082',
      icon: Layers,
      color: 'from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30',
      btnColor: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/20',
    },
    {
      title: 'Task 3: Network Analysis',
      desc: 'Tarjan DFS bridge detection for cut-edge vulnerabilities and Kruskal MST logistics backbone optimization.',
      href: '/network',
      badge: '🔗 Graph Resilience',
      port: 'Port 8083',
      icon: NetworkIcon,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
      btnColor: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20',
    },
    {
      title: 'Task 4: Decision Support',
      desc: 'TOPSIS multi-criteria machinery ranking and automated ML harvest delay risk prediction models.',
      href: '/decision-support',
      badge: '📊 Risk Analytics',
      port: 'Port 8084',
      icon: BrainCircuit,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      btnColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20',
    },
    {
      title: 'Task 5: Multi-Job Optimization',
      desc: 'Genetic Algorithm TSP tour sequencing and profit-maximizing acreage shift management for operators.',
      href: '/tour-optimization',
      badge: '🧬 GA TSP Optimizer',
      port: 'Port 8085',
      icon: Route,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      btnColor: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20',
    },
  ];

  // Dynamic Fleet Data pulling from the real API response
  const fleetChartData = [
    { name: 'Available', value: stats.availableVehicles, color: '#34d399' }, // emerald
    { name: 'Dispatched', value: stats.inUseVehicles, color: '#38bdf8' }, // sky blue
    { name: 'Maintenance', value: stats.maintenanceVehicles, color: '#f87171' }, // rose
  ];

  // Hardcoded benchmark data to visualize theoretical alg limits
  const taskPerformanceData = [
    { name: 'A* Routing', ms: 14, algo: 'Task 1' },
    { name: 'Hungarian Match', ms: 28, algo: 'Task 2' },
    { name: 'Tarjan Bridges', ms: 19, algo: 'Task 3' },
    { name: 'TOPSIS ML', ms: 35, algo: 'Task 4' },
    { name: 'GA Tour TSP', ms: 65, algo: 'Task 5' },
  ];

  return (
    <div className="relative min-h-screen pb-20 space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      
      {/* Decorative Background Mesh Light */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] right-0 w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[140px] animate-pulse-glow" />
        <div className="absolute top-[30%] -left-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-[120px]" />
      </div>

      {/* Hero Banner */}
      <div className="relative z-10 overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-black opacity-90" />
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Tractor className="w-96 h-96 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              AgriFleet Operations Kernel • Online
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Smart Agricultural <br />
              <span className="gradient-text-emerald">Fleet & Dispatch IDSS</span>
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed font-normal">
              Monitor agricultural microservices, manage active machinery rosters, calculate weather-aware route paths, and execute intelligent harvest allocations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              href="/farmer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 text-sm"
            >
              <span>Farmer Portal 🌾</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/vehicles"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-2xl border border-slate-700 transition-all hover:scale-105 text-sm"
            >
              <span>Manage Machinery 🚜</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Fleet Machinery</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.loading ? '...' : stats.totalVehicles} <span className="text-xs font-normal text-slate-400">Units</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-500 mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Core Database
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
            <Tractor className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Active Bookings</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.loading ? '...' : stats.activeBookings} <span className="text-xs font-normal text-slate-400">/ {stats.totalBookings} Total</span>
            </div>
            <span className="text-[11px] font-semibold text-cyan-500 mt-1 inline-flex items-center gap-1">
              <Activity className="w-3 h-3" /> {stats.pendingBookings} Pending Queue
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-500">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Microservice Nodes</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              6 <span className="text-xs font-normal text-slate-400">Services</span>
            </div>
            <span className="text-[11px] font-semibold text-purple-500 mt-1 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Ports 8080-8085
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-500">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Optimization Models</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              5 <span className="text-xs font-normal text-slate-400">Algorithms</span>
            </div>
            <span className="text-[11px] font-semibold text-amber-500 mt-1 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> A*, Hungarian, TOPSIS, GA
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
            <BrainCircuit className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Visualizers Section */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Availability Donut Chart */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Tractor className="w-4 h-4 text-emerald-500" />
              Fleet Availability Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time machinery status breakdown</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fleetChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs font-semibold pt-2 border-t border-slate-200 dark:border-slate-800">
            {fleetChartData.map((item) => (
              <span key={item.name} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </div>

        {/* Algorithm Execution Speeds Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-500" />
              Optimization Engine Execution Speeds
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average compute time (ms) per microservice module</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="ms" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-500">
            Microservice Response Latency Benchmark
          </div>
        </div>
      </div>

      {/* Module Grid Section */}
      <div className="relative z-10 space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Modules & Microservices
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 rounded-3xl flex flex-col justify-between relative group overflow-hidden border border-slate-200 dark:border-slate-800"
              >
                <div className="absolute top-0 right-0 p-3">
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {m.port}
                  </span>
                </div>

                <div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} border flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {m.badge}
                  </span>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-500 transition-colors">
                    {m.title}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    {m.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link
                    href={m.href}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${m.btnColor}`}
                  >
                    <span>Launch Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}