import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Moon, 
  Satellite, 
  Map as MapIcon, 
  LocateFixed, 
  Gauge
} from 'lucide-react';
import { LicensePlate } from './LicensePlate';
import { getColorHex } from '../utils/carColors';

const svgIcons = {
  hider: `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  `,
  seeker: `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  `,
  survivor: `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-amber-300">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  `,
  caught: `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-rose-400">
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
  `,
  penalty: `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `,
};

const createCarIcon = (player, isMe, isGameOver) => {
  const role = player.role;
  const name = player.name;
  const isCaught = player.isCaught;
  const isHider = role === 'HIDER';
  const isSurvivor = isGameOver && isHider && !isCaught;
  const isPenalty = player.zonePenaltyActive;

  let borderColor = '#38bdf8';
  let bgColor = 'rgba(14, 165, 233, 0.9)';
  let glowColor = 'rgba(56, 189, 248, 0.6)';
  let iconSvg = svgIcons.seeker;
  let badgeTitle = name;

  if (isPenalty) {
    borderColor = '#ef4444';
    bgColor = 'rgba(220, 38, 38, 0.95)';
    glowColor = 'rgba(239, 68, 68, 0.9)';
    iconSvg = svgIcons.penalty;
    badgeTitle = `${name} [POZA STREFĄ!]`;
  } else if (isSurvivor) {
    borderColor = '#10b981';
    bgColor = 'rgba(168, 85, 247, 0.9)';
    glowColor = 'rgba(52, 211, 153, 0.8)';
    iconSvg = svgIcons.survivor;
    badgeTitle = `${name} [MISTRZ]`;
  } else if (isCaught) {
    borderColor = '#ef4444';
    bgColor = 'rgba(51, 65, 85, 0.85)';
    glowColor = 'rgba(239, 68, 68, 0.3)';
    iconSvg = svgIcons.caught;
    badgeTitle = `${name} [ZŁAPANY]`;
  } else if (isHider) {
    borderColor = '#c084fc';
    bgColor = 'rgba(168, 85, 247, 0.9)';
    glowColor = 'rgba(192, 132, 252, 0.6)';
    iconSvg = svgIcons.hider;
    badgeTitle = name;
  }

  const pulseRing = (isMe || isSurvivor || isPenalty) ? `
    <span class="absolute -inset-1 rounded-full animate-ping opacity-60" style="background-color: ${borderColor}"></span>
  ` : '';

  const heading = player.position?.heading || 0;
  const speed = player.position?.speed || 0;
  const isMoving = speed > 4;

  const headingPointer = isMoving ? `
    <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-amber-400 drop-shadow" style="transform: rotate(${heading}deg); transform-origin: 50% 24px;"></div>
  ` : '';

  const carColorHex = getColorHex(player.carColor);

  const speedBadge = isMoving ? `
    <span class="text-[9px] font-mono font-bold text-amber-300 ml-1">${speed} km/h</span>
  ` : '';

  const plateHtml = player.carPlate ? `
    <span class="inline-flex items-center bg-white text-slate-950 font-mono font-black text-[8px] px-1 py-0.2 rounded border border-black/80 ml-1">
      <span class="bg-blue-700 text-white text-[5px] font-bold px-0.5 rounded-l -ml-1 mr-0.5 leading-none">PL</span>
      <span>${player.carPlate}</span>
    </span>
  ` : '';

  const html = `
    <div class="flex flex-col items-center car-marker pointer-events-auto select-none ${isCaught && !isSurvivor ? 'opacity-70' : ''}">
      <div class="relative flex items-center justify-center w-11 h-11 rounded-full shadow-2xl border-2" 
           style="background-color: ${bgColor}; border-color: ${borderColor}; box-shadow: 0 0 16px ${glowColor};">
        ${pulseRing}
        ${headingPointer}
        <div class="relative z-10 flex items-center justify-center">${iconSvg}</div>
        <span class="absolute -bottom-0.5 -left-0.5 z-20 w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm" style="background-color: ${carColorHex}"></span>
        ${isMe && !isCaught ? '<span class="absolute -top-1 -right-1 z-20 flex h-3.5 w-3.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span></span>' : ''}
      </div>
      
      <div class="mt-1 px-2.5 py-0.5 rounded-md bg-slate-950/95 shadow-xl border border-white/10 flex items-center gap-1 backdrop-blur-md">
        ${isMe ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : ''}
        <span class="text-[10px] font-black tracking-tight whitespace-nowrap ${
          isPenalty ? 'text-rose-400 animate-pulse font-extrabold' : isSurvivor ? 'text-emerald-300 font-extrabold' : isCaught ? 'text-rose-400 line-through' : 'text-slate-100'
        }">${isMe ? 'JA: ' : ''}${badgeTitle}</span>
        ${speedBadge}
        ${plateHtml}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-car-icon',
    iconSize: [44, 68],
    iconAnchor: [22, 22],
  });
};

function MapController({ center, autoCenter }) {
  const map = useMap();
  useEffect(() => {
    if (autoCenter && center && typeof center.lat === 'number') {
      map.setView([center.lat, center.lng], map.getZoom() || 15, { animate: true });
    }
  }, [center, autoCenter, map]);
  return null;
}

function FitSurvivorsController({ players, gameState }) {
  const map = useMap();
  useEffect(() => {
    if (gameState === 'FINISHED') {
      const activePositions = players
        .filter((p) => p.position && typeof p.position.lat === 'number')
        .map((p) => [p.position.lat, p.position.lng]);

      if (activePositions.length > 0) {
        try {
          const bounds = L.latLngBounds(activePositions);
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
        } catch {}
      }
    }
  }, [gameState, players, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export function MapComponent({
  center,
  players = [],
  myPlayerId,
  zone,
  settings,
  nextZone,
  radarPings = [],
  gameState,
  onMapClick,
  autoCenter = false,
  onToggleAutoCenter,
  mySpeed = 0,
}) {
  const defaultCenter = center || (zone && zone.center) || { lat: 52.2297, lng: 21.0122 };
  const [mapLayer, setMapLayer] = useState('dark');
  const isGameOver = gameState === 'FINISHED';

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isMovingZoneMode = settings?.gameMode === 'MOVING_ZONE';

  const cycleLayer = (e) => {
    e.stopPropagation();
    if (mapLayer === 'dark') setMapLayer('satellite');
    else if (mapLayer === 'satellite') setMapLayer('street');
    else setMapLayer('dark');
  };

  const getLayerConfig = () => {
    if (mapLayer === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri World Imagery',
        className: '',
        maxZoom: 19,
      };
    }
    if (mapLayer === 'street') {
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abc',
        className: '',
        maxZoom: 19,
      };
    }
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: 'abc',
      className: 'map-tiles-dark',
      maxZoom: 19,
    };
  };

  const currentConfig = getLayerConfig();

  return (
    <div className="relative w-full h-full min-h-0">
      <div className="absolute top-20 sm:top-24 right-3 z-[1000] pointer-events-auto flex flex-col gap-2">
        <button
          onClick={cycleLayer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-white text-xs font-bold shadow-2xl transition hover:border-amber-500/50 active:scale-95 cursor-pointer"
          title="Zmień widok mapy (Noc / Satelita / Dzień)"
        >
          {mapLayer === 'dark' && <Moon className="w-3.5 h-3.5 text-purple-400" />}
          {mapLayer === 'satellite' && <Satellite className="w-3.5 h-3.5 text-cyan-400" />}
          {mapLayer === 'street' && <MapIcon className="w-3.5 h-3.5 text-amber-400" />}
          <span>
            {mapLayer === 'dark' ? 'Ciemna' : mapLayer === 'satellite' ? 'Satelita' : 'Jasna'}
          </span>
        </button>

        {onToggleAutoCenter && (
          <button
            onClick={onToggleAutoCenter}
            className={`p-2 rounded-xl glass-panel shadow-2xl transition active:scale-95 cursor-pointer flex items-center justify-center ${
              autoCenter ? 'text-amber-400 border-amber-400/50 bg-amber-500/10' : 'text-slate-400 hover:text-white'
            }`}
            title="Śledź moją pozycję na mapie"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="absolute bottom-28 sm:bottom-32 left-3 z-[900] pointer-events-none flex flex-col gap-2 max-w-[280px]">
        {nextZone && (
          <div className="glass-panel px-3 py-2 rounded-2xl shadow-2xl border-amber-400/50 bg-amber-950/80 pointer-events-auto flex items-center gap-2 text-white animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div className="text-left leading-tight">
              <span className="text-[9px] font-black uppercase text-amber-300 block tracking-wider">
                Strefa Przemieszcza Się!
              </span>
              <span className="text-[11px] font-bold text-white">
                Dotrzyj do żółtego okręgu: <strong className="font-mono text-amber-300">{nextZone.secondsLeft}s</strong>
              </span>
            </div>
          </div>
        )}

        <div className="glass-panel px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-2 border-white/10 pointer-events-auto self-start">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider leading-none">Prędkość</span>
            <div className="flex items-baseline gap-0.5">
              <span className="font-mono text-base font-black text-white leading-tight">{mySpeed || 0}</span>
              <span className="text-[8px] font-bold text-slate-400">km/h</span>
            </div>
          </div>
        </div>

        {myPlayer && zone && (
          <div className={`px-2.5 py-1 rounded-xl glass-panel text-[10px] font-bold shadow-xl border flex items-center gap-1.5 pointer-events-auto self-start ${
            myPlayer.isOutOfZone
              ? 'border-rose-500 text-rose-300 bg-rose-950/60 animate-pulse'
              : 'border-emerald-500/40 text-emerald-300 bg-slate-950/80'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${myPlayer.isOutOfZone ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>
              {myPlayer.isOutOfZone
                ? (myPlayer.zonePenaltyActive ? 'KARA: POZYCJA ODSŁONIĘTA!' : `POZA STREFĄ (${myPlayer.outOfZoneSecondsLeft || 0}s)`)
                : isMovingZoneMode ? 'W AKTYWNEJ STREFIE' : 'W STREFIE GRY'}
            </span>
          </div>
        )}
      </div>

      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          key={mapLayer}
          attribution={currentConfig.attribution}
          url={currentConfig.url}
          subdomains={currentConfig.subdomains || 'abc'}
          maxZoom={currentConfig.maxZoom || 19}
          className={currentConfig.className}
        />

        <MapController center={defaultCenter} autoCenter={autoCenter} />
        <FitSurvivorsController players={players} gameState={gameState} />
        <MapClickHandler onMapClick={onMapClick} />

        {isMovingZoneMode && settings?.movingZone?.outerCenter && (
          <Circle
            center={[settings.movingZone.outerCenter.lat, settings.movingZone.outerCenter.lng]}
            radius={settings.movingZone.outerRadius || 6000}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.03,
              weight: 2,
              dashArray: '10, 8',
            }}
          />
        )}

        {nextZone && (
          <Circle
            center={[nextZone.center.lat, nextZone.center.lng]}
            radius={nextZone.radius || 1800}
            pathOptions={{
              color: '#eab308',
              fillColor: '#eab308',
              fillOpacity: 0.18,
              weight: 3.5,
              dashArray: '6, 6',
              className: 'radar-ping-circle',
            }}
          />
        )}

        {zone && zone.center && (
          <>
            <Circle
              center={[zone.center.lat, zone.center.lng]}
              radius={zone.radius || 2500}
              pathOptions={{
                color: myPlayer?.isOutOfZone ? '#ef4444' : '#f43f5e',
                fillColor: '#f43f5e',
                fillOpacity: 0.06,
                weight: 3,
                dashArray: '8, 8',
              }}
            />
            <Circle
              center={[zone.center.lat, zone.center.lng]}
              radius={30}
              pathOptions={{
                color: '#f43f5e',
                fillColor: '#f43f5e',
                fillOpacity: 0.8,
                weight: 1,
              }}
            />
          </>
        )}

        {gameState === 'HUNTING' && radarPings && radarPings.map((ping, idx) => (
          <Circle
            key={ping.id || idx}
            center={[ping.lat, ping.lng]}
            radius={ping.radius || 200}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#f59e0b',
              fillOpacity: 0.22,
              weight: 3,
              className: 'radar-ping-circle',
            }}
          >
            <Popup>
              <div className="p-1 space-y-1 text-slate-950 min-w-[130px]">
                <div className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Strefa Celu Radaru</div>
                <div className="font-bold text-xs">{ping.name}</div>
                <div className="text-[11px] text-slate-700">{ping.carModel || 'Auto'}</div>
                {ping.carColor && <div className="text-[10px] text-slate-600">Kolor: <strong>{ping.carColor}</strong></div>}
                {ping.carPlate && (
                  <div className="pt-1">
                    <LicensePlate plate={ping.carPlate} size="xs" />
                  </div>
                )}
              </div>
            </Popup>
          </Circle>
        ))}

        {isGameOver && players.map((p) => {
          if (p.role === 'HIDER' && !p.isCaught && p.position && typeof p.position.lat === 'number') {
            return (
              <Circle
                key={`survivor-spot-${p.id}`}
                center={[p.position.lat, p.position.lng]}
                radius={80}
                pathOptions={{
                  color: '#10b981',
                  fillColor: '#10b981',
                  fillOpacity: 0.35,
                  weight: 3,
                  className: 'radar-ping-circle',
                }}
              />
            );
          }
          return null;
        })}

        {players.map((p) => {
          if (!p.position || typeof p.position.lat !== 'number') return null;
          const isMe = p.id === myPlayerId;
          const icon = createCarIcon(p, isMe, isGameOver);

          return (
            <Marker
              key={p.id}
              position={[p.position.lat, p.position.lng]}
              icon={icon}
            >
              <Popup>
                <div className="p-1.5 space-y-1 text-slate-950 min-w-[140px]">
                  <div className="font-black text-xs flex items-center justify-between gap-2">
                    <span>{p.name} {isMe ? '(TY)' : ''}</span>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      p.role === 'HIDER' ? 'bg-purple-100 text-purple-900' : 'bg-cyan-100 text-cyan-900'
                    }`}>
                      {p.role === 'HIDER' ? 'Ucieka' : 'Szuka'}
                    </span>
                  </div>

                  {p.zonePenaltyActive && (
                    <div className="p-1 rounded bg-red-100 text-red-800 text-[10px] font-bold border border-red-300">
                      KARA: Poza strefą gry!
                    </div>
                  )}

                  <div className="text-[11px] font-semibold text-slate-800">
                    {p.carModel || 'Auto'}
                  </div>

                  {p.position?.speed > 0 && (
                    <div className="text-[10px] text-slate-600 font-mono">
                      Prędkość: <strong>{p.position.speed} km/h</strong>
                    </div>
                  )}

                  {p.carColor && (
                    <div className="text-[10px] text-slate-600 flex items-center gap-1">
                      <span>Kolor:</span>
                      <span className="w-2 h-2 rounded-full border border-black/40" style={{ backgroundColor: getColorHex(p.carColor) }} />
                      <strong className="text-slate-900">{p.carColor}</strong>
                    </div>
                  )}
                  {p.carPlate && (
                    <div className="pt-1">
                      <LicensePlate plate={p.carPlate} size="xs" />
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
