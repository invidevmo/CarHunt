import React from 'react';
import { History, X, Trophy, Shield, Award, XCircle, Clock } from 'lucide-react';
import { LicensePlate } from './LicensePlate';

export function GameHistoryModal({ history = [], onClose }) {
  const activeHistory = React.useMemo(() => {
    if (history && history.length > 0) return history;
    try {
      const raw = localStorage.getItem('carhunt_match_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [history]);

  const totalGames = activeHistory.length;
  const seekersWins = activeHistory.filter((m) => m.winner === 'SEEKERS').length;
  const survivorsWins = activeHistory.filter((m) => m.winner === 'SURVIVORS').length;

  const formatDuration = (secs) => {
    if (!secs) return '0 min';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-slate-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 select-none pb-safe pt-safe">
      <div className="w-full max-w-lg mx-auto bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[82dvh] sm:h-[650px] overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Historia Rozgrywek & Statystyki</h2>
              <span className="text-[10px] text-slate-400">Zapis minionych rund samochodowego chowanego</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4 bg-slate-950/90 border-b border-white/5 grid grid-cols-3 gap-2 text-center font-mono">
          <div className="glass-panel p-2.5 rounded-2xl border-white/5">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Rozegrane Gry</span>
            <span className="text-2xl font-black text-white">{totalGames}</span>
          </div>

          <div className="glass-panel p-2.5 rounded-2xl border-cyan-500/20 bg-cyan-950/20">
            <span className="text-[9px] uppercase tracking-wider text-cyan-300 block font-bold">Łowcy</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-black text-cyan-400">{seekersWins}</span>
              <span className="text-[10px] text-cyan-300">
                ({totalGames > 0 ? Math.round((seekersWins / totalGames) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="glass-panel p-2.5 rounded-2xl border-emerald-500/20 bg-emerald-950/20">
            <span className="text-[9px] uppercase tracking-wider text-emerald-300 block font-bold">Uciekinierzy</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-black text-emerald-400">{survivorsWins}</span>
              <span className="text-[10px] text-emerald-300">
                ({totalGames > 0 ? Math.round((survivorsWins / totalGames) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 text-xs">
          {activeHistory.length === 0 ? (
            <div className="text-center text-slate-500 py-20 flex flex-col items-center gap-2">
              <Trophy className="w-10 h-10 text-slate-600 animate-pulse" />
              <span>Brak zapisanych gier w historii. Rozegrajcie pierwszą rundę!</span>
            </div>
          ) : (
            activeHistory.map((m) => {
              const isSeekerWin = m.winner === 'SEEKERS';

              return (
                <div
                  key={m.id}
                  className="glass-card rounded-2xl p-3.5 border-white/10 space-y-2.5 shadow-lg"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${
                        isSeekerWin ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {isSeekerWin ? <Shield className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-black text-xs text-white">
                          {isSeekerWin ? 'Wygrana: Łowcy (Wszyscy złapani)' : 'Wygrana: Uciekinierzy (Przetrwali)'}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{m.dateStr}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 font-mono font-bold">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {formatDuration(m.durationSeconds)}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        {m.gameMode === 'MOVING_ZONE' ? 'Strefa Dynamiczna' : 'Strefa Stała'}
                      </span>
                    </div>
                  </div>

                  {m.survivors && m.survivors.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Przetrwali ({m.survivors.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.survivors.map((s, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-[11px] text-white"
                          >
                            <Award className="w-3 h-3 text-emerald-400" />
                            <strong>{s.name}</strong>
                            <span className="text-slate-400 font-mono text-[10px]">({s.carModel})</span>
                            {s.carPlate && <LicensePlate plate={s.carPlate} size="xs" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.caught && m.caught.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                        Schwytani ({m.caught.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.caught.map((c, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                          >
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>{c.name}</span>
                            <span className="text-slate-500 font-mono text-[10px]">({c.carModel})</span>
                            {c.carPlate && <LicensePlate plate={c.carPlate} size="xs" />}
                            {c.caughtBy && (
                              <span className="text-[9px] text-amber-400 font-bold ml-0.5">
                                [przez {c.caughtBy}]
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
