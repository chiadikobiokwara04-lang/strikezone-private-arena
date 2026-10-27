const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const rooms = new Map();
const MAX_PLAYERS = 8;
const MATCH_MS = 5 * 60 * 1000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.json({ ok: true, game: 'StrikeZone: Private Arena' }));

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(''); }
  while (rooms.has(code));
  return code;
}
function publicRoom(room) {
  return {
    code: room.code,
    status: room.status,
    endsAt: room.endsAt,
    players: [...room.players.values()].map(p => ({ id: p.id, name: p.name, team: p.team, health: p.health, score: p.score, kills: p.kills, deaths: p.deaths, x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch })),
    red: [...room.players.values()].filter(p => p.team === 'RED').length,
    blue: [...room.players.values()].filter(p => p.team === 'BLUE').length
  };
}
function broadcastRoom(room) { io.to(room.code).emit('roomState', publicRoom(room)); }
function assignTeam(room) {
  const red = [...room.players.values()].filter(p => p.team === 'RED').length;
  const blue = [...room.players.values()].filter(p => p.team === 'BLUE').length;
  return red <= blue ? 'RED' : 'BLUE';
}
function stopMatch(room) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
  room.status = 'finished';
  broadcastRoom(room);
  io.to(room.code).emit('matchEnded', publicRoom(room));
}
function addPlayer(socket, room, name) {
  if (room.cleanupTimer) { clearTimeout(room.cleanupTimer); room.cleanupTimer = null; }
  if (room.players.size === 0) room.hostId = socket.id;
  const cleanName = String(name || 'Player').trim().replace(/[<>]/g, '').slice(0, 18) || 'Player';
  const team = assignTeam(room);
  const spawnX = team === 'RED' ? -5 : 5;
  room.players.set(socket.id, { id: socket.id, name: cleanName, team, health: 100, score: 0, kills: 0, deaths: 0, x: spawnX, y: 1.7, z: 5, yaw: team === 'RED' ? 0 : Math.PI, pitch: 0, lastHitAt: 0, lastShotAt: 0 });
  socket.join(room.code);
  socket.data.roomCode = room.code;
  socket.emit('joinedRoom', { code: room.code, playerId: socket.id, team, state: publicRoom(room) });
  broadcastRoom(room);
}
function resetPlayer(p) {
  p.health = 100;
  p.x = p.team === 'RED' ? -5 : 5;
  p.y = 1.7;
  p.z = 5;
  p.yaw = p.team === 'RED' ? 0 : Math.PI;
  p.pitch = 0;
}

io.on('connection', socket => {
  socket.on('createRoom', ({ name } = {}) => {
    if (socket.data.roomCode) return socket.emit('gameError', 'Leave your current room before creating another.');
    const code = makeCode();
    const room = { code, hostId: socket.id, players: new Map(), status: 'waiting', endsAt: null, timer: null, cleanupTimer: null };
    rooms.set(code, room);
    addPlayer(socket, room, name);
  });

  socket.on('joinRoom', ({ code, name } = {}) => {
    if (socket.data.roomCode) return socket.emit('gameError', 'You are already in a room. Refresh to leave it.');
    const roomCode = String(code || '').trim().toUpperCase();
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('gameError', 'Room not found. Check the code and try again.');
    if (room.players.size >= MAX_PLAYERS) return socket.emit('gameError', 'This room is full (8/8 players).');
    if (room.status !== 'waiting') return socket.emit('gameError', 'This match has already started. Join another room.');
    addPlayer(socket, room, name);
  });

  socket.on('startMatch', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    if (room.hostId !== socket.id) return socket.emit('gameError', 'Only the room creator can start the match.');
    if (room.players.size < 2) return socket.emit('gameError', 'Invite at least one other player before starting.');
    if (room.status !== 'waiting') return;
    room.status = 'playing';
    room.endsAt = Date.now() + MATCH_MS;
    for (const p of room.players.values()) resetPlayer(p);
    room.timer = setTimeout(() => stopMatch(room), MATCH_MS);
    io.to(room.code).emit('matchStarted', { endsAt: room.endsAt });
    broadcastRoom(room);
  });

  socket.on('playerMove', data => {
    const room = rooms.get(socket.data.roomCode);
    const p = room && room.players.get(socket.id);
    if (!p || room.status !== 'playing' || !data) return;
    for (const key of ['x', 'y', 'z', 'yaw', 'pitch']) {
      if (Number.isFinite(data[key])) p[key] = Math.max(-10000, Math.min(10000, data[key]));
    }
    socket.to(room.code).emit('playerMoved', { id: p.id, x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch });
  });

  socket.on('hitPlayer', ({ targetId, weapon } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== 'playing') return;
    const shooter = room.players.get(socket.id);
    const target = room.players.get(targetId);
    if (!shooter || !target || shooter.id === target.id || shooter.team === target.team) return;
    const now = Date.now();
    const weaponRules = {
      ak47: { damage: 34, cooldown: 220 },
      m4: { damage: 28, cooldown: 150 },
      smg: { damage: 19, cooldown: 85 },
      sniper: { damage: 70, cooldown: 650 }
    };
    const rule = weaponRules[weapon] || weaponRules.ak47;
    // Basic server-side guardrails: reject impossible long-range hits and excessive fire rates.
    const distance = Math.hypot(shooter.x - target.x, shooter.z - target.z);
    if (distance > 55 || now - shooter.lastHitAt < rule.cooldown) return;
    shooter.lastHitAt = now;
    const weaponDamage = rule.damage;
    target.health = Math.max(0, target.health - weaponDamage);
    io.to(room.code).emit('hitConfirmed', { shooterId: shooter.id, targetId: target.id, health: target.health });
    if (target.health <= 0) {
      shooter.score += 100;
      shooter.kills += 1;
      target.deaths += 1;
      resetPlayer(target);
      io.to(room.code).emit('playerRespawned', { id: target.id, team: target.team, x: target.x, y: target.y, z: target.z, yaw: target.yaw, pitch: target.pitch, health: target.health, by: shooter.name });
    }
    broadcastRoom(room);
  });

  socket.on('leaveRoom', () => removePlayer(socket));
  socket.on('disconnect', () => removePlayer(socket));
  function removePlayer(s) {
    const code = s.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    s.data.roomCode = null;
    if (!room) return;
    room.players.delete(s.id);
    s.leave(code);
    if (room.players.size === 0) {
      if (room.timer) clearTimeout(room.timer);
      // Keep a newly created room briefly while its creator's browser navigates to the arena.
      room.cleanupTimer = setTimeout(() => { if (room.players.size === 0) rooms.delete(code); }, 120000);
      return;
    }
    if (room.hostId === s.id) room.hostId = room.players.keys().next().value;
    // Rebalance teams after a player leaves.
    const players = [...room.players.values()];
    players.sort((a, b) => (a.team === 'RED' ? 1 : 0) - (b.team === 'RED' ? 1 : 0));
    let red = 0, blue = 0;
    for (const p of players) { p.team = red <= blue ? 'RED' : 'BLUE'; if (p.team === 'RED') red++; else blue++; }
    broadcastRoom(room);
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`StrikeZone running on port ${PORT}`));
