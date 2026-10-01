import React from 'react';

export const ScoreCard = ({
  title,
  score,
  maxScore = 100,
  icon: Icon,
  subtitle,
}) => {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="p-5 rounded-2xl bg-[#222222] border border-[#333333] hover:border-[#5F5F5F] transition-all flex flex-col justify-between shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider font-mono">{title}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-[#B8FF00]/10 border border-[#B8FF00]/20">
            <Icon className="w-4 h-4 text-[#B8FF00]" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline space-x-1.5 my-1">
        <span className="text-3xl font-extrabold tracking-tight text-white">{score}</span>
        <span className="text-xs text-[#A0A0A0] font-mono">/{maxScore}</span>
      </div>

      {/* Progress Bar in Lime Accent */}
      <div className="w-full bg-[#181818] rounded-full h-1.5 mt-3 overflow-hidden border border-[#333333]">
        <div
          className="h-1.5 rounded-full transition-all duration-700 bg-[#B8FF00]"
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      </div>

      {subtitle && <p className="text-[11px] text-[#A0A0A0] mt-2.5 leading-relaxed">{subtitle}</p>}
    </div>
  );
};
