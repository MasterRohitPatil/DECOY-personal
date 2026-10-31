import React from 'react';

interface RiskGaugeProps {
  score: number;
  band: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, band }) => {
  // Clamp score 0 - 100
  const clamped = Math.min(Math.max(score, 0), 100);
  // Arc calculation for semi-circle (radius 80, cx 100, cy 100)
  const radius = 70;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const getBandColor = () => {
    switch (band.toUpperCase()) {
      case 'CRITICAL': return '#EF4444';
      case 'HIGH': return '#F97316';
      case 'MEDIUM': return '#FBBF24';
      default: return '#10B981';
    }
  };

  const color = getBandColor();

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
      <div className="relative w-48 h-28 flex items-center justify-center">
        <svg className="w-48 h-48 -rotate-180 transform" viewBox="0 0 200 200">
          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            className="dark:stroke-slate-800"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset="0"
          />
          {/* Animated Value Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Value */}
        <div className="absolute top-12 flex flex-col items-center">
          <span className="text-4xl font-extrabold tracking-tight transition-all duration-500 font-mono" style={{ color }}>
            {score.toFixed(1)}
          </span>
          <span className="text-xs uppercase tracking-widest px-2 py-0.5 mt-1 rounded font-bold text-white shadow-sm" style={{ backgroundColor: color }}>
            {band}
          </span>
        </div>
      </div>

      <div className="flex justify-between w-full text-[11px] text-soc-muted px-4 mt-2">
        <span>0 (Low)</span>
        <span>40 (Med)</span>
        <span>70 (High)</span>
        <span>85+ (Critical)</span>
      </div>
    </div>
  );
};

