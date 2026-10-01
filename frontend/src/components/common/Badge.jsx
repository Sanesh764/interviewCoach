import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const variants = {
    // Lime Accent
    lime: 'bg-[#B8FF00]/15 text-[#B8FF00] border-[#B8FF00]/30',
    'lime-solid': 'bg-[#B8FF00] text-[#222222] border-transparent font-bold',
    
    // Dark & Charcoal
    default: 'bg-[#2A2A2A] text-[#D0D0D0] border-[#383838]',
    dark: 'bg-[#222222] text-white border-[#444444]',
    charcoal: 'bg-[#5F5F5F]/30 text-[#D0D0D0] border-[#5F5F5F]/50',

    // Status
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',

    // Legacy mappings redirecting to the new design system
    indigo: 'bg-[#B8FF00]/15 text-[#B8FF00] border-[#B8FF00]/30',
    emerald: 'bg-[#B8FF00]/15 text-[#B8FF00] border-[#B8FF00]/30',
    sky: 'bg-[#5F5F5F]/30 text-[#D0D0D0] border-[#5F5F5F]/50',
    purple: 'bg-[#B8FF00]/15 text-[#B8FF00] border-[#B8FF00]/30',
  };

  const dotColors = {
    lime: 'bg-[#B8FF00]',
    'lime-solid': 'bg-[#222222]',
    default: 'bg-[#A0A0A0]',
    dark: 'bg-white',
    charcoal: 'bg-[#A0A0A0]',
    warning: 'bg-amber-400',
    amber: 'bg-amber-400',
    danger: 'bg-rose-400',
    rose: 'bg-rose-400',
    indigo: 'bg-[#B8FF00]',
    emerald: 'bg-[#B8FF00]',
    sky: 'bg-[#A0A0A0]',
    purple: 'bg-[#B8FF00]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </span>
  );
};
