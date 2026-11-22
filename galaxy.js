// Love-msg — PHASE 2: THE GALAXY OF SECRETS.
// Five planets, secret stars, navigation and explore progress.
// Planet content lives in the PLANETS config below — edit text there.
(function () {
  // ---- Screen switching shared by Phase 2-5 ----
  var SCREENS = ["cosmicWelcome", "cosmicInside", "galaxyScreen", "lettersScreen", "gameScreen", "finaleScreen"];
  window.showCosmicScreen = function (id) {
    SCREENS.forEach(function (s) {
      var el = document.getElementById(s);
      if (el) el.hidden = (s !== id);
    });
    var musicBtn = document.getElementById("musicBtn");
    if (musicBtn) musicBtn.hidden = (id === "galaxyScreen" || id === "lettersScreen");
    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.hidden = (id === "galaxyScreen" || id === "lettersScreen" || id === "gameScreen" || id === "finaleScreen");
  };

  var PLANETS = [
    { id: "memory", name: "MEMORY", glyph: "🪐", color: "#7c3aed", ring: true,
      intro: "Humari saari chhoti-chhoti yaadein yahin chamakti hain.",
      text: "Kuch yaadein waqt ke saath feeki pad jaati hain. Par achhi wali taare ban jaati hain — aur ye poora planet unhi se bana hai." },
    { id: "feelings", name: "FEELINGS", glyph: "🌕", color: "#2563eb", ring: false,
      intro: "Jo kuch bhi main mehsoos karta hoon, sab yahin sambhal ke rakha hai.",
      text: "Feelings ko bolna mushkil hota hai. Yahan wo chupchaap ghoomti rehti hain — sachhi, pyaari, aur hamesha apni si." },
    { id: "dreams", name: "DREAMS", glyph: "🌙", color: "#a78bfa", ring: false,
      intro: "Saare chhote-chhote sapne, jo poore hone ka intezaar kar rahe hain.",
      text: "Aankhein band karo aur wish maango. Is planet pe humare saare sapne rakhe hain." },
    { id: "secrets", name: "SECRETS", glyph: "✨", color: "#38bdf8", ring: true,
      intro: "Chhupe hue messages, andhere mein tumhara intezaar kar rahe hain.",
      text: "Yahan paanch band letters tair rahe hain, har ek sirf tumhare liye likha hai. Jab mann kare, khol lena." },
    { id: "forever", name: "FOREVER", glyph: "💜", color: "#c084fc", ring: false,
      intro: "Kuch cheezein khatam hone ke liye nahi hoti.",
      text: "Hamesha bahut bada word hai. Par kuch feelings usse bhi badi hoti hain — wo bas reh jaati hain." },
  ];
  var STAR_SURPRISES = [
    "Tumhari smile poori galaxy ko roshan kar sakti hai.",
    "Kahin na kahin, ek taare ka naam is moment pe rakha gaya hai.",
    "Tum is universe ka sabse best surprise ho.",
    "Aaj raat jo bhi taare dikh rahe hain, wo sab tumhare liye khush hain.",
    "Explore karte raho — sabse best secret abhi baaki hai.",
    "Tumhare saath normal din bhi taaron jaisa lagta hai.",
  ];
  var STAR_SPOTS = [
    { x: 12, y: 18 }, { x: 78, y: 14 }, { x: 22, y: 72 },
    { x: 64, y: 76 }, { x: 88, y: 48 }, { x: 42, y: 8 },
  ];
  var PLANET_SPOTS = [
    { x: 18, y: 30, size: 92 }, { x: 46, y: 16, size: 74 },
    { x: 70, y: 32, size: 104 }, { x: 30, y: 62, size: 80 },
    { x: 62, y: 66, size: 88 },
  ];

  var field = document.getElementById("galaxyField");
  var card = document.getElementById("planetCard");
  var starModal = document.getElementById("starModal");
  var progressEl = document.getElementById("galaxyProgress");
  var visited = {};
  var starsFound = 0;
  var currentPlanet = null;
  try {
    visited = JSON.parse(localStorage.getItem("love-msg-explored") || "{}");
    starsFound = parseInt(localStorage.getItem("love-msg-stars") || "0", 10) || 0;
  } catch (e) {}

  function saveProgress() {
    try {
      localStorage.setItem("love-msg-explored", JSON.stringify(visited));
      localStorage.setItem("love-msg-stars", String(starsFound));
    } catch (e) {}
  }
  function updateProgress() {
    var n = Object.keys(visited).length;
    if (progressEl) progressEl.textContent = n + " / 5 planets · " + starsFound + " taare";
  }
  function planetStyle(p, spot) {
    return "left:" + spot.x + "%;top:" + spot.y + "%;width:" + spot.size + "px;height:" + spot.size + "px;" +
      "background:radial-gradient(circle at 32% 30%, #ffffff55, " + p.color + " 38%, #0a0a24 78%);" +
      "box-shadow:0 0 34px " + p.color + "aa, inset -8px -10px 24px #00000088;";
  }
  function buildGalaxy() {
    if (!field || field.children.length) return;
    PLANETS.forEach(function (p, i) {
      var spot = PLANET_SPOTS[i];
      var wrap = document.createElement("button");
      wrap.type = "button";
      wrap.className = "planet" + (p.ring ? " has-ring" : "");
      wrap.style.cssText = planetStyle(p, spot);
      wrap.setAttribute("aria-label", "Planet " + p.name);
      wrap.innerHTML = '<span class="planet-glyph-sm">' + p.glyph + '</span><span class="planet-label">' + p.name + "</span>";
      wrap.addEventListener("click", function () { openPlanet(p, wrap); });
      field.appendChild(wrap);
    });
    STAR_SURPRISES.forEach(function (msg, i) {
      var spot = STAR_SPOTS[i];
      var star = document.createElement("button");
      star.type = "button";
      star.className = "secret-star";
      star.style.left = spot.x + "%";
      star.style.top = spot.y + "%";
      star.textContent = "✦";
      star.setAttribute("aria-label", "A secret star");
      star.addEventListener("click", function () { openStar(msg, star); });
      field.appendChild(star);
    });
    updateProgress();
  }

  function openPlanet(p, el) {
    currentPlanet = p;
    visited[p.id] = true;
    saveProgress(); updateProgress();
    if (window.__cosmic) window.__cosmic.chime();
    // Smooth zoom toward the planet, then show its glass card.
    if (field) {
      var r = el.getBoundingClientRect();
      var fr = field.getBoundingClientRect();
      var cx = (r.left + r.width / 2 - fr.left) / fr.width;
      var cy = (r.top + r.height / 2 - fr.top) / fr.height;
      field.style.transformOrigin = (cx * 100) + "% " + (cy * 100) + "%";
      field.classList.add("zoomed");
    }
    setTimeout(function () {
      document.getElementById("planetGlyph").textContent = p.glyph;
      document.getElementById("planetName").textContent = p.name;
      document.getElementById("planetIntro").textContent = p.intro;
      document.getElementById("planetText").textContent = p.text;
      document.getElementById("planetEnterBtn").textContent = p.id === "secrets" ? "LETTERS KHOLO →" : "ANDAR AAO →";
      if (card) card.hidden = false;
    }, 450);
  }
  function closePlanet() {
    if (card) card.hidden = true;
    if (field) field.classList.remove("zoomed");
  }
  function openStar(msg, el) {
    starsFound += 1;
    saveProgress(); updateProgress();
    if (window.__cosmic) window.__cosmic.chime();
    if (el) el.classList.add("found");
    document.getElementById("starMessage").textContent = msg;
    if (starModal) starModal.hidden = false;
  }

  var enterBtn = document.getElementById("planetEnterBtn");
  if (enterBtn) {
    enterBtn.addEventListener("click", function () {
      closePlanet();
      if (currentPlanet && currentPlanet.id === "secrets") {
        if (window.showLetters) window.showLetters();
      } else {
        // Other planets open their own letter of the same feeling.
        if (window.openLetterByPlanet) window.openLetterByPlanet(currentPlanet ? currentPlanet.id : null);
      }
    });
  }
  var backBtn = document.getElementById("planetBackBtn");
  if (backBtn) backBtn.addEventListener("click", closePlanet);
  var starClose = document.getElementById("starCloseBtn");
  if (starClose) starClose.addEventListener("click", function () { if (starModal) starModal.hidden = true; });

  var exploreBtn = document.getElementById("exploreGalaxyBtn");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", function () {
      buildGalaxy();
      window.showCosmicScreen("galaxyScreen");
    });
  }
  var galaxyBack = document.getElementById("galaxyBackBtn");
  if (galaxyBack) {
    galaxyBack.addEventListener("click", function () {
      closePlanet();
      window.showCosmicScreen("cosmicInside");
    });
  }
  function syncMusicButtons() {
    if (!window.__cosmic) return;
    ["galaxyMusicBtn", "lettersMusicBtn"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.textContent = window.__cosmic.isMusicOn() ? "🔊" : "🔇";
    });
  }
  ["galaxyMusicBtn", "lettersMusicBtn"].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener("click", function () {
      if (window.__cosmic) { window.__cosmic.toggleMusic(); syncMusicButtons(); }
    });
  });
  var soundBtn = document.getElementById("soundBtn");
  if (soundBtn) {
    if (window.__cosmic) soundBtn.textContent = window.__cosmic.soundOn() ? "🔔" : "🔕";
    soundBtn.addEventListener("click", function () {
      if (!window.__cosmic) return;
      var on = window.__cosmic.toggleSound();
      soundBtn.textContent = on ? "🔔" : "🔕";
      if (on) window.__cosmic.chime();
    });
  }
  // Parallax on the galaxy field.
  window.addEventListener("pointermove", function (e) {
    if (!field || document.getElementById("galaxyScreen").hidden) return;
    var px = (e.clientX / window.innerWidth - 0.5) * 2;
    var py = (e.clientY / window.innerHeight - 0.5) * 2;
    field.style.setProperty("--px", px.toFixed(2));
    field.style.setProperty("--py", py.toFixed(2));
  });
  buildGalaxy();
})();
