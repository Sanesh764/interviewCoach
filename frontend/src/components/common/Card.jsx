import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  variant = 'dark', // 'dark' | 'charcoal' | 'light'
  onClick,
  ...props
}) => {
  const variantStyles = {
    dark: 'bg-[#222222] border border-[#333333]',
    charcoal: 'bg-[#2A2A2A] border border-[#444444]',
    light: 'bg-[#F2F2F2] text-[#222222] border border-[#E0E0E0]',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-6 backdrop-blur-xl shadow-xl transition-all duration-200 ${variantStyles[variant] || variantStyles.dark} ${
        hover ? 'hover:border-[#5F5F5F] hover:shadow-2xl cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
