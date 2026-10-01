import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#181818] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-tight';

  const variants = {
    // 1. Primary: Lime #B8FF00 + Deep Black #222222 text
    primary: 'bg-[#B8FF00] hover:bg-[#A8EB00] text-[#222222] font-bold shadow-lg shadow-[#B8FF00]/15 focus:ring-[#B8FF00] active:scale-[0.98]',
    
    // 2. Secondary: Dark/Charcoal #222222 + White text
    secondary: 'bg-[#222222] hover:bg-[#2F2F2F] text-white border border-[#444444] hover:border-[#5F5F5F] focus:ring-[#5F5F5F] active:scale-[0.98]',
    
    // 3. Charcoal: Pure charcoal #5F5F5F
    charcoal: 'bg-[#5F5F5F] hover:bg-[#4E4E4E] text-white focus:ring-[#5F5F5F] active:scale-[0.98]',

    // 4. Outline: Transparent background + charcoal border, lime on hover
    outline: 'border border-[#5F5F5F] hover:border-[#B8FF00] text-[#D0D0D0] hover:text-[#B8FF00] hover:bg-[#222222]/80 focus:ring-[#B8FF00]',

    // 5. Lime Outline: Lime border + Lime text
    'lime-outline': 'border-2 border-[#B8FF00] text-[#B8FF00] hover:bg-[#B8FF00] hover:text-[#222222] focus:ring-[#B8FF00] font-bold active:scale-[0.98]',

    // 6. Danger
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 focus:ring-rose-500 active:scale-[0.98]',

    // 7. Ghost
    ghost: 'text-[#A0A0A0] hover:text-white hover:bg-[#222222] focus:ring-[#5F5F5F]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-3.5 text-base sm:text-lg gap-3 font-bold',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
