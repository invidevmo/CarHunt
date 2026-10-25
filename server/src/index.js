import express from 'express';
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GameManager } from './gameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

const pfxPath = path.resolve(__dirname, '../cert.pfx');
let httpsServer = null;

if (fs.existsSync(pfxPath)) {
  try {
    httpsServer = https.createServer(
      {
        pfx: fs.readFileSync(pfxPath),
        passphrase: 'carhunt',
      },
      app
    );
  } catch (e) {
    console.error('Failed to initialize HTTPS with cert.pfx:', e.message);
  }
}

app.use(cors());
app.use(express.json());

const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.attach(httpServer);
if (httpsServer) {
  io.attach(httpsServer);
}

const gameManager = new GameManager(io);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    roomsCount: gameManager.rooms.size,
    timestamp: new Date().toISOString(),
  });
});

const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('create_room', ({ playerName, carModel, carColor, carPlate, playerId }, callback) => {
    try {
      const room = gameManager.createRoom(socket.id, playerName, { carModel, carColor, carPlate }, playerId);
      socket.join(room.code);
      const state = gameManager.getPublicRoomState(room, socket.id);
      if (typeof callback === 'function') callback({ success: true, roomCode: room.code });
      socket.emit('room_state', state);
    } catch (err) {
      console.error('Error creating room:', err);
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  socket.on('join_room', ({ roomCode, playerName, carModel, carColor, carPlate, playerId }, callback) => {
    try {
      const result = gameManager.joinRoom(roomCode, socket.id, playerName, { carModel, carColor, carPlate }, playerId);
      if (result.error) {
        if (typeof callback === 'function') callback({ error: result.error });
        return;
      }
      socket.join(roomCode);
      if (typeof callback === 'function') callback({ success: true, roomCode });
    } catch (err) {
      console.error('Error joining room:', err);
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  socket.on('reconnect_session', ({ roomCode, playerId }, callback) => {
    try {
      const result = gameManager.reconnectPlayer(roomCode, socket.id, playerId);
      if (result.error) {
        if (typeof callback === 'function') callback({ error: result.error });
        return;
      }
      socket.join(roomCode);
      if (typeof callback === 'function') callback({ success: true, room: result.room });
    } catch (err) {
      console.error('Error reconnecting player:', err);
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  socket.on('leave_room', ({ roomCode }, callback) => {
    try {
      gameManager.explicitLeaveRoom(socket.id);
      socket.leave(roomCode);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  socket.on('update_profile', ({ roomCode, playerName, carModel, carColor, carPlate }) => {
    gameManager.updatePlayerProfile(roomCode, socket.id, { playerName, carModel, carColor, carPlate });
  });

  socket.on('set_role', ({ roomCode, targetSocketId, role }) => {
    gameManager.setPlayerRole(roomCode, socket.id, targetSocketId || socket.id, role);
  });

  socket.on('randomize_teams', ({ roomCode, mode }) => {
    gameManager.randomizeTeams(roomCode, socket.id, mode);
  });

  socket.on('update_settings', ({ roomCode, settings }) => {
    gameManager.updateSettings(roomCode, socket.id, settings);
  });

  socket.on('set_zone', ({ roomCode, gameMode, center, radius, graceSeconds, movingZone }) => {
    gameManager.setZone(roomCode, socket.id, { gameMode, center, radius, graceSeconds, movingZone });
  });

  socket.on('update_position', (coords) => {
    gameManager.updatePosition(socket.id, coords);
  });

  socket.on('start_game', ({ roomCode }, callback) => {
    const res = gameManager.startGame(roomCode, socket.id);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('attempt_catch', ({ roomCode }, callback) => {
    const res = gameManager.attemptCatch(roomCode, socket.id);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('scan_catch_code', ({ roomCode, code }, callback) => {
    const res = gameManager.scanCatchCode(roomCode, socket.id, code);
    if (typeof callback === 'function') callback(res);
  });

  socket.on('reset_to_lobby', ({ roomCode }) => {
    gameManager.resetToLobby(roomCode, socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    gameManager.leaveRoom(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[HTTP] Server running at http://localhost:${PORT}`);
});

if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`[HTTPS] Server running at https://localhost:${HTTPS_PORT}`);
  });
}
