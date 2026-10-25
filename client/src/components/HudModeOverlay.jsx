import React, { useState } from 'react';
import { 
  Crosshair, 
  AlertTriangle, 
  Radio, 
  Compass, 
  Minimize2, 
  FlipHorizontal,
  ShieldAlert,
  Car,
  Camera,
  QrCode,
  Target,
  Shield,
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  ArrowDown,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft
} from 'lucide-react';
import { LicensePlate } from './LicensePlate';
import { getColorHex } from '../utils/carColors';

const renderCompassIcon = (code) => {
  const props = { className: "w-4 h-4 text-amber-400 inline" };
  switch (code) {
    case 'N': return <ArrowUp {...props} />;
    case 'NE': return <ArrowUpRight {...props} />;
    case 'E': return <ArrowRight {...props} />;
    case 'SE': return <ArrowDownRight {...props} />;
    case 'S': return <ArrowDown {...props} />;
    case 'SW': return <ArrowDownLeft {...props} />;
    case 'W': return <ArrowLeft {...props} />;
    case 'NW': return <ArrowUpLeft {...props} />;
    default: return <Compass {...props} />;
  }
};

export function HudModeOverlay({
  proximity,
  myPlayer,
  gpsSpeed,
  gpsAccuracy,
  timeRemaining,
  isHidingPhase,
  formatTime,
  onClose,
  onOpenScanner,
  onOpenQr,
}) {
  const [isMirrored, setIsMirrored] = useState(false);
  const [selectedTargetIdx, setSelectedTargetIdx] = useState(0);

  const isHider = myPlayer?.role === 'HIDER';
  const isSeeker = myPlayer?.role === 'SEEKER';

  const activeTarget = isSeeker && proximity?.allTargets?.length > 0
    ? proximity.allTargets[selectedTargetIdx] || proximity
    : proximity;

  const getThreatColor = () => {
    if (!proximity) return 'text-slate-400 border-slate-700';

    if (isHider) {
      if (proximity.threatLevel === 'CRITICAL') return 'text-rose-500 border-rose-500 bg-rose-950/40 animate-pulse';
      if (proximity.threatLevel === 'DANGER') return 'text-orange-500 border-orange-500 bg-orange-950/40';
      if (proximity.threatLevel === 'CAUTION') return 'text-amber-400 border-amber-500 bg-amber-950/40';
      return 'text-emerald-400 border-emerald-500 bg-emerald-950/30';
    }

    if (isSeeker) {
      if (activeTarget?.isInside) return 'text-emerald-400 border-emerald-500 bg-emerald-950/40 animate-pulse';
      if (activeTarget?.edgeDist <= 150) return 'text-amber-400 border-amber-500 bg-amber-950/40';
      return 'text-cyan-400 border-cyan-500 bg-cyan-950/30';
    }

    return 'text-slate-300 border-slate-700';
  };

  const threatColorClass = getThreatColor();

  return (
    <div className={`fixed inset-0 z-[2200] bg-slate-950 flex flex-col justify-between p-3 sm:p-6 pt-safe pb-safe select-none transition-transform ${isMirrored ? 'scale-x-[-1]' : ''}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-slate-400 font-bold">
              {isSeeker ? 'RADAR POŚCIGOWY ŁOWCY' : 'RADAR ZAGROŻENIA UCIEKINIERA'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>GPS: ±{gpsAccuracy || '?'}m</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSeeker && (
            <button
              onClick={() => {
                onClose();
                if (onOpenScanner) onOpenScanner();
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition cursor-pointer"
            >
              <Camera className="w-4 h-4 animate-pulse" />
              <span>Skaner QR</span>
            </button>
          )}

          {isHider && (
            <button
              onClick={() => {
                onClose();
                if (onOpenQr) onOpenQr();
              }}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 active:scale-95 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Mój QR ({myPlayer?.catchCode})</span>
            </button>
          )}

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-2 rounded-xl text-xs font-mono font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              isMirrored 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30' 
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Lustrzane odbicie na przednią szybę w nocy"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="hidden md:inline">Odbicie na szybę</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Zamknij HUD</span>
          </button>
        </div>
      </div>

      {isSeeker && proximity?.allTargets?.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold shrink-0">Wybierz cel:</span>
          {proximity.allTargets.map((t, idx) => (
            <button
              key={t.id || idx}
              onClick={() => setSelectedTargetIdx(idx)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                selectedTargetIdx === idx 
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{t.name}</span>
              <span className="opacity-80">({t.edgeDist}m)</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center text-center my-auto space-y-4 py-2">
        <div className="space-y-1">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center justify-center gap-2">
            {isHider ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
                NAJBLIŻSZY ŁOWCA (POLUJĄCY NA CIEBIE)
              </>
            ) : (
              <>
                <Target className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                CEL POLOWANIA (OKRĄG RADARU)
              </>
            )}
          </span>

          <div className="flex flex-col items-center justify-center gap-1">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
              <Car className="w-5 h-5 text-amber-400" />
              {isHider 
                ? (proximity ? `${proximity.targetName} (${proximity.carModel || 'Auto'})` : 'Brak łowców w zasięgu')
                : (activeTarget ? `${activeTarget.name} (${activeTarget.carModel || 'Auto'})` : 'Brak aktywnych celów')}
            </h2>

            {((isHider ? proximity?.carColor : activeTarget?.carColor) || (isHider ? proximity?.carPlate : activeTarget?.carPlate)) && (
              <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
                {(isHider ? proximity?.carColor : activeTarget?.carColor) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30"
                      style={{ backgroundColor: getColorHex(isHider ? proximity?.carColor : activeTarget?.carColor) }}
                    />
                    <span>{isHider ? proximity?.carColor : activeTarget?.carColor}</span>
                  </span>
                )}
                {(isHider ? proximity?.carPlate : activeTarget?.carPlate) && (
                  <LicensePlate plate={isHider ? proximity?.carPlate : activeTarget?.carPlate} size="sm" />
                )}
              </div>
            )}
          </div>

          {(proximity?.compass || activeTarget?.compass) && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400">
              <Compass className="w-4 h-4" />
              <span>
                {isHider ? 'Nadjeżdża z kierunku: ' : 'Kierunek do strefy celu: '}
                <strong>{(isHider ? proximity?.compass?.label : activeTarget?.compass?.label) || 'PÓŁNOC'}</strong>
              </span>
              <span className="inline-flex items-center">
                {renderCompassIcon((isHider ? proximity?.compass?.code : activeTarget?.compass?.code) || 'N')}
              </span>
            </div>
          )}
        </div>

        <div className={`py-4 sm:py-6 px-4 sm:px-8 rounded-3xl border-2 transition-all shadow-2xl flex flex-col items-center justify-center max-w-lg w-full ${threatColorClass}`}>
          <div className="flex items-baseline justify-center gap-1 sm:gap-2">
            <span className="text-6xl sm:text-9xl font-black font-mono tracking-tighter leading-none">
              {isHider 
                ? (proximity ? proximity.distance : '---')
                : (activeTarget ? activeTarget.edgeDist : '---')}
            </span>
            <span className="text-3xl sm:text-4xl font-mono font-bold">m</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 w-full text-center">
            {isHider ? (
              proximity?.isInsideCircle ? (
                <div className="text-sm sm:text-base font-black text-rose-400 flex items-center justify-center gap-2 animate-bounce">
                  <ShieldAlert className="w-5 h-5" />
                  <span>ALARM: ŁOWCA WJECHAŁ W TWÓJ OKRĄG RADARU ({Math.abs(proximity.distToCircleEdge)}m wewnątrz)!</span>
                </div>
              ) : (
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-300">
                  Odległość łowcy do krawędzi Twojego okręgu radaru: <strong className="text-amber-400">{proximity?.distToCircleEdge || 0} m</strong>
                </div>
              )
            ) : (
              activeTarget?.isInside ? (
                <div className="text-sm sm:text-base font-black text-emerald-400 flex items-center justify-center gap-2 animate-pulse">
                  <Crosshair className="w-5 h-5" />
                  <span>W OKRĘGU RADARU: SZUKAJ AUTA (Do środka strefy: {activeTarget.centerDist}m)</span>
                </div>
              ) : (
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-300">
                  Do krawędzi okręgu radaru: <strong className="text-cyan-400">{activeTarget?.edgeDist || 0} m</strong> (do środka: {activeTarget?.centerDist || 0} m)
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full max-w-md pt-1">
          <div className={`h-2.5 flex-1 rounded-full ${
            isHider 
              ? (proximity?.threatLevel !== 'SAFE' ? 'bg-amber-500' : 'bg-slate-800')
              : (activeTarget?.edgeDist <= 600 ? 'bg-cyan-500' : 'bg-slate-800')
          }`} />
          <div className={`h-2.5 flex-1 rounded-full ${
            isHider
              ? (proximity?.threatLevel === 'DANGER' || proximity?.threatLevel === 'CRITICAL' ? 'bg-orange-500' : 'bg-slate-800')
              : (activeTarget?.edgeDist <= 250 ? 'bg-amber-500' : 'bg-slate-800')
          }`} />
          <div className={`h-2.5 flex-1 rounded-full ${
            isHider
              ? (proximity?.threatLevel === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-slate-800')
              : (activeTarget?.isInside ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800')
          }`} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-center font-mono">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">PRĘDKOŚĆ</span>
          <span className="text-3xl font-black text-white">{gpsSpeed || 0}</span>
          <span className="text-xs text-slate-400 ml-1">km/h</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
            {isHidingPhase ? 'UKRYWANIE' : 'POLOWANIE'}
          </span>
          <span className="text-3xl font-black text-amber-400 font-mono">
            {formatTime(timeRemaining)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">TWOJA ROLA</span>
          <span className={`text-base font-black flex items-center justify-center gap-1.5 mt-1 ${isHider ? 'text-purple-400' : 'text-cyan-400'}`}>
            {isHider ? <Car className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            <span>{isHider ? 'Uciekinier' : 'Łowca'}</span>
          </span>
        </div>

        <button
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-2xl font-bold flex flex-col items-center justify-center transition border border-slate-700 cursor-pointer"
        >
          <span className="text-xs font-black uppercase tracking-wider block">WIDOK MAPY</span>
          <span className="text-[11px] text-slate-400">Pokaż ulice</span>
        </button>
      </div>
    </div>
  );
}
