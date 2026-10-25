import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Car, Sun, Moon } from 'lucide-react';
import { LicensePlate } from './LicensePlate';
import { getColorHex } from '../utils/carColors';

export function HiderQrModal({ myPlayer, onClose }) {
  const [highBrightness, setHighBrightness] = useState(true);

  if (!myPlayer) return null;

  const pinCode = myPlayer.catchCode || '0000';
  const qrData = `CARHUNT:${pinCode}`;

  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none pb-safe pt-safe">
      <div 
        className={`max-w-sm w-full max-h-[94dvh] overflow-y-auto rounded-3xl p-4 sm:p-6 text-center space-y-3 sm:space-y-4 shadow-2xl relative transition-all ${
          highBrightness ? 'bg-white text-slate-950 shadow-white/20' : 'glass-panel text-white border-white/10'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-3.5 right-3.5 p-2 rounded-full transition cursor-pointer ${
            highBrightness ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md">
            <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Karta Pojazdu Uciekiniera
          </div>
          <h2 className="text-xl sm:text-2xl font-black leading-tight">{myPlayer.name}</h2>
          
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs font-bold flex items-center justify-center gap-1.5 flex-wrap">
              <Car className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{myPlayer.carModel || 'Auto'}</span>
              {myPlayer.carColor && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-800">
                  <span
                    className="w-2 h-2 rounded-full border border-black/20"
                    style={{ backgroundColor: getColorHex(myPlayer.carColor) }}
                  />
                  {myPlayer.carColor}
                </span>
              )}
            </div>

            {myPlayer.carPlate && (
              <div className="pt-0.5">
                <LicensePlate plate={myPlayer.carPlate} size="sm" />
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-white rounded-3xl shadow-xl border-4 border-slate-900 inline-block">
          <QRCodeSVG
            value={qrData}
            size={210}
            level="M"
            includeMargin={true}
          />
        </div>

        <div className={`p-3 rounded-2xl border ${highBrightness ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'}`}>
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 block">
            Awaryjny PIN (jeśli szyba jest przyciemniona):
          </span>
          <span className="text-3xl font-black font-mono tracking-widest text-amber-500">
            {pinCode}
          </span>
        </div>

        <p className="text-[11px] opacity-75 leading-tight px-2">
          Umieść telefon za szybą lub na desce rozdzielczej. Gdy łowca Cię znajdzie, skanuje ten kod aparatem w aplikacji.
        </p>

        <button
          onClick={() => setHighBrightness(!highBrightness)}
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer active:scale-95 ${
            highBrightness 
              ? 'bg-slate-950 text-white border-slate-800' 
              : 'bg-white text-slate-950 border-slate-200'
          }`}
        >
          {highBrightness ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span>{highBrightness ? 'Przełącz w tryb ciemny' : 'Maksymalny kontrast (Białe tło)'}</span>
        </button>
      </div>
    </div>
  );
}
