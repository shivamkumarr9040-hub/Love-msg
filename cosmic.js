// Love-msg — PHASE 1: ENTER THE UNIVERSE (cosmic romance).
// Runs only after login. Authentication lives in app.js and is untouched.
// Music is a soft ambient pad made with WebAudio — no audio files,
// no new dependencies. It starts only after the user taps ENTER.
(function () {
  var stage = document.getElementById("welcomeStage");
  var canvas = document.getElementById("starCanvas");
  var line1 = document.getElementById("cosmicLine1");
  var line2 = document.getElementById("cosmicLine2");
  var line3 = document.getElementById("cosmicLine3");
  var enterBtn = document.getElementById("enterUniverseBtn");
  var welcome = document.getElementById("cosmicWelcome");
  var inside = document.getElementById("cosmicInside");
  var musicBtn = document.getElementById("musicBtn");

  var ctx = canvas ? canvas.getContext("2d") : null;
  var stars = [];
  var particles = [];
  var shooters = [];
  var raf = 0;
  var running = false;
  var timers = [];
  var px = 0, py = 0; // parallax offset (-1..1)
  var w = 0, h = 0;

  var MUSIC_KEY = "love-msg-music"; // "on" or "off"
  var audioCtx = null, padGain = null, musicOn = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = stage.clientWidth; h = stage.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildSky();
  }
  function buildSky() {
    stars = [];
    var count = Math.min(260, Math.floor((w * h) / 4500));
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        depth: Math.random() * 0.8 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
      });
    }
    particles = [];
    for (var j = 0; j < 26; j++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 2.2 + 1,
        depth: Math.random() * 0.5 + 0.2,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.05 - Math.random() * 0.12,
        hue: Math.random() < 0.5 ? "167,139,250" : "96,165,250",
      });
    }
  }
  function spawnShooter() {
    shooters.push({
      x: Math.random() * w * 0.7 + w * 0.15,
      y: Math.random() * h * 0.3,
      vx: -(5 + Math.random() * 4),
      vy: 2.5 + Math.random() * 2,
      life: 1,
    });
  }
  function frame(t) {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    var time = t / 1000;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.35 + 0.65 * Math.abs(Math.sin(time * s.speed + s.phase));
      var ox = px * 14 * s.depth, oy = py * 10 * s.depth;
      ctx.globalAlpha = tw;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (var j = 0; j < particles.length; j++) {
      var pt = particles[j];
      pt.x += pt.vx; pt.y += pt.vy;
      if (pt.y < -10) { pt.y = h + 10; pt.x = Math.random() * w; }
      if (pt.x < -10) pt.x = w + 10;
      if (pt.x > w + 10) pt.x = -10;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "rgba(" + pt.hue + ",0.8)";
      ctx.beginPath();
      ctx.arc(pt.x + px * 20 * pt.depth, pt.y + py * 14 * pt.depth, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (Math.random() < 0.004) spawnShooter();
    shooters = shooters.filter(function (sh) { return sh.life > 0; });
    for (var k = 0; k < shooters.length; k++) {
      var s2 = shooters[k];
      s2.x += s2.vx; s2.y += s2.vy; s2.life -= 0.02;
      var grad = ctx.createLinearGradient(s2.x, s2.y, s2.x - s2.vx * 8, s2.y - s2.vy * 8);
      grad.addColorStop(0, "rgba(255,255,255," + Math.max(0, s2.life) + ")");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s2.x, s2.y);
      ctx.lineTo(s2.x - s2.vx * 8, s2.y - s2.vy * 8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  // ---- Ambient music (WebAudio pad, no files) ----
  function buildPad() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      padGain = audioCtx.createGain();
      padGain.gain.value = 0;
      var filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 900;
      padGain.connect(filter); filter.connect(audioCtx.destination);
      var freqs = [110, 164.81, 220, 277.18];
      freqs.forEach(function (f, idx) {
        var osc = audioCtx.createOscillator();
        osc.type = idx % 2 ? "sine" : "triangle";
        osc.frequency.value = f;
        osc.detune.value = (idx - 1.5) * 4;
        var g = audioCtx.createGain();
        g.gain.value = 0.05;
        osc.connect(g); g.connect(padGain);
        osc.start();
      });
      var lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.07;
      var lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain); lfoGain.connect(padGain.gain);
      lfo.start();
    } catch (e) { audioCtx = null; }
  }
  function setMusic(on) {
    musicOn = on;
    try { localStorage.setItem(MUSIC_KEY, on ? "on" : "off"); } catch (e) {}
    var label = on ? "🔊" : "🔇";
    if (musicBtn) musicBtn.textContent = label;
    ["galaxyMusicBtn", "lettersMusicBtn"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.textContent = label;
    });
    if (!on || !audioCtx || !padGain) {
      if (padGain) padGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
      return;
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    padGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 2);
  }
  if (musicBtn) {
    musicBtn.addEventListener("click", function () {
      if (!musicOn) buildPad();
      setMusic(!musicOn);
    });
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function startSequence() {
    hide(line2); hide(line3); hide(enterBtn);
    hide(inside); show(welcome);
    show(line1);
    line1.classList.remove("fade-in"); void line1.offsetWidth; line1.classList.add("fade-in");
    later(function () { show(line2); line2.classList.add("fade-in"); }, 2000);
    later(function () { show(line3); line3.classList.add("fade-in"); }, 3600);
    later(function () { show(enterBtn); enterBtn.classList.add("fade-in"); }, 4400);
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", function () {
      hide(welcome);
      show(inside);
      inside.classList.add("fade-in");
      // Music starts only after this tap, and only if the user left it on.
      var pref = "on";
      try { pref = localStorage.getItem(MUSIC_KEY) || "on"; } catch (e) {}
      if (pref !== "off") { buildPad(); setMusic(true); }
      else setMusic(false);
    });
  }

  window.addEventListener("resize", function () { if (running) resize(); });
  document.addEventListener("visibilitychange", function () {
    if (!running) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });
  window.addEventListener("pointermove", function (e) {
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Shared API for Phase 2-5 screens: music toggle + a soft chime sound.
  var SOUND_KEY = "love-msg-sound"; // "on" or "off"
  function soundOn() {
    try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch (e) { return true; }
  }
  window.__cosmic = {
    isMusicOn: function () { return musicOn; },
    toggleMusic: function () {
      if (!musicOn) buildPad();
      setMusic(!musicOn);
      return musicOn;
    },
    setMusicLabel: function (btn) { if (btn) btn.textContent = musicOn ? "🔊" : "🔇"; },
    soundOn: soundOn,
    toggleSound: function () {
      var next = !soundOn();
      try { localStorage.setItem(SOUND_KEY, next ? "on" : "off"); } catch (e) {}
      return next;
    },
    chime: function () {
      if (!soundOn()) return;
      try {
        buildPad();
        if (!audioCtx) return;
        if (audioCtx.state === "suspended") audioCtx.resume();
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = "sine"; osc.frequency.value = 880;
        g.gain.setValueAtTime(0.12, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);
      } catch (e) {}
    },
  };

  window.startCosmic = function () {
    if (!stage || !canvas) return;
    resize();
    startSequence();
    if (!running) {
      running = true;
      raf = requestAnimationFrame(frame);
    }
    try {
      var pref = localStorage.getItem(MUSIC_KEY) || "on";
      if (musicBtn) musicBtn.textContent = pref === "off" ? "🔇" : "🔇";
    } catch (e) {}
  };
  window.stopCosmic = function () {
    running = false;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    timers = [];
    if (musicOn) setMusic(false);
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; padGain = null; }
  };
})();
