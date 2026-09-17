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
      className={`bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl ${
        hover ? 'hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
