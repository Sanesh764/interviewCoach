import React from 'react';

export const ScoreCard = ({
  title,
  score,
  maxScore = 100,
  icon: Icon,
  subtitle,
  color = 'indigo',
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
    <div className={`p-4 rounded-xl bg-slate-800/80 border ${scheme.border} flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && <Icon className={`w-4 h-4 ${scheme.text}`} />}
      </div>
      <div className="flex items-baseline space-x-1 my-1">
        <span className={`text-2xl font-bold ${scheme.text}`}>{score}</span>
        <span className="text-xs text-slate-500">/{maxScore}</span>
      </div>
      {/* Progress Bar */}
      <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${scheme.bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mt-2">{subtitle}</p>}
    </div>
  );
};
