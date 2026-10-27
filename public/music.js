/* StrikeZone original procedural cinematic ambience. No external audio assets required. */
(() => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-toggle';
  button.setAttribute('aria-label', 'Turn background music on');
  button.innerHTML = '<span class="music-icon" aria-hidden="true">♫</span><span class="music-label">MUSIC OFF</span><span class="music-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
  document.body.appendChild(button);

  let ctx = null, master = null, running = false, timer = null, step = 0;
  let voices = [];
  const enabledInitially = localStorage.getItem('strikezoneMusic') === 'on';
  const notes = [55, 65.41, 73.42, 82.41, 65.41, 49, 58.27, 73.42];

  function tone(freq, start, duration, type, volume, detune = 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.detune.value = detune;
    filter.type = 'lowpass'; filter.frequency.value = type === 'triangle' ? 750 : 420;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(1.4, duration * .4));
    gain.gain.setTargetAtTime(0.0001, start + duration * .62, duration * .22);
    osc.connect(filter); filter.connect(gain); gain.connect(master);
    osc.start(start); osc.stop(start + duration + .2);
    voices.push(osc);
  }
  function playPhrase() {
    if (!running || !ctx) return;
    const now = ctx.currentTime + .08;
    const root = notes[step % notes.length];
    tone(root, now, 4.8, 'sine', .11);
    tone(root * 1.5, now + .18, 3.7, 'triangle', .035, 3);
    if (step % 2 === 0) tone(root * 2.01, now + .5, 2.8, 'sine', .018, -4);
    // Soft low-frequency pulse gives the score a restrained tactical heartbeat.
    tone(38 + (step % 3) * 3, now + .03, .85, 'triangle', .075);
    step++;
    timer = window.setTimeout(playPhrase, 3100);
  }
  function paint() {
    button.classList.toggle('is-playing', running);
    button.querySelector('.music-label').textContent = running ? 'MUSIC ON' : 'MUSIC OFF';
    button.setAttribute('aria-label', running ? 'Turn background music off' : 'Turn background music on');
  }
  async function start() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) { button.querySelector('.music-label').textContent = 'AUDIO N/A'; return; }
      if (!ctx) {
        ctx = new AudioContext();
        master = ctx.createGain(); master.gain.value = .26; master.connect(ctx.destination);
      }
      await ctx.resume();
      running = true; localStorage.setItem('strikezoneMusic', 'on'); paint(); playPhrase();
    } catch (e) { running = false; paint(); }
  }
  function stop() {
    running = false; localStorage.setItem('strikezoneMusic', 'off');
    if (timer) clearTimeout(timer); timer = null;
    if (master && ctx) master.gain.setTargetAtTime(.0001, ctx.currentTime, .12);
    window.setTimeout(() => { if (!running && master && ctx) master.gain.setValueAtTime(.26, ctx.currentTime); }, 500);
    paint();
  }
  button.addEventListener('click', () => running ? stop() : start());
  // Browser autoplay rules require a gesture; remembered preference starts on first interaction.
  if (enabledInitially) {
    const resumeOnGesture = () => { if (!running) start(); window.removeEventListener('pointerdown', resumeOnGesture); window.removeEventListener('keydown', resumeOnGesture); };
    window.addEventListener('pointerdown', resumeOnGesture, { once: true });
    window.addEventListener('keydown', resumeOnGesture, { once: true });
  }
  paint();
})();
