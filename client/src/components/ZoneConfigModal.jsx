import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Crosshair, 
  Check, 
  X, 
  Navigation, 
  ShieldAlert, 
  Maximize2,
  Radio, 
  RotateCw
} from 'lucide-react';

const zoneCenterIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <span class="absolute -inset-1 rounded-full bg-rose-500 animate-ping opacity-75"></span>
      <div class="relative w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-black text-[9px]">
        +
      </div>
    </div>
  `,
  className: 'custom-zone-center-icon',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function ZoneMapEvents({ onCenterSelect }) {
  useMapEvents({
    click(e) {
      if (onCenterSelect) {
        onCenterSelect({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) });
      }
    },
  });
  return null;
}

function ZoneMapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center.lat === 'number') {
      map.setView([center.lat, center.lng], map.getZoom() || 13, { animate: true });
    }
  }, [center, map]);
  return null;
}

const STATIC_PRESETS = [
  { label: '1.0 km', radius: 1000, desc: 'Dzielnica' },
  { label: '2.5 km', radius: 2500, desc: 'Średnie miasto' },
  { label: '5.0 km', radius: 5000, desc: 'Duże miasto' },
  { label: '10.0 km', radius: 10000, desc: 'Powiat' },
];

export function ZoneConfigModal({
  currentZone,
  roomSettings,
  myGpsPosition,
  onSaveZone,
  onClose,
}) {
  const initialMode = roomSettings?.gameMode || 'STATIC';
  const [gameMode, setGameMode] = useState(initialMode);

  const [center, setCenter] = useState(
    currentZone?.center || roomSettings?.movingZone?.outerCenter || myGpsPosition || { lat: 52.2297, lng: 21.0122 }
  );

  const [staticRadius, setStaticRadius] = useState(currentZone?.radius || 2500);
  const [graceSeconds, setGraceSeconds] = useState(currentZone?.graceSeconds || 30);

  const [outerRadius, setOuterRadius] = useState(roomSettings?.movingZone?.outerRadius || 6000);
  const [activeRadius, setActiveRadius] = useState(roomSettings?.movingZone?.activeRadius || 1800);
  const [shiftInterval, setShiftInterval] = useState(roomSettings?.movingZone?.shiftInterval || 240);
  const [transitionDuration, setTransitionDuration] = useState(roomSettings?.movingZone?.transitionDuration || 60);

  const handleUseMyGps = () => {
    if (myGpsPosition && typeof myGpsPosition.lat === 'number') {
      setCenter({ lat: myGpsPosition.lat, lng: myGpsPosition.lng });
    }
  };

  const handleSave = () => {
    if (gameMode === 'MOVING_ZONE') {
      onSaveZone({
        gameMode: 'MOVING_ZONE',
        graceSeconds: Number(graceSeconds),
        movingZone: {
          outerCenter: center,
          outerRadius: Number(outerRadius),
          activeRadius: Number(activeRadius),
          shiftInterval: Number(shiftInterval),
          transitionDuration: Number(transitionDuration),
        },
      });
    } else {
      onSaveZone({
        gameMode: 'STATIC',
        center,
        radius: Number(staticRadius),
        graceSeconds: Number(graceSeconds),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-slate-950/90 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 select-none pb-safe pt-safe">
      <div className="w-full max-w-lg mx-auto bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Konfiguracja Strefy Rozgrywki</h2>
              <span className="text-[10px] text-slate-400">Wyznacz dozwolony rejon zabawy dla aut</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2 sm:p-3 bg-slate-950/90 border-b border-white/5">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-white/10 text-xs font-black">
            <button
              type="button"
              onClick={() => setGameMode('STATIC')}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                gameMode === 'STATIC'
                  ? 'bg-rose-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Strefa Stała</span>
            </button>
            <button
              type="button"
              onClick={() => setGameMode('MOVING_ZONE')}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                gameMode === 'MOVING_ZONE'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Strefa w Ruchu (Dynamiczna)</span>
            </button>
          </div>
        </div>

        <div className="relative w-full h-52 sm:h-60 bg-slate-950">
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={gameMode === 'MOVING_ZONE' ? 12 : 13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains="abc"
              maxZoom={19}
              className="map-tiles-dark"
              attribution='&copy; OpenStreetMap contributors'
            />
            <ZoneMapEvents onCenterSelect={setCenter} />
            <ZoneMapRecenter center={center} />

            {gameMode === 'STATIC' && (
              <Circle
                center={[center.lat, center.lng]}
                radius={staticRadius}
                pathOptions={{
                  color: '#f43f5e',
                  fillColor: '#f43f5e',
                  fillOpacity: 0.12,
                  weight: 2.5,
                  dashArray: '6, 8',
                }}
              />
            )}

            {gameMode === 'MOVING_ZONE' && (
              <>
                <Circle
                  center={[center.lat, center.lng]}
                  radius={outerRadius}
                  pathOptions={{
                    color: '#06b6d4',
                    fillColor: '#06b6d4',
                    fillOpacity: 0.05,
                    weight: 2,
                    dashArray: '10, 8',
                  }}
                />
                <Circle
                  center={[center.lat, center.lng]}
                  radius={activeRadius}
                  pathOptions={{
                    color: '#f43f5e',
                    fillColor: '#f43f5e',
                    fillOpacity: 0.2,
                    weight: 3,
                  }}
                />
              </>
            )}

            <Marker position={[center.lat, center.lng]} icon={zoneCenterIcon} />
          </MapContainer>

          <div className="absolute top-2 left-2 right-2 z-[1000] pointer-events-none flex items-center justify-between gap-1">
            <span className="px-2.5 py-1 rounded-xl bg-slate-950/90 text-[10px] font-bold text-slate-200 border border-white/10 shadow-lg backdrop-blur-sm">
              Kliknij na mapie, aby ustawić centrum
            </span>

            {myGpsPosition && (
              <button
                type="button"
                onClick={handleUseMyGps}
                className="pointer-events-auto px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-lg cursor-pointer transition active:scale-95"
              >
                <Navigation className="w-3 h-3" />
                <span>Moja pozycja</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[45vh] text-xs">
          {gameMode === 'STATIC' && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px]">
                    Promień Strefy Gry:
                  </span>
                  <strong className="text-amber-400 font-mono text-sm font-black">
                    {(staticRadius / 1000).toFixed(1)} km ({staticRadius}m)
                  </strong>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {STATIC_PRESETS.map((preset) => {
                    const isSelected = staticRadius === preset.radius;
                    return (
                      <button
                        key={preset.radius}
                        type="button"
                        onClick={() => setStaticRadius(preset.radius)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <strong className="block text-xs font-black">{preset.label}</strong>
                        <span className="text-[9px] opacity-75">{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="250"
                  value={staticRadius}
                  onChange={(e) => setStaticRadius(Number(e.target.value))}
                  className="w-full accent-rose-500 mt-2.5"
                />
              </div>
            </div>
          )}

          {gameMode === 'MOVING_ZONE' && (
            <div className="space-y-3.5">
              <div className="glass-card p-3 rounded-2xl border-cyan-500/20 bg-cyan-950/20 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-cyan-300 uppercase text-[11px] flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    1. Główny Teren Operacyjny (Duży Okrąg):
                  </span>
                  <strong className="text-cyan-400 font-mono font-bold text-sm">
                    {(outerRadius / 1000).toFixed(1)} km
                  </strong>
                </div>
                <p className="text-[10px] text-slate-400">
                  Granica miasta / terenu, po którym strefa gry będzie się przemieszczać.
                </p>
                <input
                  type="range"
                  min="3000"
                  max="15000"
                  step="500"
                  value={outerRadius}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOuterRadius(val);
                    if (activeRadius > val * 0.6) setActiveRadius(Math.round(val * 0.4));
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="glass-card p-3 rounded-2xl border-rose-500/20 bg-rose-950/20 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-black text-rose-300 uppercase text-[11px] flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                    2. Aktywna Strefa Aut (Mniejszy Okrąg):
                  </span>
                  <strong className="text-rose-400 font-mono font-bold text-sm">
                    {(activeRadius / 1000).toFixed(1)} km
                  </strong>
                </div>
                <p className="text-[10px] text-slate-400">
                  Wewnątrz tego okręgu muszą znajdować się samochody. Co jakiś czas okrąg zmienia pozycję!
                </p>
                <input
                  type="range"
                  min="800"
                  max={Math.max(1000, outerRadius - 1000)}
                  step="200"
                  value={activeRadius}
                  onChange={(e) => setActiveRadius(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="glass-panel p-2.5 rounded-xl border-white/5 space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold">
                    Częstotliwość Ruchu:
                  </label>
                  <select
                    value={shiftInterval}
                    onChange={(e) => setShiftInterval(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  >
                    <option value={120}>Co 2 minuty</option>
                    <option value={180}>Co 3 minuty</option>
                    <option value={240}>Co 4 minuty</option>
                    <option value={300}>Co 5 minut</option>
                  </select>
                </div>

                <div className="glass-panel p-2.5 rounded-xl border-white/5 space-y-1">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold">
                    Czas na Przejazd:
                  </label>
                  <select
                    value={transitionDuration}
                    onChange={(e) => setTransitionDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs"
                  >
                    <option value={45}>45 sekund</option>
                    <option value={60}>60 sekund</option>
                    <option value={90}>90 sekund</option>
                    <option value={120}>2 minuty</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-3 border-amber-500/20 bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <strong className="text-xs uppercase tracking-wider">Karencja na Powrót do Strefy:</strong>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              Gdy auto wyjedzie poza strefę, zaczyna się odliczanie. Brak powrotu = odsłonięcie pozycji łowcom!
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-amber-900/30">
              <span className="text-[11px] text-slate-300 font-medium">Czas karencji:</span>
              <div className="flex items-center gap-1">
                {[15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setGraceSeconds(sec)}
                    className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold border transition cursor-pointer ${
                      graceSeconds === sec
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3.5 border-t border-white/10 bg-slate-950/80 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Zatwierdź Strefę</span>
          </button>
        </div>
      </div>
    </div>
  );
}
