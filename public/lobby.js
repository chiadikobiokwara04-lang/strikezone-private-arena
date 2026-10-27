(() => {
  const socket = io();
  const nameInput = document.getElementById('playerName');
  const codeInput = document.getElementById('roomCode');
  const message = document.getElementById('lobbyMessage');
  const createBtn = document.getElementById('createBtn');
  const joinBtn = document.getElementById('joinBtn');
  function show(text, error = false) { message.textContent = text; message.classList.toggle('error', error); }
  function playerName() { return nameInput.value.trim().slice(0, 18) || 'Operator'; }
  createBtn.addEventListener('click', () => { createBtn.disabled = true; show('Creating your private arena…'); socket.emit('createRoom', { name: playerName() }); });
  joinBtn.addEventListener('click', () => { const code = codeInput.value.trim().toUpperCase(); if (code.length !== 4) return show('Enter the 4-character room code.', true); joinBtn.disabled = true; show('Connecting to your squad…'); socket.emit('joinRoom', { code, name: playerName() }); });
  codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); });
  socket.on('joinedRoom', ({ code }) => { sessionStorage.setItem('strikezoneName', playerName()); window.location.href = `/arena.html?room=${encodeURIComponent(code)}`; });
  socket.on('gameError', text => { show(text, true); createBtn.disabled = false; joinBtn.disabled = false; });
  socket.on('connect_error', () => { show('Could not connect to the game server. Refresh and try again.', true); createBtn.disabled = false; joinBtn.disabled = false; });
  socket.on('disconnect', () => { createBtn.disabled = false; joinBtn.disabled = false; });
})();
