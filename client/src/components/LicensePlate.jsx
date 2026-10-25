import React from 'react';

export function LicensePlate({ plate, size = 'sm', className = '' }) {
  if (!plate || !plate.trim()) return null;

  const cleanPlate = plate.trim().toUpperCase();

  const sizeClasses = {
    xs: {
      container: 'h-4 px-1 text-[9px] gap-1 border-[1.5px]',
      band: 'px-0.5 text-[6px]',
      star: 'text-[5px]',
      text: 'tracking-wider',
    },
    sm: {
      container: 'h-5 px-1.5 text-[11px] gap-1 border-[1.5px] rounded-[4px]',
      band: 'px-1 text-[7px]',
      star: 'text-[6px]',
      text: 'tracking-wider',
    },
    md: {
      container: 'h-7 px-2 text-xs gap-1.5 border-2 rounded-[5px]',
      band: 'px-1.5 text-[8px]',
      star: 'text-[7px]',
      text: 'tracking-widest font-black',
    },
    lg: {
      container: 'h-10 px-3 text-base gap-2 border-2 rounded-lg shadow-md',
      band: 'px-2 text-[10px]',
      star: 'text-[8px]',
      text: 'tracking-widest font-black',
    },
  }[size] || {
    container: 'h-5 px-1.5 text-[11px] gap-1 border-[1.5px] rounded-[4px]',
    band: 'px-1 text-[7px]',
    star: 'text-[6px]',
    text: 'tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center bg-white text-slate-950 font-mono font-black border-slate-950 shadow-sm select-all uppercase transition ${sizeClasses.container} ${className}`}
      title={`Tablica rejestracyjna: ${cleanPlate}`}
    >
      <span
        className={`flex flex-col items-center justify-center bg-blue-700 text-white font-sans font-black leading-none rounded-l-[2px] -ml-[5px] -my-[2px] h-[calc(100%+3px)] ${sizeClasses.band}`}
      >
        <span className={`text-yellow-300 ${sizeClasses.star}`}>★</span>
        <span className="font-extrabold tracking-tighter">PL</span>
      </span>

      <span className={`text-slate-950 whitespace-nowrap ${sizeClasses.text}`}>
        {cleanPlate}
      </span>
    </span>
  );
}
