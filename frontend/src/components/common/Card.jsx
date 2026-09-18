import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-surface-900/80 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl transition-all duration-200 ${
        hover ? 'hover:border-slate-700 hover:bg-surface-850/90 hover:shadow-2xl cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

