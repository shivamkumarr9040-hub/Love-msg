// Love-msg — PHASE 3: THE SECRET MESSAGES.
// Edit the LETTERS config below to personalize: recipient, title,
// message and signature. Nothing personal is hardcoded in the markup.
var LETTERS = [
  {
    title: "A Little Hello",
    to: "Beautiful",
    body: "Hello. I know this is a small letter, but it carries something big — I was thinking of you, and the whole universe felt a little brighter because of it.",
    sign: "With love, Shivam",
  },
  {
    title: "Things I Never Said",
    to: "Beautiful",
    body: "There are things I never said out loud, so I wrote them here. You make ordinary days feel special, and you never even have to try.",
    sign: "With love, Shivam",
  },
  {
    title: "You Are Special",
    to: "Beautiful",
    body: "Out of everyone in this world, you are the one who makes my heart feel at home. Never forget how special you truly are.",
    sign: "With love, Shivam",
  },
  {
    title: "A Beautiful Memory",
    to: "Beautiful",
    body: "I keep one memory close — the moment everything felt right. Whenever the world feels heavy, I think of it, and it still makes me smile.",
    sign: "With love, Shivam",
  },
  {
    title: "One Last Secret",
    to: "Beautiful",
    body: "Here is my last secret: no matter where this little universe takes us, I am glad it brought me to you.",
    sign: "With love, Shivam",
  },
];
var BONUS_SECRET = "Psst — one more secret: this universe was built with a lot of love, just for you. You found every hidden corner of it. That is the real surprise.";

(function () {
  var field = document.getElementById("envelopeField");
  var reader = document.getElementById("letterReader");
  var bodyEl = document.getElementById("letterBody");
  var fillEl = document.getElementById("readingFill");
  var opened = {};
  var current = 0;
  var typingTimer = 0;
  try { opened = JSON.parse(localStorage.getItem("love-msg-letters") || "{}"); } catch (e) {}

  var PLANET_LETTER = { memory: 3, feelings: 1, dreams: 0, forever: 2 };

  function saveOpened() {
    try { localStorage.setItem("love-msg-letters", JSON.stringify(opened)); } catch (e) {}
  }
  function buildEnvelopes() {
    if (!field || field.children.length) return;
    LETTERS.forEach(function (L, i) {
      var env = document.createElement("button");
      env.type = "button";
      env.className = "envelope" + (opened[i] ? " opened" : "");
      env.innerHTML = '<span class="env-icon">✉️</span><span class="env-num">0' + (i + 1) + '</span><span class="env-title">' + L.title + "</span>";
      env.setAttribute("aria-label", "Letter: " + L.title);
      env.addEventListener("click", function () { openLetter(i); });
      field.appendChild(env);
    });
  }
  function typeText(text) {
    clearInterval(typingTimer);
    bodyEl.textContent = "";
    var i = 0;
    typingTimer = setInterval(function () {
      i += 2;
      bodyEl.textContent = text.slice(0, i);
      if (fillEl) fillEl.style.width = Math.min(100, (i / text.length) * 100) + "%";
      if (i >= text.length) clearInterval(typingTimer);
    }, 24);
  }
  function openLetter(i, bonus) {
    current = i;
    var L = LETTERS[i];
    document.getElementById("letterTo").textContent = bonus ? "Just for you" : "For " + L.to + ",";
    document.getElementById("letterTitle").textContent = bonus ? "One More Secret" : L.title;
    document.getElementById("letterSign").textContent = bonus ? "— Your universe" : L.sign;
    if (!bonus) { opened[i] = true; saveOpened(); markOpened(); }
    if (window.__cosmic) window.__cosmic.chime();
    if (reader) reader.hidden = false;
    typeText(bonus ? BONUS_SECRET : L.body);
  }
  function markOpened() {
    if (!field) return;
    Array.prototype.forEach.call(field.children, function (el, i) {
      if (opened[i]) el.classList.add("opened");
    });
  }
  window.showLetters = function () {
    buildEnvelopes();
    window.showCosmicScreen("lettersScreen");
  };
  window.openLetterByPlanet = function (planetId) {
    var idx = PLANET_LETTER[planetId];
    if (idx === undefined) idx = 0;
    buildEnvelopes();
    window.showCosmicScreen("lettersScreen");
    openLetter(idx);
  };
  function closeReader() {
    clearInterval(typingTimer);
    if (reader) reader.hidden = true;
  }
  var closeBtn = document.getElementById("letterCloseBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeReader);
  var backBtn = document.getElementById("backEnvelopesBtn");
  if (backBtn) backBtn.addEventListener("click", closeReader);
  var prevBtn = document.getElementById("prevLetterBtn");
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      openLetter((current - 1 + LETTERS.length) % LETTERS.length);
    });
  }
  var nextBtn = document.getElementById("nextLetterBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      openLetter((current + 1) % LETTERS.length);
    });
  }
  var discoverBtn = document.getElementById("discoverBtn");
  if (discoverBtn) {
    discoverBtn.addEventListener("click", function () {
      var unopened = LETTERS.map(function (_, i) { return i; }).filter(function (i) { return !opened[i]; });
      if (unopened.length) openLetter(unopened[0]);
      else openLetter(current, true);
    });
  }
  var lettersBack = document.getElementById("lettersBackBtn");
  if (lettersBack) {
    lettersBack.addEventListener("click", function () {
      closeReader();
      window.showCosmicScreen("galaxyScreen");
    });
  }
  var playGameBtn = document.getElementById("playGameBtn");
  if (playGameBtn) {
    playGameBtn.addEventListener("click", function () {
      closeReader();
      if (window.startGame) window.startGame();
    });
  }
  buildEnvelopes();
})();
