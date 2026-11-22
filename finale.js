// Love-msg — PHASE 5: THE FINAL SURPRISE.
// Cinematic transition, final message, question, star fireworks.
(function () {
  var canvas = document.getElementById("finaleCanvas");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var msg = document.getElementById("finaleMsg");
  var line2 = document.getElementById("finaleLine2");
  var question = document.getElementById("finaleQuestion");
  var celebration = document.getElementById("finaleCelebration");
  var raf = 0;
  var running = false;
  var rockets = [];
  var sparks = [];
  var gather = [];
  var phase = "gather"; // gather -> message -> question -> celebrate
  var w = 0, h = 0;

  function resize() {
    var stage = document.getElementById("finaleScreen");
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = stage.clientWidth; h = stage.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    if (phase === "gather") {
      gather.forEach(function (s) {
        var dx = w / 2 - s.x, dy = h / 2 - s.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        s.x += (dx / d) * 2.2; s.y += (dy / d) * 2.2;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (phase === "celebrate") {
      if (Math.random() < 0.06) {
        rockets.push({ x: Math.random() * w * 0.8 + w * 0.1, y: h, vy: -(6 + Math.random() * 3), hue: Math.random() < 0.5 ? "167,139,250" : "96,165,250" });
      }
      rockets = rockets.filter(function (r) { return r.y > h * 0.25; });
      rockets.forEach(function (r) {
        r.y += r.vy;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, Math.PI * 2); ctx.fill();
        if (r.y <= h * 0.25) burst(r.x, r.y, r.hue);
      });
      sparks = sparks.filter(function (s) { return s.life > 0; });
      sparks.forEach(function (s) {
        s.x += s.vx; s.y += s.vy; s.vy += 0.03; s.life -= 0.012;
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = "rgba(" + s.hue + ",1)";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // Heart-shaped galaxy: pulsing heart of tiny stars.
      var pulse = 1 + Math.sin(Date.now() / 500) * 0.08;
      ctx.save();
      ctx.translate(w / 2, h * 0.3);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "rgba(233,30,99,0.85)";
      ctx.font = "90px serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "#e91e63"; ctx.shadowBlur = 40;
      ctx.fillText("❤️", 0, 30);
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  function burst(x, y, hue) {
    for (var i = 0; i < 42; i++) {
      var a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      sparks.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * 2 + 0.8, life: 1, hue: hue });
    }
  }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  window.startFinale = function () {
    window.showCosmicScreen("finaleScreen");
    resize(); // after showing: a hidden screen measures 0px wide
    phase = "gather";
    gather = [];
    for (var i = 0; i < 160; i++) {
      gather.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.4 });
    }
    hide(line2); hide(question); hide(celebration);
    show(msg);
    if (!running) { running = true; raf = requestAnimationFrame(frame); }
    setTimeout(function () { show(line2); line2.classList.add("fade-in"); }, 2200);
    setTimeout(function () {
      phase = "message";
      hide(msg);
      show(question);
      question.classList.add("fade-in");
    }, 5200);
  };
  function celebrate() {
    phase = "celebrate";
    hide(question);
    show(celebration);
    celebration.classList.add("fade-in");
    if (window.__cosmic) window.__cosmic.chime();
  }
  var yesBtn = document.getElementById("yesForeverBtn");
  if (yesBtn) yesBtn.addEventListener("click", celebrate);
  var alwaysBtn = document.getElementById("alwaysBtn");
  if (alwaysBtn) alwaysBtn.addEventListener("click", celebrate);
  window.addEventListener("resize", function () {
    if (!document.getElementById("finaleScreen").hidden) resize();
  });
})();
