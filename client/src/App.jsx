import React, { useState, useEffect } from 'react';
import { socket } from './services/socket';
import { useGeolocation } from './hooks/useGeolocation';
import { LobbyView } from './components/LobbyView';
import { GameView } from './components/GameView';
import { GameOverModal } from './components/GameOverModal';
import { sounds } from './utils/audio';
import { 
  getOrCreatePlayerId, 
  saveCurrentRoom, 
  getCurrentRoom, 
  clearCurrentRoom 
} from './utils/session';
import { AlertCircle, RefreshCw, Radar, FlaskConical } from 'lucide-react';

export default function App() {
  const [room, setRoom] = useState(null);
  const [autoCenter, setAutoCenter] = useState(true);
  const { 
    position, 
    accuracy, 
    speed, 
    gpsStatus, 
    isMock, 
    setMockPosition, 
    retryGps 
  } = useGeolocation();

  useEffect(() => {
    const savedRoom = getCurrentRoom();
    const playerId = getOrCreatePlayerId();

    if (savedRoom) {
      socket.emit('reconnect_session', { roomCode: savedRoom, playerId }, (res) => {
        if (res && res.success && res.room) {
          setRoom(res.room);
        } else {
          clearCurrentRoom();
        }
      });
    }

    socket.on('room_state', (state) => {
      setRoom(state);
      if (state && state.code) {
        saveCurrentRoom(state.code);
      }
    });

    socket.on('radar_ping', () => {
      sounds.playRadarPing();
    });

    socket.on('alert', () => {
      sounds.playAlert();
    });

    return () => {
      socket.off('room_state');
      socket.off('radar_ping');
      socket.off('alert');
    };
  }, []);

  const handleCreateRoom = (profile) => {
    const playerId = getOrCreatePlayerId();
    const payload = typeof profile === 'string'
      ? { playerName: profile, playerId }
      : { ...profile, playerId };

    socket.emit('create_room', payload, (res) => {
      if (res && res.error) {
        alert(res.error);
      } else if (res && res.roomCode) {
        saveCurrentRoom(res.roomCode);
      }
    });
  };

  const handleJoinRoom = (roomCode, profile) => {
    const playerId = getOrCreatePlayerId();
    const payload = typeof profile === 'string'
      ? { roomCode, playerName: profile, playerId }
      : { roomCode, ...profile, playerId };

    socket.emit('join_room', payload, (res) => {
      if (res && res.error) {
        alert(res.error);
      } else if (res && res.roomCode) {
        saveCurrentRoom(res.roomCode);
      }
    });
  };

  const handleLeaveRoom = () => {
    if (room?.code) {
      socket.emit('leave_room', { roomCode: room.code });
    }
    clearCurrentRoom();
    setRoom(null);
  };

  const handleUpdateProfile = (profile) => {
    if (!room) return;
    socket.emit('update_profile', {
      roomCode: room.code,
      ...profile,
    });
  };

  const handleSetRole = (role, targetSocketId = null) => {
    if (!room) return;
    socket.emit('set_role', { roomCode: room.code, targetSocketId, role });
  };

  const handleRandomizeTeams = (mode = 'ratio') => {
    if (!room) return;
    socket.emit('randomize_teams', { roomCode: room.code, mode });
  };

  const handleUpdateSettings = (settings) => {
    if (!room) return;
    socket.emit('update_settings', { roomCode: room.code, settings });
  };

  const handleSetZone = (zoneData) => {
    if (!room) return;
    socket.emit('set_zone', {
      roomCode: room.code,
      gameMode: zoneData.gameMode || 'STATIC',
      center: zoneData.center,
      radius: zoneData.radius,
      graceSeconds: zoneData.graceSeconds,
      movingZone: zoneData.movingZone,
    });
  };

  const handleStartGame = () => {
    if (!room) return;
    socket.emit('start_game', { roomCode: room.code }, (res) => {
      if (res && res.error) alert(res.error);
    });
  };

  const handleAttemptCatch = (callback) => {
    if (!room) return;
    socket.emit('attempt_catch', { roomCode: room.code }, callback);
  };

  const handleScanCatchCode = (code, callback) => {
    if (!room) return;
    socket.emit('scan_catch_code', { roomCode: room.code, code }, callback);
  };

  const handleResetToLobby = () => {
    if (!room) return;
    socket.emit('reset_to_lobby', { roomCode: room.code });
  };

  const handleMapClick = (coords) => {
    if (isMock) {
      setMockPosition(coords);
    }
  };

  const renderGpsBadge = () => {
    if (isMock) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/40 text-amber-300">
          <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
          Tryb Symulacji
        </span>
      );
    }
    if (gpsStatus === 'LOCKED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/40 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          GPS: ±{accuracy || 5}m | {speed || 0} km/h
        </span>
      );
    }
    if (gpsStatus === 'ACQUIRING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/40 text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          Szukanie GPS...
        </span>
      );
    }
    if (gpsStatus === 'INSECURE') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border bg-rose-500/10 border-rose-500/40 text-rose-300">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Wymagane HTTPS do GPS
        </span>
      );
    }
    return (
      <button
        onClick={retryGps}
        className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        Brak GPS (Ponów)
      </button>
    );
  };

  if (!room || room.state === 'LOBBY') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col text-white">
        <header className="p-3 border-b border-slate-800/80 flex items-center justify-between max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Radar className="w-4 h-4 animate-pulse" />
            </div>
            <span className="font-black text-sm tracking-wide uppercase italic">CarHunt GPS</span>
          </div>

          <div className="flex items-center gap-2">
            {renderGpsBadge()}
          </div>
        </header>

        {gpsStatus === 'INSECURE' && (
          <div className="max-w-xl mx-auto w-full p-3 bg-amber-950/60 border-b border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Przeglądarka w telefonie wymaga HTTPS:</strong> Aby telefon udostępnił prawdziwy GPS, otwórz stronę pod adresem z szyfrowaniem:
              <div className="font-mono text-white bg-slate-900 px-2 py-1 rounded mt-1 select-all border border-slate-700">
                https://{window.location.hostname}:3443
              </div>
            </div>
          </div>
        )}

        {gpsStatus === 'DENIED' && (
          <div className="max-w-xl mx-auto w-full p-3 bg-red-950/60 border-b border-red-500/40 text-red-200 text-xs flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong>Dostęp do lokalizacji GPS został zablokowany:</strong> Kliknij ikonę kłódki/ustawień przy pasku adresu i zezwól na <strong>Lokalizację</strong>.
              </div>
            </div>
            <button
              onClick={retryGps}
              className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs shrink-0"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

        <main className="flex-1 flex flex-col">
          <LobbyView
            room={room}
            myPlayer={room?.myPlayer}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onUpdateProfile={handleUpdateProfile}
            onSetRole={handleSetRole}
            onRandomizeTeams={handleRandomizeTeams}
            onUpdateSettings={handleUpdateSettings}
            onSetZone={handleSetZone}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            myGpsPosition={position}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-slate-950 flex flex-col overflow-hidden">
      <GameView
        room={room}
        myPlayer={room.myPlayer}
        myPosition={position}
        gpsAccuracy={accuracy}
        gpsSpeed={speed}
        gpsStatus={gpsStatus}
        isMock={isMock}
        onMapClick={handleMapClick}
        onAttemptCatch={handleAttemptCatch}
        onScanCatchCode={handleScanCatchCode}
        onResetToLobby={handleResetToLobby}
        autoCenter={autoCenter}
        setAutoCenter={setAutoCenter}
        onRetryGps={retryGps}
      />

      {room.state === 'FINISHED' && (
        <GameOverModal
          room={room}
          myPlayer={room.myPlayer}
          onResetToLobby={handleResetToLobby}
        />
      )}
    </div>
  );
}
