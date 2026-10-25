import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  RotateCcw, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Map, 
  Maximize2,
  Shield,
  Crown,
  History
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { LicensePlate } from './LicensePlate';
import { GameHistoryModal } from './GameHistoryModal';

export function GameOverModal({ room, myPlayer, onResetToLobby }) {
  const [minimized, setMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isWinnerSeekers = room.winner === 'SEEKERS';
  const isHost = myPlayer?.isHost;

  const hiders = room.players.filter((p) => p.role === 'HIDER');
  const survivingHiders = hiders.filter((p) => !p.isCaught);

  useEffect(() => {
    sounds.playVictory();

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    const timeout = setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  if (minimized) {
    return (
      <div className="fixed bottom-4 inset-x-4 z-[2000] max-w-lg mx-auto pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 animate-bounce">
              {isWinnerSeekers ? (
                <Shield className="w-5 h-5 text-cyan-400" />
              ) : (
                <Crown className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>{isWinnerSeekers ? 'Łowcy wygrali!' : 'Uciekinierzy wygrali!'}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                  <Map className="w-3 h-3" />
                  Kryjówki odsłonięte na mapie
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                {isWinnerSeekers 
                  ? 'Wszystkie auta zostały schwytane.' 
                  : `Przetrwali: ${survivingHiders.map((h) => h.name).join(', ')}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMinimized(false)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Otwórz pełne podsumowanie"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Wyniki</span>
            </button>

            {isHost && (
              <button
                onClick={onResetToLobby}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nowa Runda</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="max-w-md w-full max-h-[94dvh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-4 sm:p-6 text-center space-y-3 sm:space-y-4 shadow-2xl relative overflow-hidden">
        <div 
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 ${
            isWinnerSeekers ? 'bg-cyan-500' : 'bg-emerald-500'
          }`} 
        />

        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 text-amber-400 shadow-xl">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-1 relative">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {isWinnerSeekers ? 'Łowcy Zwyciężyli' : 'Uciekinierzy Zwyciężyli!'}
          </span>
          <h2 className="text-2xl font-black text-white">
            {isWinnerSeekers ? 'WSZYSCY SCHWYTANI W CZASIE!' : 'CZAS MINĄŁ! UCIEKINIERZY PRZETRWALI!'}
          </h2>
          <p className="text-xs text-slate-300 px-2 leading-relaxed">
            {isWinnerSeekers
              ? 'Załogom łowców udało się namierzyć i zeskanować wszystkie uciekające auta przed upływem czasu!'
              : 'Łowcom skończył się czas! Niezłapane załogi uciekinierów wygrywają rundę. Ich dokładne kryjówki zostały odsłonięte na mapie!'}
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5 text-left">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-800 flex justify-between">
            <span>Uciekające Załogi ({hiders.length})</span>
            <span>Wynik</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {hiders.map((h) => (
              <div key={h.id} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800">
                    {h.isCaught ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{h.name}</span>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">{h.carModel || 'Auto'}</span>
                      {h.carColor && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {h.carColor}
                        </span>
                      )}
                      {h.carPlate && <LicensePlate plate={h.carPlate} size="xs" />}
                    </div>
                  </div>
                </div>

                {h.isCaught ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-900/40">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Złapany ({h.caughtBy || 'Łowca'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-black bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    PRZETRWAŁ! (WYGRAŁ)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMinimized(true)}
              className="py-3 px-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.98] text-xs"
            >
              <Map className="w-4 h-4 text-emerald-400" />
              <span>Mapa kryjówek</span>
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="py-3 px-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.98] text-xs"
            >
              <History className="w-4 h-4 text-cyan-400" />
              <span>Historia gier</span>
            </button>
          </div>

          {isHost ? (
            <button
              onClick={onResetToLobby}
              className="w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Zagraj kolejną rundę (Poczekalnia)
            </button>
          ) : (
            <div className="text-xs text-slate-400 pt-1">
              Czekamy na kapitana pokoju, aby rozpocząć nową rundę...
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <GameHistoryModal
          history={room.history || []}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
