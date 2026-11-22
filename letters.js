// Love-msg — PHASE 3: THE SECRET MESSAGES.
// Edit the LETTERS config below to personalize: recipient, title,
// message and signature. Nothing personal is hardcoded in the markup.
var LETTERS = [
  {
    title: "Ek Chhota Sa Hello",
    to: "Pyaari",
    body: "Hello. Ye letter chhota sa hai, par isme ek badi si baat chhupi hai — main tumhare baare mein soch raha tha, aur poori duniya thodi aur roshan lagne lagi.",
    sign: "Tumhara, Shivam",
  },
  {
    title: "Kuch Baatein Jo Kabhi Keh Nahi Paaya",
    to: "Pyaari",
    body: "Kuch baatein main kabhi bol nahi paaya, isliye yahan likh di. Tumhare saath normal din bhi khaas lagta hai, aur tumhe koshish bhi nahi karni padti.",
    sign: "Tumhara, Shivam",
  },
  {
    title: "Tum Baaki Sabse Alag Ho",
    to: "Pyaari",
    body: "Is poori duniya mein sirf tum ho jiske saath dil ko ghar jaisa lagta hai. Kabhi mat bhoolna, tum kitni khaas ho.",
    sign: "Tumhara, Shivam",
  },
  {
    title: "Ek Pyaari Si Yaad",
    to: "Pyaari",
    body: "Ek yaad main hamesha apne paas rakhta hoon — wo moment jab sab kuch sahi lag raha tha. Jab bhi duniya thodi bhaari lagti hai, usi ke baare mein sochta hoon, aur phir bhi smile aa jaati hai.",
    sign: "Tumhara, Shivam",
  },
  {
    title: "Ek Aakhri Secret",
    to: "Pyaari",
    body: "Ye mera aakhri secret hai: ye chhoti si duniya hume kahin bhi le jaaye, main khush hoon ki isne mujhe tum tak pahunchaya.",
    sign: "Tumhara, Shivam",
  },
];
var BONUS_SECRET = "Psst — ek aur secret: ye duniya bahut pyaar se banayi gayi thi, sirf tumhare liye. Tumne iska har chhupa hua kona dhoondh liya. Asli surprise to yehi hai.";

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
    document.getElementById("letterTo").textContent = bonus ? "Sirf tumhare liye," : L.to + ",";
    document.getElementById("letterTitle").textContent = bonus ? "Ek Aur Secret" : L.title;
    document.getElementById("letterSign").textContent = bonus ? "— Tumhari duniya" : L.sign;
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
