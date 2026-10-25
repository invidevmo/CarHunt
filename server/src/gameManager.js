import { getDistanceMeters, fuzzCoordinate } from './utils/geo.js';

const generateCatchCode = () => Math.floor(1000 + Math.random() * 9000).toString();

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  generateRoomCode() {
    let code;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.rooms.has(code));
    return code;
  }

  parseCarInfo(carInfo) {
    if (typeof carInfo === 'object' && carInfo !== null) {
      return {
        carModel: (carInfo.carModel || 'Auto').trim(),
        carColor: (carInfo.carColor || '').trim(),
        carPlate: (carInfo.carPlate || '').trim().toUpperCase(),
      };
    }
    return {
      carModel: (typeof carInfo === 'string' && carInfo.trim()) ? carInfo.trim() : 'Auto',
      carColor: '',
      carPlate: '',
    };
  }

  formatCarDescription(p) {
    const parts = [p.carModel || 'Auto'];
    if (p.carColor) parts.push(p.carColor);
    if (p.carPlate) parts.push(`[${p.carPlate}]`);
    return parts.join(' • ');
  }

  createRoom(hostSocketId, hostName, carInfo = 'Nieznane auto', hostPlayerId = null) {
    const code = this.generateRoomCode();
    const catchCode = generateCatchCode();
    const car = this.parseCarInfo(carInfo);
    const playerId = hostPlayerId || hostSocketId;

    const room = {
      code,
      hostId: hostSocketId,
      state: 'LOBBY',
      createdAt: Date.now(),
      settings: {
        gameMode: 'STATIC',
        hideDuration: 180,
        gameDuration: 900,
        pingInterval: 90,
        pingFuzzRadius: 200,
        catchDistance: 50,
        zone: {
          center: { lat: 52.2297, lng: 21.0122 },
          radius: 2500,
          graceSeconds: 30,
        },
        movingZone: {
          outerCenter: { lat: 52.2297, lng: 21.0122 },
          outerRadius: 6000,
          activeRadius: 1800,
          shiftInterval: 240,
          transitionDuration: 60,
        },
      },
      players: new Map(),
      timer: null,
      timeRemaining: 0,
      phaseTimeTotal: 0,
      radarPings: [],
      lastPingTimestamp: 0,
      nextZone: null,
      winner: null,
      events: [],
    };

    room.players.set(hostSocketId, {
      id: hostSocketId,
      playerId,
      name: hostName || 'Gracz 1',
      carModel: car.carModel,
      carColor: car.carColor,
      carPlate: car.carPlate,
      role: 'HIDER',
      catchCode,
      catchToken: `CARHUNT:${code}:${hostSocketId}:${catchCode}`,
      position: null,
      isOutOfZone: false,
      isCaught: false,
      caughtBy: null,
      isHost: true,
      isOnline: true,
      disconnectedAt: null,
      lastMoveTimestamp: Date.now(),
    });

    this.rooms.set(code, room);
    return room;
  }

  joinRoom(roomCode, socketId, playerName, carInfo = 'Auto', clientPlayerId = null) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje!' };
    if (room.state !== 'LOBBY' && room.state !== 'FINISHED') {
      return { error: 'Gra jest już w toku!' };
    }

    const playerId = clientPlayerId || socketId;

    for (const [oldSocketId, p] of room.players.entries()) {
      if (p.playerId === playerId) {
        if (p.disconnectTimeout) {
          clearTimeout(p.disconnectTimeout);
          p.disconnectTimeout = null;
        }
        room.players.delete(oldSocketId);
        p.id = socketId;
        p.isOnline = true;
        p.disconnectedAt = null;
        room.players.set(socketId, p);
        this.logEvent(room, `${p.name} dołączył ponownie do pokoju.`);
        this.broadcastState(roomCode);
        return { room };
      }
    }

    const car = this.parseCarInfo(carInfo);
    const existingHiders = Array.from(room.players.values()).filter((p) => p.role === 'HIDER');
    const existingSeekers = Array.from(room.players.values()).filter((p) => p.role === 'SEEKER');
    const defaultRole = existingHiders.length <= existingSeekers.length ? 'HIDER' : 'SEEKER';
    const catchCode = generateCatchCode();

    const newPlayer = {
      id: socketId,
      playerId,
      name: playerName || `Gracz ${room.players.size + 1}`,
      carModel: car.carModel,
      carColor: car.carColor,
      carPlate: car.carPlate,
      role: defaultRole,
      catchCode,
      catchToken: `CARHUNT:${roomCode}:${socketId}:${catchCode}`,
      position: null,
      isOutOfZone: false,
      isCaught: false,
      caughtBy: null,
      isHost: false,
      isOnline: true,
      disconnectedAt: null,
      lastMoveTimestamp: Date.now(),
    };

    room.players.set(socketId, newPlayer);

    this.logEvent(room, `${playerName} dołączył jako ${defaultRole === 'HIDER' ? 'Uciekinier [UCIEKA]' : 'Łowca [SZUKA]'} (${this.formatCarDescription(newPlayer)}).`);
    this.broadcastState(roomCode);
    return { room };
  }

  reconnectPlayer(roomCode, socketId, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje lub wygasł.' };

    let targetPlayer = null;
    let oldSocketId = null;

    for (const [sId, p] of room.players.entries()) {
      if (p.playerId === playerId || p.id === socketId) {
        targetPlayer = p;
        oldSocketId = sId;
        break;
      }
    }

    if (!targetPlayer) {
      return { error: 'Nie znaleziono Twojej sesji w tym pokoju.' };
    }

    if (targetPlayer.disconnectTimeout) {
      clearTimeout(targetPlayer.disconnectTimeout);
      targetPlayer.disconnectTimeout = null;
    }

    if (oldSocketId && oldSocketId !== socketId) {
      room.players.delete(oldSocketId);
    }
    targetPlayer.id = socketId;
    targetPlayer.isOnline = true;
    targetPlayer.disconnectedAt = null;
    room.players.set(socketId, targetPlayer);

    if (targetPlayer.isHost) {
      room.hostId = socketId;
    }

    this.logEvent(room, `${targetPlayer.name} powrócił do gry po odświeżeniu strony.`);
    this.broadcastState(roomCode);

    return {
      success: true,
      room: this.getPublicRoomState(room, socketId),
    };
  }

  updatePlayerProfile(roomCode, socketId, profile) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(socketId);
    if (!player) return;

    if (profile.playerName && profile.playerName.trim()) {
      player.name = profile.playerName.trim();
    }
    if (profile.carModel !== undefined) {
      player.carModel = (profile.carModel || 'Auto').trim();
    }
    if (profile.carColor !== undefined) {
      player.carColor = (profile.carColor || '').trim();
    }
    if (profile.carPlate !== undefined) {
      player.carPlate = (profile.carPlate || '').trim().toUpperCase();
    }

    this.logEvent(room, `${player.name} zaktualizował dane auta: ${this.formatCarDescription(player)}`);
    this.broadcastState(roomCode);
  }

  leaveRoom(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.has(socketId)) {
        const player = room.players.get(socketId);
        player.isOnline = false;
        player.disconnectedAt = Date.now();

        this.logEvent(room, `${player.name} chwilowo utracił połączenie (oczekiwanie na powrót...).`);
        this.broadcastState(code);

        player.disconnectTimeout = setTimeout(() => {
          const currentRoom = this.rooms.get(code);
          if (currentRoom && currentRoom.players.has(socketId)) {
            const p = currentRoom.players.get(socketId);
            if (p && !p.isOnline) {
              currentRoom.players.delete(socketId);
              this.logEvent(currentRoom, `${p.name} został trwale usunięty z powodu przekroczenia czasu braku połączenia.`);

              if (currentRoom.players.size === 0) {
                if (currentRoom.timer) clearInterval(currentRoom.timer);
                this.rooms.delete(code);
              } else {
                if (currentRoom.hostId === socketId) {
                  const nextHost = currentRoom.players.values().next().value;
                  currentRoom.hostId = nextHost.id;
                  nextHost.isHost = true;
                  this.logEvent(currentRoom, `${nextHost.name} został nowym kapitanem pokoju.`);
                }
                this.broadcastState(code);
              }
            }
          }
        }, 120000);

        break;
      }
    }
  }

  explicitLeaveRoom(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.has(socketId)) {
        const player = room.players.get(socketId);
        if (player.disconnectTimeout) {
          clearTimeout(player.disconnectTimeout);
          player.disconnectTimeout = null;
        }
        room.players.delete(socketId);
        this.logEvent(room, `${player.name} opuścił pokój.`);

        if (room.players.size === 0) {
          if (room.timer) clearInterval(room.timer);
          this.rooms.delete(code);
        } else {
          if (room.hostId === socketId) {
            const nextHost = room.players.values().next().value;
            room.hostId = nextHost.id;
            nextHost.isHost = true;
            this.logEvent(room, `${nextHost.name} został nowym kapitanem pokoju.`);
          }
          this.broadcastState(code);
        }
        break;
      }
    }
  }

  setPlayerRole(roomCode, requesterSocketId, targetSocketId, newRole) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'LOBBY') return;
    const requester = room.players.get(requesterSocketId);
    if (!requester) return;

    if (requesterSocketId !== targetSocketId && !requester.isHost) return;

    const target = room.players.get(targetSocketId);
    if (!target) return;

    target.role = newRole;
    if (newRole === 'HIDER' && !target.catchCode) {
      target.catchCode = generateCatchCode();
      target.catchToken = `CARHUNT:${roomCode}:${target.id}:${target.catchCode}`;
    }

    this.logEvent(room, `${target.name} zmienił skład na: ${newRole === 'HIDER' ? 'Uciekinier [UCIEKA]' : 'Łowca [SZUKA]'}.`);
    this.broadcastState(roomCode);
  }

  randomizeTeams(roomCode, hostSocketId, mode = 'ratio') {
    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostSocketId || room.state !== 'LOBBY') return;

    const playerList = Array.from(room.players.values());
    if (playerList.length < 2) return;

    const shuffled = [...playerList].sort(() => Math.random() - 0.5);

    let hiderCount = 1;
    if (mode === 'single') {
      hiderCount = 1;
    } else if (mode === 'pair') {
      hiderCount = Math.min(2, Math.max(1, shuffled.length - 1));
    } else if (mode === 'half') {
      hiderCount = Math.max(1, Math.floor(shuffled.length / 2));
    } else {
      hiderCount = Math.max(1, Math.round(shuffled.length * 0.35));
      if (hiderCount >= shuffled.length) hiderCount = shuffled.length - 1;
    }

    shuffled.forEach((player, idx) => {
      const isHider = idx < hiderCount;
      player.role = isHider ? 'HIDER' : 'SEEKER';
      if (isHider && !player.catchCode) {
        player.catchCode = generateCatchCode();
        player.catchToken = `CARHUNT:${roomCode}:${player.id}:${player.catchCode}`;
      }
    });

    const hiderNames = shuffled.slice(0, hiderCount).map((p) => p.name).join(', ');
    const seekerNames = shuffled.slice(hiderCount).map((p) => p.name).join(', ');
    this.logEvent(room, `[SKŁADY] Wylosowano składy! Uciekają (${hiderCount}): ${hiderNames}. Szukają: ${seekerNames}.`);
    this.broadcastState(roomCode);
  }

  updateSettings(roomCode, hostSocketId, newSettings) {
    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostSocketId || room.state !== 'LOBBY') return;

    room.settings = {
      ...room.settings,
      ...newSettings,
      zone: {
        ...room.settings.zone,
        ...(newSettings.zone || {}),
      },
    };
    this.broadcastState(roomCode);
  }

  setZone(roomCode, hostSocketId, { gameMode = 'STATIC', center, radius, graceSeconds, movingZone }) {
    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostSocketId || room.state !== 'LOBBY') return;

    room.settings.gameMode = gameMode;

    if (gameMode === 'MOVING_ZONE') {
      if (movingZone) {
        room.settings.movingZone = {
          ...room.settings.movingZone,
          ...movingZone,
        };
        room.settings.zone.center = { ...room.settings.movingZone.outerCenter };
        room.settings.zone.radius = room.settings.movingZone.activeRadius || 1800;
      }
      if (typeof graceSeconds === 'number') {
        room.settings.zone.graceSeconds = graceSeconds;
      }
      this.logEvent(
        room,
        `[TRYB DYNAMICZNY] Włączono przemieszczającą się strefę! Obszar główny: ${(room.settings.movingZone.outerRadius / 1000).toFixed(1)} km, Strefa aut: ${(room.settings.movingZone.activeRadius / 1000).toFixed(1)} km, Zmiana co ${(room.settings.movingZone.shiftInterval / 60).toFixed(0)} min.`
      );
    } else {
      room.settings.gameMode = 'STATIC';
      if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
        room.settings.zone.center = { lat: center.lat, lng: center.lng };
      }
      if (typeof radius === 'number' && radius >= 300) {
        room.settings.zone.radius = radius;
      }
      if (typeof graceSeconds === 'number' && graceSeconds >= 5) {
        room.settings.zone.graceSeconds = graceSeconds;
      }
      this.logEvent(room, `[TRYB STAŁY] Zaktualizowano strefę: promień ${(room.settings.zone.radius / 1000).toFixed(1)} km, czas powrotu ${room.settings.zone.graceSeconds || 30}s.`);
    }

    this.broadcastState(roomCode);
  }

  updatePosition(socketId, coords) {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players.get(socketId);
      if (player && coords && typeof coords.lat === 'number') {
        player.position = {
          lat: coords.lat,
          lng: coords.lng,
          speed: coords.speed || 0,
          heading: coords.heading || 0,
          accuracy: coords.accuracy || 10,
          isMoving: coords.isMoving || false,
          updatedAt: Date.now(),
        };

        if (room.state === 'LOBBY' && player.isHost && (!room.settings.zone.center || room.settings.zone.center.lat === 52.2297)) {
          room.settings.zone.center = { lat: coords.lat, lng: coords.lng };
        }

        if (room.state === 'HIDING' || room.state === 'HUNTING') {
          const wasOut = player.isOutOfZone;
          const distFromCenter = getDistanceMeters(player.position, room.settings.zone.center);
          const isOut = distFromCenter > room.settings.zone.radius;
          player.isOutOfZone = isOut;
          player.distToZoneEdge = Math.round(distFromCenter - room.settings.zone.radius);

          if (!wasOut && isOut) {
            player.outOfZoneSince = Date.now();
            const grace = room.settings.zone.graceSeconds || 30;
            player.outOfZoneSecondsLeft = grace;
            this.logEvent(room, `[STREFA] OSTRZEŻENIE: ${player.name} (${player.role}) opuścił strefę gry! Pozostało ${grace}s na powrót!`);
            this.io.to(code).emit('alert', {
              type: 'ZONE_BREACH_WARNING',
              playerName: player.name,
              message: `${player.name} opuścił strefę gry! Wróć w ciągu ${grace}s!`,
            });
          } else if (wasOut && !isOut) {
            player.outOfZoneSince = null;
            player.outOfZoneSecondsLeft = 0;
            if (player.zonePenaltyActive) {
              player.zonePenaltyActive = false;
              this.logEvent(room, `[STREFA] ${player.name} powrócił do strefy gry. Kara anulowana.`);
              this.io.to(code).emit('alert', {
                type: 'ZONE_PENALTY_CLEARED',
                playerName: player.name,
                message: `${player.name} wrócił do strefy gry!`,
              });
            }
          }
        }

        this.broadcastState(code);
        break;
      }
    }
  }

  startGame(roomCode, hostSocketId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostSocketId) return { error: 'Brak uprawnień!' };

    const hiders = Array.from(room.players.values()).filter((p) => p.role === 'HIDER');
    const seekers = Array.from(room.players.values()).filter((p) => p.role === 'SEEKER');

    if (hiders.length === 0) return { error: 'Wybierz co najmniej jedno auto Uciekiniera!' };
    if (seekers.length === 0) return { error: 'Wybierz co najmniej jedno auto Łowcy!' };

    room.winner = null;
    room.events = [];
    room.radarPings = [];
    for (const p of room.players.values()) {
      p.isCaught = false;
      p.caughtBy = null;
      if (p.role === 'HIDER' && !p.catchCode) {
        p.catchCode = generateCatchCode();
        p.catchToken = `CARHUNT:${roomCode}:${p.id}:${p.catchCode}`;
      }
    }

    room.state = 'HIDING';
    room.timeRemaining = room.settings.hideDuration;
    room.phaseTimeTotal = room.settings.hideDuration;
    this.logEvent(
      room,
      `Rozpoczęto odliczanie na ukrycie się (${room.settings.hideDuration}s)! Uciekający (${hiders.length} aut) szukają kryjówek.`
    );

    this.startTimer(roomCode);
    this.broadcastState(roomCode);
    return { success: true };
  }

  startTimer(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    if (room.timer) clearInterval(room.timer);

    room.timer = setInterval(() => {
      const currentRoom = this.rooms.get(roomCode);
      if (!currentRoom) return;

      currentRoom.timeRemaining -= 1;

      if (currentRoom.state === 'HIDING' || currentRoom.state === 'HUNTING') {
        const grace = currentRoom.settings.zone.graceSeconds || 30;
        for (const p of currentRoom.players.values()) {
          if (p.isOutOfZone && p.outOfZoneSince) {
            const elapsed = Math.floor((Date.now() - p.outOfZoneSince) / 1000);
            p.outOfZoneSecondsLeft = Math.max(0, grace - elapsed);
            if (elapsed >= grace && !p.zonePenaltyActive) {
              p.zonePenaltyActive = true;
              this.logEvent(currentRoom, `[KARA ZA STREFĘ] ${p.name} (${p.role}) nie wrócił do strefy w czasie ${grace}s! Dokładna lokalizacja zostaje UJAWNIONA!`);
              this.io.to(roomCode).emit('alert', {
                type: 'ZONE_PENALTY_TRIGGERED',
                playerName: p.name,
                message: `Lokalizacja ${p.name} została odsłonięta za opuszczenie strefy!`,
              });
            }
          }
        }
      }

      if (currentRoom.state === 'HIDING' && currentRoom.timeRemaining <= 0) {
        currentRoom.state = 'HUNTING';
        currentRoom.timeRemaining = currentRoom.settings.gameDuration;
        currentRoom.phaseTimeTotal = currentRoom.settings.gameDuration;
        this.logEvent(currentRoom, `[POLOWANIE] Czas ukrywania minął! Rozpoczyna się polowanie! Szukajcie uciekinierów i skanujcie ich kody QR.`);
        this.triggerRadarPing(currentRoom, true);
        this.io.to(roomCode).emit('alert', {
          type: 'HUNT_STARTED',
          message: 'Polowanie rozpoczęte! Sprawdź radar!',
        });
      } else if (currentRoom.state === 'HUNTING') {
        const timeElapsed = currentRoom.phaseTimeTotal - currentRoom.timeRemaining;
        if (timeElapsed > 0 && timeElapsed % currentRoom.settings.pingInterval === 0) {
          this.triggerRadarPing(currentRoom, false);
        }

        if (currentRoom.settings.gameMode === 'MOVING_ZONE') {
          const mz = currentRoom.settings.movingZone;
          const shiftInterval = mz.shiftInterval || 240;

          if (currentRoom.nextZone) {
            currentRoom.nextZone.secondsLeft -= 1;
            if (currentRoom.nextZone.secondsLeft <= 0) {
              currentRoom.settings.zone.center = { ...currentRoom.nextZone.center };
              currentRoom.settings.zone.radius = currentRoom.nextZone.radius;
              currentRoom.nextZone = null;
              this.logEvent(
                currentRoom,
                `[STREFA PRZENIESIONA] Nowa strefa gry jest aktywna! Załogi poza okręgiem mają ${currentRoom.settings.zone.graceSeconds || 30}s na wjazd!`
              );
              this.io.to(roomCode).emit('alert', {
                type: 'ZONE_SHIFT_COMPLETED',
                message: 'Strefa gry została przeniesiona na nową pozycję! Uciekinierzy i Łowcy muszą być wewnątrz!',
              });
            }
          } else if (timeElapsed > 0 && timeElapsed % shiftInterval === 0) {
            const maxOffset = Math.max(250, (mz.outerRadius || 6000) - (mz.activeRadius || 1800));
            const angle = Math.random() * 2 * Math.PI;
            const dist = Math.sqrt(Math.random()) * maxOffset;
            const deltaLat = (dist * Math.cos(angle)) / 111320;
            const deltaLng = (dist * Math.sin(angle)) / (111320 * Math.cos((mz.outerCenter.lat * Math.PI) / 180));
            const newCenter = {
              lat: Number((mz.outerCenter.lat + deltaLat).toFixed(6)),
              lng: Number((mz.outerCenter.lng + deltaLng).toFixed(6)),
            };
            const warnSecs = mz.transitionDuration || 60;
            currentRoom.nextZone = {
              center: newCenter,
              radius: mz.activeRadius || 1800,
              secondsLeft: warnSecs,
              totalSeconds: warnSecs,
            };
            this.logEvent(
              currentRoom,
              `[RUCH STREFY] UWAGA! Strefa przemieszcza się! Wszystkie załogi mają ${warnSecs}s na dotarcie do nowej strefy!`
            );
            this.io.to(roomCode).emit('alert', {
              type: 'ZONE_SHIFT_STARTED',
              message: `Strefa gry przemieszcza się! Masz ${warnSecs}s na dotarcie do nowego obszaru!`,
            });
          }
        }

        if (currentRoom.timeRemaining <= 0) {
          const survivingHiders = Array.from(currentRoom.players.values()).filter(
            (p) => p.role === 'HIDER' && !p.isCaught
          );
          const survivorNames = survivingHiders.map((h) => `${h.name} (${h.carModel})`).join(', ') || 'Brak';
          this.finishGame(
            currentRoom,
            'SURVIVORS',
            `[KONIEC] Czas minął! Łowcom nie udało się znaleźć wszystkich! Wygrywają uciekinierzy: ${survivorNames}! Wszystkie kryjówki zostały odsłonięte na mapie.`
          );
          return;
        }
      }

      this.broadcastState(roomCode);
    }, 1000);
  }

  triggerRadarPing(room) {
    const uncaughtHiders = Array.from(room.players.values()).filter(
      (p) => p.role === 'HIDER' && !p.isCaught && p.position
    );
    if (uncaughtHiders.length === 0) {
      room.radarPings = [];
      return;
    }

    room.radarPings = uncaughtHiders.map((h) => {
      const fuzzed = fuzzCoordinate(h.position, room.settings.pingFuzzRadius);
      return {
        id: h.id,
        name: h.name,
        carModel: h.carModel,
        carColor: h.carColor,
        carPlate: h.carPlate,
        lat: fuzzed.lat,
        lng: fuzzed.lng,
        radius: fuzzed.radius,
        timestamp: Date.now(),
      };
    });
    room.lastPingTimestamp = Date.now();

    this.logEvent(room, `[RADAR] Sygnał Radaru! Zaktualizowano strefy uciekających (${uncaughtHiders.length} aut).`);
    this.io.to(room.code).emit('radar_ping', {
      pings: room.radarPings,
      message: 'Nowy sygnał radaru!',
    });
  }

  scanCatchCode(roomCode, seekerSocketId, rawCode) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'HUNTING') {
      return { error: 'Polowanie nie trwa!' };
    }

    const seeker = room.players.get(seekerSocketId);
    if (!seeker || seeker.role !== 'SEEKER') {
      return { error: 'Tylko Łowca może skanować kody QR!' };
    }

    const uncaughtHiders = Array.from(room.players.values()).filter(
      (p) => p.role === 'HIDER' && !p.isCaught
    );

    if (uncaughtHiders.length === 0) {
      return { error: 'Wszyscy uciekinierzy zostali już schwytani!' };
    }

    const cleanInput = (rawCode || '').trim();

    const targetHider = uncaughtHiders.find(
      (h) => h.catchToken === cleanInput || h.catchCode === cleanInput
    );

    if (!targetHider) {
      const alreadyCaught = Array.from(room.players.values()).find(
        (h) => (h.catchToken === cleanInput || h.catchCode === cleanInput) && h.isCaught
      );
      if (alreadyCaught) {
        return { error: `Samochód ${alreadyCaught.name} (${alreadyCaught.carModel}) został już wcześniej schwytany!` };
      }
      return { error: 'Niepoprawny kod QR lub PIN uciekiniera! Upewnij się, że skanujesz właściwe auto.' };
    }

    targetHider.isCaught = true;
    targetHider.caughtBy = seeker.name;

    room.radarPings = room.radarPings.filter((ping) => ping.id !== targetHider.id);

    const remainingHiders = Array.from(room.players.values()).filter(
      (p) => p.role === 'HIDER' && !p.isCaught
    );

    this.logEvent(
      room,
      `[SKAN] ${seeker.name} (${this.formatCarDescription(seeker)}) ZESKANOWAŁ KOD QR uciekiniera ${targetHider.name} (${this.formatCarDescription(targetHider)})! Pozostało uciekających: ${remainingHiders.length}.`
    );

    this.io.to(room.code).emit('alert', {
      type: 'HIDER_CAUGHT',
      message: `[SKAN] ${seeker.name} zeskanował kod ${targetHider.name} (${targetHider.carModel})! Zostało uciekających: ${remainingHiders.length}`,
    });

    if (remainingHiders.length === 0) {
      this.finishGame(
        room,
        'SEEKERS',
        `[ZWYCIĘSTWO] Wszyscy uciekinierzy zostali schwytani (kody QR zeskanowane)! Załogi Łowców wygrywają!`
      );
    } else {
      this.broadcastState(room.code);
    }

    return {
      success: true,
      caughtName: targetHider.name,
      carModel: targetHider.carModel,
      carColor: targetHider.carColor,
      carPlate: targetHider.carPlate,
      remaining: remainingHiders.length,
    };
  }

  attemptCatch(roomCode, seekerSocketId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'HUNTING') {
      return { error: 'Polowanie nie trwa!' };
    }

    const seeker = room.players.get(seekerSocketId);
    if (!seeker || seeker.role !== 'SEEKER') {
      return { error: 'Tylko Łowca może zgłosić złapanie!' };
    }

    if (!seeker.position) {
      return { error: 'Brak Twojej pozycji GPS!' };
    }

    const uncaughtHiders = Array.from(room.players.values()).filter(
      (p) => p.role === 'HIDER' && !p.isCaught
    );

    if (uncaughtHiders.length === 0) {
      return { error: 'Wszyscy uciekinierzy zostali już schwytani!' };
    }

    const maxCatchDist = room.settings.catchDistance || 50;
    let closestDist = Infinity;
    let closestHider = null;

    for (const hider of uncaughtHiders) {
      if (hider.position) {
        const d = Math.round(getDistanceMeters(seeker.position, hider.position));
        if (d < closestDist) {
          closestDist = d;
          closestHider = hider;
        }
      }
    }

    if (closestDist <= maxCatchDist) {
      return {
        inRange: true,
        distance: closestDist,
        targetName: closestHider?.name,
        carModel: closestHider?.carModel,
        carColor: closestHider?.carColor,
        carPlate: closestHider?.carPlate,
        message: `Jesteś w odległości ${closestDist}m od ${closestHider?.name} (${closestHider?.carModel || 'Auto'}${closestHider?.carPlate ? ` [${closestHider.carPlate}]` : ''})! Zeskanuj kod QR za szybą, aby potwierdzić schwytanie!`,
      };
    }

    return {
      inRange: false,
      distance: closestDist,
      error: closestDist === Infinity
        ? 'Brak sygnału GPS celów!'
        : `Jesteś za daleko od najbliższego auta (${closestDist}m, zbliż się na < ${maxCatchDist}m i zeskanuj QR)!`,
    };
  }

  finishGame(room, winner, reason) {
    if (room.timer) clearInterval(room.timer);
    room.state = 'FINISHED';
    room.winner = winner;
    this.logEvent(room, reason);

    this.io.to(room.code).emit('game_over', {
      winner,
      reason,
    });
    this.broadcastState(room.code);
  }

  resetToLobby(roomCode, hostSocketId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.hostId !== hostSocketId) return;

    if (room.timer) clearInterval(room.timer);
    room.state = 'LOBBY';
    room.winner = null;
    room.timeRemaining = 0;
    room.radarPings = [];
    for (const p of room.players.values()) {
      p.isCaught = false;
      p.caughtBy = null;
      p.isOutOfZone = false;
      p.outOfZoneSince = null;
      p.outOfZoneSecondsLeft = 0;
      p.zonePenaltyActive = false;
      p.distToZoneEdge = 0;
      p.catchCode = generateCatchCode();
      p.catchToken = `CARHUNT:${roomCode}:${p.id}:${p.catchCode}`;
    }
    this.logEvent(room, `Gra zresetowana. Powrót do poczekalni (wygenerowano nowe kody QR).`);
    this.broadcastState(roomCode);
  }

  logEvent(room, text) {
    room.events.push({
      id: Date.now() + Math.random().toString(),
      time: new Date().toLocaleTimeString('pl-PL'),
      text,
    });
    if (room.events.length > 30) room.events.shift();
  }

  getPublicRoomState(room, recipientSocketId) {
    const recipient = room.players.get(recipientSocketId);
    const isRecipientHider = recipient?.role === 'HIDER';
    const isGameOver = room.state === 'FINISHED';
    const isRecipientCaught = recipient?.isCaught;

    const allHiders = Array.from(room.players.values()).filter((p) => p.role === 'HIDER');
    const remainingHidersCount = allHiders.filter((p) => !p.isCaught).length;
    const caughtHidersCount = allHiders.filter((p) => p.isCaught).length;

    const playersList = Array.from(room.players.values()).map((p) => {
      let visiblePosition = null;

      if (p.id === recipientSocketId) {
        visiblePosition = p.position;
      } else if (p.role === 'SEEKER') {
        visiblePosition = p.position;
      } else if (p.role === 'HIDER') {
        if (isGameOver || p.isCaught || isRecipientCaught) {
          visiblePosition = p.position;
        } else if (isRecipientHider && p.id === recipientSocketId) {
          visiblePosition = p.position;
        } else if (p.zonePenaltyActive) {
          visiblePosition = p.position;
        } else {
          visiblePosition = null;
        }
      }

      const canSeeSecretCode = (p.id === recipientSocketId) || isGameOver;

      return {
        id: p.id,
        playerId: p.playerId,
        isOnline: p.isOnline !== false,
        name: p.name,
        carModel: p.carModel,
        carColor: p.carColor,
        carPlate: p.carPlate,
        role: p.role,
        isHost: p.isHost,
        isCaught: p.isCaught,
        caughtBy: p.caughtBy,
        isOutOfZone: p.isOutOfZone || false,
        outOfZoneSecondsLeft: p.outOfZoneSecondsLeft || 0,
        zonePenaltyActive: p.zonePenaltyActive || false,
        distToZoneEdge: p.distToZoneEdge || 0,
        position: visiblePosition,
        catchCode: canSeeSecretCode ? p.catchCode : null,
        catchToken: canSeeSecretCode ? p.catchToken : null,
      };
    });

    return {
      code: room.code,
      state: room.state,
      settings: room.settings,
      nextZone: room.nextZone || null,
      timeRemaining: room.timeRemaining,
      phaseTimeTotal: room.phaseTimeTotal,
      winner: room.winner,
      radarPings: room.radarPings || [],
      hidersStats: {
        total: allHiders.length,
        remaining: remainingHidersCount,
        caught: caughtHidersCount,
      },
      events: room.events,
      players: playersList,
      myPlayer: recipient ? {
        id: recipient.id,
        playerId: recipient.playerId,
        isOnline: recipient.isOnline !== false,
        name: recipient.name,
        carModel: recipient.carModel,
        carColor: recipient.carColor,
        carPlate: recipient.carPlate,
        role: recipient.role,
        isHost: recipient.isHost,
        isCaught: recipient.isCaught,
        caughtBy: recipient.caughtBy,
        isOutOfZone: recipient.isOutOfZone || false,
        outOfZoneSecondsLeft: recipient.outOfZoneSecondsLeft || 0,
        zonePenaltyActive: recipient.zonePenaltyActive || false,
        distToZoneEdge: recipient.distToZoneEdge || 0,
        catchCode: recipient.catchCode,
        catchToken: recipient.catchToken,
      } : null,
    };
  }

  broadcastState(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    for (const socketId of room.players.keys()) {
      const state = this.getPublicRoomState(room, socketId);
      this.io.to(socketId).emit('room_state', state);
    }
  }
}
