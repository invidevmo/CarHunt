import React, { useState } from 'react';
import { MapComponent } from './MapComponent';
import { HiderQrModal } from './HiderQrModal';
import { SeekerScannerModal } from './SeekerScannerModal';
import { HudModeOverlay } from './HudModeOverlay';
import { calculateProximity } from '../utils/proximity';
import { LicensePlate } from './LicensePlate';
import { 
  Camera, 
  QrCode,
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  ListOrdered, 
  LocateFixed, 
  Car, 
  Shield, 
  ChevronDown, 
  Eye, 
  CheckCircle2, 
  Radio, 
  Gauge, 
  Crosshair
} from 'lucide-react';
import { sounds } from '../utils/audio';

export function GameView({
  room,
  myPlayer,
  myPosition,
  gpsAccuracy,
  gpsSpeed,
  onMapClick,
  onScanCatchCode,
  autoCenter,
  setAutoCenter,
}) {
  const [showEvents, setShowEvents] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showHudMode, setShowHudMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [catchError, setCatchError] = useState(null);
  const [catchSuccess, setCatchSuccess] = useState(null);

  const isHider = myPlayer?.role === 'HIDER';
  const isSeeker = myPlayer?.role === 'SEEKER';
  const isCaught = myPlayer?.isCaught;
  const isHunting = room.state === 'HUNTING';
  const isHidingPhase = room.state === 'HIDING';

  const proximity = calculateProximity({
    myPosition,
    myPlayer,
    players: room.players,
    radarPings: room.radarPings,
    pingRadius: room.settings?.pingFuzzRadius || 200,
  });

  const hidersStats = room.hidersStats || {
    total: room.players.filter((p) => p.role === 'HIDER').length,
    remaining: room.players.filter((p) => p.role === 'HIDER' && !p.isCaught).length,
    caught: room.players.filter((p) => p.role === 'HIDER' && p.isCaught).length,
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const handleScanSubmit = (scannedCode) => {
    setCatchError(null);
    setCatchSuccess(null);

    onScanCatchCode(scannedCode, (res) => {
      if (res && res.error) {
        setCatchError(res.error);
        setTimeout(() => setCatchError(null), 5000);
      } else if (res && res.success) {
        setShowScannerModal(false);
        setCatchSuccess(
          `SUKCES! Zeskanowano ${res.caughtName} (${res.carModel || 'Auto'})! Pozostało uciekających: ${res.remaining}.`
        );
        setTimeout(() => setCatchSuccess(null), 6000);
      }
    });
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-slate-950 overflow-hidden select-none">
      <div className="absolute top-0 left-0 right-0 z-[1000] p-2 sm:p-4 pt-safe pointer-events-none">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="pointer-events-auto glass-panel rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-2xl flex items-center gap-2 sm:gap-2.5 border-white/10 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-ping shrink-0 ${isHidingPhase ? 'bg-amber-400' : 'bg-rose-500'}`} />
              <div className="flex flex-col">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">
                  {isHidingPhase ? 'Ukrywanie' : 'Polowanie'}
                </span>
                <span className="text-base sm:text-2xl font-black font-mono tracking-tight text-white leading-tight">
                  {formatTime(room.timeRemaining)}
                </span>
              </div>
            </div>

            <div className="h-5 sm:h-6 w-[1px] bg-white/10" />

            <div className="flex flex-col text-left">
              <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-slate-400 font-extrabold leading-none">Cele</span>
              <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-400 leading-tight">
                {hidersStats.remaining}/{hidersStats.total}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-extrabold pl-1.5 border-l border-white/10">
              {isCaught ? (
                <AlertTriangle className="w-3 h-3 text-rose-400" />
              ) : isHider ? (
                <Car className="w-3 h-3 text-purple-300" />
              ) : (
                <Shield className="w-3 h-3 text-cyan-300" />
              )}
              <span className={`hidden sm:inline ${isCaught ? 'text-rose-400' : isHider ? 'text-purple-300' : 'text-cyan-300'}`}>
                {isCaught ? 'Złapany' : isHider ? 'Uciekinier' : 'Łowca'}
              </span>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 glass-panel rounded-2xl p-1 sm:p-1.5 shadow-2xl border-white/10 shrink-0">
            <button
              onClick={() => setShowHudMode(true)}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer border border-amber-400/30"
              title="Otwórz pełnoekranowy tryb taktyczny HUD"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>HUD</span>
            </button>

            <button
              onClick={toggleSound}
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              title="Dźwięk"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />}
            </button>
            <button
              onClick={() => setAutoCenter(!autoCenter)}
              className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer ${autoCenter ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:bg-slate-800/80'}`}
              title="Centruj mapę na mnie"
            >
              <LocateFixed className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setShowEvents(!showEvents)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              title="Dziennik zdarzeń"
            >
              <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {proximity && isHunting && (
          <div 
            onClick={() => setShowHudMode(true)}
            className="max-w-xl mx-auto mt-1.5 pointer-events-auto glass-panel border border-white/10 hover:border-amber-400/50 p-2 sm:p-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-2 cursor-pointer transition active:scale-[0.99] relative overflow-hidden"
            title="Kliknij, aby otworzyć pełny tryb HUD"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1.5 rounded-xl shrink-0 ${
                isHider 
                  ? (proximity.isInsideCircle ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-purple-500/20 text-purple-300') 
                  : (proximity.isInsideCircle ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-cyan-500/20 text-cyan-300')
              }`}>
                {isHider ? <Radio className="w-4 h-4" /> : <Crosshair className="w-4 h-4" />}
              </div>

              <div className="text-left min-w-0">
                <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 block truncate">
                  {isHider ? 'Najbliższy Łowca' : 'Strefa Celu Radaru'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white truncate max-w-[110px] sm:max-w-none">{proximity.targetName}</span>
                  <span className="text-[10px] text-slate-300 font-mono truncate">({proximity.carModel || 'Auto'})</span>
                  {proximity.carPlate && <LicensePlate plate={proximity.carPlate} size="xs" />}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-baseline justify-end gap-0.5">
                <span className={`text-xl sm:text-2xl font-black font-mono leading-none ${
                  isHider 
                    ? (proximity.threatLevel === 'CRITICAL' ? 'text-rose-500 animate-pulse' : proximity.threatLevel === 'DANGER' ? 'text-orange-400' : 'text-amber-400') 
                    : (proximity.isInsideCircle ? 'text-emerald-400 font-bold' : 'text-cyan-400')
                }`}>
                  {isHider ? proximity.distance : proximity.distToCircleEdge}
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">m</span>
              </div>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono block">
                {isHider 
                  ? (proximity.isInsideCircle ? 'W TWOIM OKRĘGU!' : `${proximity.distToCircleEdge}m do okręgu`)
                  : (proximity.isInsideCircle ? 'W OKRĘGU RADARU!' : 'do krawędzi')}
              </span>
            </div>
          </div>
        )}

        {isHider && isCaught && (
          <div className="max-w-xl mx-auto mt-1.5 pointer-events-auto glass-panel border border-rose-500/40 text-rose-200 text-xs p-2.5 rounded-2xl shadow-xl flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <strong className="text-rose-300 block text-xs">Schwytany przez: {myPlayer.caughtBy || 'Łowcę'}!</strong>
              <span className="text-[11px] text-slate-300">Śledzisz na mapie pościg za swoimi kolegami z załogi.</span>
            </div>
          </div>
        )}

        {catchSuccess && (
          <div className="max-w-xl mx-auto mt-1.5 pointer-events-auto bg-emerald-600 text-white font-bold text-xs p-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{catchSuccess}</span>
          </div>
        )}

        {myPlayer?.isOutOfZone && (
          <div className={`max-w-xl mx-auto mt-1.5 pointer-events-auto text-white font-bold text-xs p-2.5 rounded-2xl shadow-2xl border flex items-center justify-between gap-2 animate-bounce ${
            myPlayer.zonePenaltyActive
              ? 'bg-rose-700/95 border-rose-400 glow-red'
              : 'bg-orange-600/95 border-orange-400'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
              <div className="leading-tight">
                <span className="block font-black uppercase text-[11px]">
                  {myPlayer.zonePenaltyActive ? 'KARA: POZYCJA ODSŁONIĘTA!' : 'OSTRZEŻENIE: POZA STREFĄ GRY!'}
                </span>
                <span className="text-[10px] opacity-90">
                  {myPlayer.zonePenaltyActive
                    ? 'Łowcy widzą Twoją dokładną lokalizację na żywo! Wracaj natychmiast do strefy!'
                    : `Wróć do strefy, inaczej za ${myPlayer.outOfZoneSecondsLeft || 0}s Twoja pozycja zostanie ujawniona!`}
                </span>
              </div>
            </div>
            {!myPlayer.zonePenaltyActive && (
              <span className="font-mono font-black text-lg bg-black/40 px-2 py-0.5 rounded-xl border border-white/20 shrink-0">
                {myPlayer.outOfZoneSecondsLeft || 0}s
              </span>
            )}
          </div>
        )}

        {catchError && (
          <div className="max-w-xl mx-auto mt-1.5 pointer-events-auto bg-amber-500 text-slate-950 font-bold text-xs p-2 rounded-xl shadow-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{catchError}</span>
          </div>
        )}
      </div>

      <div className="flex-1 w-full h-full min-h-0 relative">
        <MapComponent
          center={myPosition}
          players={room.players}
          myPlayerId={myPlayer?.id}
          zone={room.settings.zone}
          settings={room.settings}
          nextZone={room.nextZone}
          radarPings={room.radarPings}
          gameState={room.state}
          onMapClick={onMapClick}
          autoCenter={autoCenter}
          onToggleAutoCenter={() => setAutoCenter(!autoCenter)}
          mySpeed={gpsSpeed}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[1000] p-2.5 sm:p-5 pb-safe pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto space-y-2">
          {isSeeker && isHunting && (
            <button
              onClick={() => setShowScannerModal(true)}
              className="w-full py-3.5 sm:py-5 px-5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-2xl shadow-red-600/40 active:scale-[0.98] transition flex items-center justify-center gap-2.5 border border-red-400/50 cursor-pointer glow-red"
            >
              <Camera className="w-5 sm:w-6 h-5 sm:h-6 animate-pulse" />
              <span>SKANUJ KOD QR (MAM CIĘ!)</span>
            </button>
          )}

          {isHider && !isCaught && (
            <div className="space-y-1.5">
              <button
                onClick={() => setShowQrModal(true)}
                className="w-full py-2.5 sm:py-3.5 px-3.5 rounded-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-2xl flex items-center justify-between border border-purple-400/40 active:scale-[0.98] transition cursor-pointer glow-purple"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4 text-purple-200" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-wider">Twój Kod QR (Za szybę)</div>
                    <div className="text-[10px] text-purple-200 opacity-80">Wyświetl na desce rozdzielczej</div>
                  </div>
                </div>
                <div className="bg-purple-950/80 border border-purple-400/40 px-2.5 py-1 rounded-xl text-center shadow-inner">
                  <span className="text-[7px] uppercase tracking-wider block opacity-70">PIN</span>
                  <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">{myPlayer.catchCode || '----'}</span>
                </div>
              </button>

              <div className="glass-panel rounded-xl px-3 py-1.5 shadow-xl flex items-center justify-between text-xs text-purple-200">
                <span className="opacity-80">Pozostało uciekających:</span>
                <span className="font-bold text-white font-mono">{hidersStats.remaining} aut</span>
              </div>
            </div>
          )}

          {isSeeker && isHidingPhase && (
            <div className="glass-panel border-cyan-500/30 rounded-2xl p-3 shadow-2xl text-center text-xs text-slate-300">
              <div className="font-bold text-white mb-0.5">Uciekinierzy ({hidersStats.total} aut) szukają kryjówek...</div>
              <span>Łowcy ruszają za {formatTime(room.timeRemaining)}! Bądźcie gotowi do skanowania kodów.</span>
            </div>
          )}
        </div>
      </div>

      {showEvents && (
        <div className="absolute inset-x-0 bottom-0 top-16 z-[1100] max-w-lg mx-auto glass-panel border-t border-white/10 p-4 rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-amber-400" /> Dziennik zdarzeń rozgrywki
            </h3>
            <button
              onClick={() => setShowEvents(false)}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
            {room.events.length === 0 ? (
              <div className="text-center text-slate-500 py-8">Brak wpisów w dzienniku</div>
            ) : (
              room.events.slice().reverse().map((ev) => (
                <div key={ev.id} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex gap-2">
                  <span className="font-mono text-slate-500 text-[10px] shrink-0 mt-0.5">{ev.time}</span>
                  <span className="text-slate-300">{ev.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showQrModal && (
        <HiderQrModal
          myPlayer={myPlayer}
          roomCode={room.code}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {showScannerModal && (
        <SeekerScannerModal
          onScanCode={handleScanSubmit}
          onClose={() => setShowScannerModal(false)}
        />
      )}

      {showHudMode && (
        <HudModeOverlay
          proximity={proximity}
          myPlayer={myPlayer}
          myPosition={myPosition}
          gpsSpeed={gpsSpeed}
          gpsAccuracy={gpsAccuracy}
          timeRemaining={room.timeRemaining}
          isHidingPhase={isHidingPhase}
          formatTime={formatTime}
          onClose={() => setShowHudMode(false)}
          onOpenScanner={() => setShowScannerModal(true)}
          onOpenQr={() => setShowQrModal(true)}
        />
      )}
    </div>
  );
}
