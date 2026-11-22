// Love-msg — PHASE 4: A LITTLE LOVE GAME.
// Three questions, one per screen, answers saved for the session.
(function () {
  var QUESTIONS = [
    {
      q: "Agar hum universe mein kahin bhi ghoom sakte, to tum kahan jaana chahogi?",
      options: ["Ek jaadui galaxy", "Taaron ke neeche", "Kahin shaant jagah"],
    },
    {
      q: "Ek moment ko khaas kya banata hai?",
      options: ["Pyaari yaadein", "Achanak milne wale surprises", "Kisi ka saath hona"],
    },
    {
      q: "Apna chhota sa cosmic gift choose karo:",
      options: ["💌 Ek Secret Letter", "🌙 Ek Wish", "⭐ Ek Surprise"],
    },
  ];
  var answers = [];
  var step = 0;

  var qText = document.getElementById("gameQText");
  var optionsEl = document.getElementById("gameOptions");
  var progressEl = document.getElementById("gameProgress");
  var dotsEl = document.querySelector(".game-dots");
  var questionBox = document.getElementById("gameQuestion");
  var doneBox = document.getElementById("gameDone");

  function render() {
    var Q = QUESTIONS[step];
    if (progressEl) progressEl.textContent = (step + 1) + " / 3";
    if (dotsEl) {
      Array.prototype.forEach.call(dotsEl.children, function (d, i) {
        d.classList.toggle("on", i <= step);
      });
    }
    if (qText) qText.textContent = Q.q;
    if (optionsEl) {
      optionsEl.innerHTML = "";
      Q.options.forEach(function (opt) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "game-option";
        b.textContent = opt;
        b.addEventListener("click", function () { choose(opt, b); });
        optionsEl.appendChild(b);
      });
    }
    if (questionBox) {
      questionBox.classList.remove("fade-in");
      void questionBox.offsetWidth;
      questionBox.classList.add("fade-in");
    }
  }
  function choose(opt, btn) {
    if (window.__cosmic) window.__cosmic.chime();
    btn.classList.add("picked");
    answers[step] = opt;
    try { sessionStorage.setItem("love-msg-game", JSON.stringify(answers)); } catch (e) {}
    setTimeout(function () {
      step += 1;
      if (step < QUESTIONS.length) render();
      else finish();
    }, 450);
  }
  function finish() {
    if (questionBox) questionBox.hidden = true;
    if (doneBox) {
      doneBox.hidden = false;
      doneBox.classList.add("fade-in");
    }
    var list = document.getElementById("gameAnswers");
    if (list) {
      list.textContent = answers.map(function (a, i) { return "Q" + (i + 1) + ": " + a; }).join(" · ");
    }
  }
  window.startGame = function () {
    answers = [];
    step = 0;
    if (questionBox) questionBox.hidden = false;
    if (doneBox) doneBox.hidden = true;
    render();
    window.showCosmicScreen("gameScreen");
  };
  var revealBtn = document.getElementById("revealBtn");
  if (revealBtn) {
    revealBtn.addEventListener("click", function () {
      if (window.startFinale) window.startFinale();
    });
  }
})();
