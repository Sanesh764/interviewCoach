import React from 'react';

export const ScoreCard = ({
  title,
  score,
  maxScore = 100,
  icon: Icon,
  subtitle,
}) => {
  const percentage = Math.round((score / maxScore) * 100);

  const getColor = (pct) => {
    if (pct >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500' };
    if (pct >= 65) return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', bar: 'bg-indigo-500' };
    if (pct >= 50) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'bg-amber-500' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', bar: 'bg-rose-500' };
  };

  const scheme = getColor(percentage);

  return (
    <div className={`p-5 rounded-2xl bg-surface-900/80 border ${scheme.border} backdrop-blur-xl flex flex-col justify-between shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${scheme.bg}`}>
            <Icon className={`w-4 h-4 ${scheme.text}`} />
          </div>
        )}
      </div>
      <div className="flex items-baseline space-x-1.5 my-1">
        <span className={`text-3xl font-extrabold tracking-tight ${scheme.text}`}>{score}</span>
        <span className="text-xs text-slate-500 font-medium">/{maxScore}</span>
      </div>
      {/* Progress Bar */}
      <div className="w-full bg-surface-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800/80">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${scheme.bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mt-2.5">{subtitle}</p>}
    </div>
  );
};

