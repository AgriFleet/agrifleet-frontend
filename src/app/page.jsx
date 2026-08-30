'use client';

import Link from 'next/link';

export default function OperationsDashboard() {
  const modules = [
    {
      title: 'Farmer Booking Portal',
      desc: 'Submit live harvester service requests, view active field jobs, and track machinery dispatch statuses.',
      href: '/farmer',
      badge: '🌾 User Portal',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:border-emerald-400 hover:shadow-emerald-100',
      btn: 'Open Portal →',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      title: 'Fleet Management',
      desc: 'Register new agricultural vehicles, update GPS coordinates, and manage machinery availability statuses.',
      href: '/vehicles',
      badge: '🚜 Core Service (8080)',
      color: 'bg-blue-50 border-blue-200 text-blue-900 hover:border-blue-400 hover:shadow-blue-100',
      btn: 'Manage Fleet →',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      title: 'Task 1: Route Optimization',
      desc: 'A* and Dijkstra algorithms calculating optimal paths considering weather-aware road resistance.',
      href: '/routing',
      badge: '🗺️ Port 8081',
      color: 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-slate-200',
      btn: 'Launch Module',
      btnColor: 'bg-slate-900 hover:bg-slate-800 text-white'
    },
    {
      title: 'Task 2: Resource Allocation',
      desc: 'Hungarian batch matching and real-time greedy priority dispatch for tractors and harvesters.',
      href: '/allocation',
      badge: '⚡ Port 8082',
      color: 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-slate-200',
      btn: 'Launch Module',
      btnColor: 'bg-slate-900 hover:bg-slate-800 text-white'
    },
    {
      title: 'Task 3: Network Analysis',
      desc: 'Tarjan bridge detection, cut-edges isolation analysis, and Kruskal MST logistics backbone.',
      href: '/network',
      badge: '🔗 Port 8083',
      color: 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-slate-200',
      btn: 'Launch Module',
      btnColor: 'bg-slate-900 hover:bg-slate-800 text-white'
    },
    {
      title: 'Task 4: Decision Support',
      desc: 'TOPSIS multi-attribute machinery ranking and automated harvest delay risk prediction models.',
      href: '/decision-support',
      badge: '📊 Port 8084',
      color: 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-slate-200',
      btn: 'Launch Module',
      btnColor: 'bg-slate-900 hover:bg-slate-800 text-white'
    },
    {
      title: 'Task 5: Multi-Job Optimization',
      desc: 'Genetic Algorithm TSP tour sequencing and profit-maximizing shift management for operators.',
      href: '/tour-optimization',
      badge: '🧬 Port 8085',
      color: 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-slate-200',
      btn: 'Launch Module',
      btnColor: 'bg-slate-900 hover:bg-slate-800 text-white'
    },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Centralized Dispatch & Control
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">AgriFleet Operations Hub</h1>
          <p className="text-slate-300 text-sm mt-3 max-w-2xl leading-relaxed">
            Monitor agricultural microservice nodes, manage active fleet databases, and trigger real-time machinery allocations across regional farms.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link 
            href="/farmer"
            className="flex-1 md:flex-none text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 duration-200 text-sm whitespace-nowrap"
          >
            Farmer View 🌾
          </Link>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((m, idx) => (
          <div 
            key={idx} 
            className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 ${m.color}`}
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold px-3 py-1.5 bg-white/80 backdrop-blur-sm text-slate-700 rounded-lg shadow-sm border border-slate-100/50">
                  {m.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2.5 text-slate-900">{m.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{m.desc}</p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center justify-between">
              <Link 
                href={m.href}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-colors shadow-sm ${m.btnColor}`}
              >
                {m.btn}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}