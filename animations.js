// Love-msg — premium romantic animations (additive layer).
// Creates only animation elements (hearts, petals, sparkles, bursts).
// Never changes content, layout, backgrounds, or any existing behaviour.
(function () {
  var REDUCED = false;
  try {
    REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}
  var HEART_COLORS = ["#ff4d6d", "#f472b6", "#e9d5ff", "#ff8fab"];

  /* ---------- 1. Floating pink hearts ---------- */
  function makeHearts(container, count) {
    if (!container || REDUCED) return;
    var layer = document.createElement("div");
    layer.className = "fx-hearts";
    layer.setAttribute("aria-hidden", "true");
    for (var i = 0; i < count; i++) {
      var h = document.createElement("span");
      h.className = "fx-heart";
      h.textContent = "\u2764";
      h.style.left = (Math.random() * 96) + "%";
      h.style.fontSize = (12 + Math.random() * 16) + "px";
      h.style.color = HEART_COLORS[i % HEART_COLORS.length];
      h.style.animationDuration = (14 + Math.random() * 10) + "s";
      h.style.animationDelay = (-Math.random() * 22) + "s";
      h.style.opacity = (0.25 + Math.random() * 0.3).toFixed(2);
      layer.appendChild(h);
    }
    container.appendChild(layer);
  }

  /* ---------- 4. Falling rose petals (light canvas) ---------- */
  var petalCanvas = null, petalCtx = null, petals = [], petalW = 0, petalH = 0;
  var PETAL_COLORS = ["255,183,197", "244,114,182", "249,168,212", "216,180,254"];
  function newPetal(anywhere) {
    return {
      x: Math.random() * petalW,
      y: anywhere ? Math.random() * petalH : -14,
      size: 5 + Math.random() * 7,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      vy: 0.3 + Math.random() * 0.5,
      sway: 0.4 + Math.random() * 0.8,
      swaySpeed: 0.008 + Math.random() * 0.012,
      phase: Math.random() * Math.PI * 2,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      alpha: 0.5 + Math.random() * 0.3
    };
  }
  function sizePetals() {
    var stage = document.getElementById("welcomeStage");
    if (!stage || !petalCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    petalW = stage.clientWidth; petalH = stage.clientHeight;
    petalCanvas.width = petalW * dpr;
    petalCanvas.height = petalH * dpr;
    petalCanvas.style.width = petalW + "px";
    petalCanvas.style.height = petalH + "px";
    if (petalCtx) petalCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function petalFrame() {
    requestAnimationFrame(petalFrame);
    var stage = document.getElementById("welcomeStage");
    if (!petalCtx || !stage || stage.hidden || document.hidden) return;
    petalCtx.clearRect(0, 0, petalW, petalH);
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.phase += p.swaySpeed;
      p.y += p.vy;
      p.x += Math.sin(p.phase) * p.sway * 0.4;
      p.angle += p.spin;
      if (p.y > petalH + 16) { petals[i] = newPetal(false); continue; }
      if (p.x < -16) p.x = petalW + 14;
      if (p.x > petalW + 16) p.x = -14;
      petalCtx.save();
      petalCtx.translate(p.x, p.y);
      petalCtx.rotate(p.angle);
      petalCtx.globalAlpha = p.alpha;
      petalCtx.fillStyle = "rgba(" + p.color + ",1)";
      petalCtx.beginPath();
      petalCtx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      petalCtx.fill();
      petalCtx.restore();
    }
    petalCtx.globalAlpha = 1;
  }
  function initPetals() {
    var stage = document.getElementById("welcomeStage");
    if (!stage || REDUCED) return;
    petalCanvas = document.createElement("canvas");
    petalCanvas.className = "fx-petals";
    petalCanvas.setAttribute("aria-hidden", "true");
    stage.appendChild(petalCanvas);
    petalCtx = petalCanvas.getContext("2d");
    sizePetals();
    for (var i = 0; i < 14; i++) petals.push(newPetal(true));
    window.addEventListener("resize", sizePetals);
    requestAnimationFrame(petalFrame);
  }

  /* ---------- 5. Sparkles following the cursor ---------- */
  var sparkleLayer = null, lastSpark = 0;
  var SPARKLE_COLORS = ["#ffb3c6", "#e9d5ff", "#ffffff", "#f9a8d4"];
  function spawnSparkle(x, y) {
    if (!sparkleLayer) return;
    if (sparkleLayer.childNodes.length > 24) {
      sparkleLayer.removeChild(sparkleLayer.firstChild);
    }
    var s = document.createElement("span");
    s.className = "fx-sparkle";
    s.textContent = "\u2726";
    s.style.left = (x + (Math.random() * 16 - 8)) + "px";
    s.style.top = (y + (Math.random() * 10 - 5)) + "px";
    s.style.fontSize = (8 + Math.random() * 8) + "px";
    s.style.color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
    s.addEventListener("animationend", function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    });
    sparkleLayer.appendChild(s);
  }
  function initSparkles() {
    if (REDUCED) return;
    sparkleLayer = document.createElement("div");
    sparkleLayer.className = "fx-sparkles";
    sparkleLayer.setAttribute("aria-hidden", "true");
    document.body.appendChild(sparkleLayer);
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var now = Date.now();
      if (now - lastSpark < 60) return;
      lastSpark = now;
      spawnSparkle(e.clientX, e.clientY);
    }, { passive: true });
  }

  /* ---------- 7. Surprise burst (hearts + glitter) ---------- */
  var burstLayer = null;
  function spawnBurst(x, y) {
    if (REDUCED || !burstLayer) return;
    var i, el, ang, dist;
    for (i = 0; i < 14; i++) {
      el = document.createElement("span");
      el.className = "fx-burst-heart";
      el.textContent = "\u2764";
      ang = Math.random() * Math.PI * 2;
      dist = 50 + Math.random() * 70;
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(0) + "px");
      el.style.setProperty("--dy", (Math.sin(ang) * dist - 30).toFixed(0) + "px");
      el.style.fontSize = (12 + Math.random() * 10) + "px";
      el.style.color = HEART_COLORS[i % HEART_COLORS.length];
      el.addEventListener("animationend", function () {
        if (this.parentNode) this.parentNode.removeChild(this);
      });
      burstLayer.appendChild(el);
    }
    for (i = 0; i < 16; i++) {
      el = document.createElement("span");
      el.className = "fx-burst-dot";
      el.textContent = "\u2726";
      ang = Math.random() * Math.PI * 2;
      dist = 40 + Math.random() * 90;
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(0) + "px");
      el.style.setProperty("--dy", (Math.sin(ang) * dist - 20).toFixed(0) + "px");
      el.style.fontSize = (7 + Math.random() * 7) + "px";
      el.style.color = ["#ffffff", "#f9a8d4", "#e9d5ff"][i % 3];
      el.addEventListener("animationend", function () {
        if (this.parentNode) this.parentNode.removeChild(this);
      });
      burstLayer.appendChild(el);
    }
  }
  function initBurst() {
    if (REDUCED) return;
    burstLayer = document.createElement("div");
    burstLayer.className = "fx-burst";
    burstLayer.setAttribute("aria-hidden", "true");
    document.body.appendChild(burstLayer);
    ["revealBtn", "discoverBtn"].forEach(function (id) {
      var b = document.getElementById(id);
      if (!b) return;
      b.addEventListener("click", function () {
        var r = b.getBoundingClientRect();
        spawnBurst(r.left + r.width / 2, r.top + r.height / 2);
      });
    });
  }

  /* ---------- 8. Fade-in + slide-up on scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".points li, .site-footer, .letters-head, #playGameBtn");
    if (!els.length) return;
    var i;
    for (i = 0; i < els.length; i++) {
      els[i].classList.add("reveal");
      els[i].style.transitionDelay = Math.min(i * 80, 320) + "ms";
    }
    if (!("IntersectionObserver" in window)) {
      for (i = 0; i < els.length; i++) els[i].classList.add("in-view");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in-view");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    for (i = 0; i < els.length; i++) io.observe(els[i]);
  }

  /* ---------- 8b. Envelope entrance when the letters screen opens ---------- */
  function initEnvelopeEntrance() {
    var screen = document.getElementById("lettersScreen");
    var field = document.getElementById("envelopeField");
    if (!screen || !field || !("MutationObserver" in window)) return;
    var timer = 0;
    new MutationObserver(function () {
      if (screen.hidden) return;
      field.classList.add("envelopes-in");
      clearTimeout(timer);
      timer = setTimeout(function () {
        field.classList.remove("envelopes-in");
      }, 1400);
    }).observe(screen, { attributes: true, attributeFilter: ["hidden"] });
  }

  /* ---------- 9. Subtle glow on important buttons ---------- */
  function initGlow() {
    var ids = ["enterUniverseBtn", "exploreGalaxyBtn", "revealBtn", "yesForeverBtn", "alwaysBtn"];
    ids.forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.classList.add("glow-pulse");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".btn-dark"), function (b) {
      b.classList.add("glow-pulse");
    });
  }

  /* ---------- Boot ---------- */
  makeHearts(document.getElementById("loginStage"), 8);
  makeHearts(document.getElementById("welcomeStage"), 10);
  initPetals();
  initSparkles();
  initBurst();
  initReveal();
  initEnvelopeEntrance();
  initGlow();
})();
