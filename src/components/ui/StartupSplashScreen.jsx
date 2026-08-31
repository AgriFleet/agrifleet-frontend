'use client';

import { useState, useEffect } from 'react';
import { Tractor, Sparkles, CheckCircle2, Cpu } from 'lucide-react';

export default function StartupSplashScreen() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing AgriFleet Engine...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if splash screen was already shown in this session
    const hasSeenSplash = sessionStorage.getItem('agrifleet_splash_shown');
    if (hasSeenSplash) {
      setShow(false);
      return;
    }

    const steps = [
      { p: 25, text: 'Booting Core Microservices...' },
      { p: 50, text: 'Verifying Routing & Allocation Topology...' },
      { p: 75, text: 'Loading TOPSIS & GA Optimization Kernels...' },
      { p: 100, text: 'AgriFleet IDSS Ready' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusText(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setShow(false);
            sessionStorage.setItem('agrifleet_splash_shown', 'true');
          }, 600);
        }, 400);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#070b12] text-white transition-opacity duration-600 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        {/* Animated Brand Logo Icon */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
          <div className="relative w-20 h-20 bg-slate-900 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Tractor className="w-10 h-10 text-emerald-400 animate-bounce" />
            <Sparkles className="w-4 h-4 text-cyan-300 absolute top-2 right-2 animate-spin" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400">
          AGRI<span className="text-white">FLEET</span> IDSS
        </h1>
        <p className="text-xs text-slate-400 tracking-widest uppercase mt-1 font-semibold">
          Intelligent Dispatch & Decision System
        </p>

        {/* Progress Bar & Status */}
        <div className="w-full mt-8 space-y-3">
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Cpu className="w-3.5 h-3.5 animate-spin" />
              {statusText}
            </span>
            <span className="font-bold">{progress}%</span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-2 p-0.5 border border-slate-700/50 shadow-inner overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Microservice Badges */}
        <div className="flex items-center gap-3 mt-8 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Core 8080
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tasks 8081-8085
          </span>
        </div>
      </div>
    </div>
  );
}
