// Love-msg — login with Supabase Auth (email OTP + password + Google).
// Setup:
//   1. Create a Supabase project, enable the Email provider.
//   2. Email templates (Authentication > Email Templates):
//      Magic Link and Confirm sign up must contain
//      "Your OTP is: {{ .Token }}" so the email carries a 6-digit code.
//   3. Put the Project URL and anon key in SUPABASE_URL / SUPABASE_ANON_KEY.
//      Only the anon key goes here. Never put the service_role key in code.
//   4. Google sign-in needs the Google provider enabled in Supabase first.
// Signup uses signInWithOtp, which sends a 6-digit code (not a link).
// The password is set after the OTP is verified, so password login works too.
const SUPABASE_URL = "https://lhiedimpadoacapydhik.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_E2oq-uiIqjkcXJZOLuCQtg_hNfoLmb_";

const loginError = document.getElementById("loginError");
const setupHint = document.getElementById("loginSetupHint");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const loginStage = document.getElementById("loginStage");
const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");
const welcomeStage = document.getElementById("welcomeStage");
const successEmail = document.getElementById("successEmail");

// Signup + OTP flow
const signupEmailInput = document.getElementById("signupEmail");
const signupPasswordInput = document.getElementById("signupPassword");
const otpInput = document.getElementById("otpInput");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");
const backToLoginBtn = document.getElementById("backToLoginBtn");
const signupStep1 = document.getElementById("signupStep1");
const signupStep2 = document.getElementById("signupStep2");
const signupError = document.getElementById("signupError");
const otpEmailLabel = document.getElementById("otpEmailLabel");

const isConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR_SUPABASE_URL") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY") &&
  SUPABASE_URL.startsWith("https://");

let supabaseClient = null;
let busy = false;
let pendingSignupEmail = "";

function showError(msg) {
  if (loginError) loginError.textContent = msg;
}
function clearError() {
  if (loginError) loginError.textContent = "";
}
function showSignupError(msg) {
  if (signupError) signupError.textContent = msg;
}
function clearSignupError() {
  if (signupError) signupError.textContent = "";
}
function setBusy(on) {
  busy = on;
  [loginBtn, signupBtn, googleBtn, sendOtpBtn, verifyOtpBtn, resendOtpBtn].forEach(function (b) {
    if (b) b.disabled = on;
  });
}
function showSignedIn(user) {
  // Full screen opens ONLY after login / account is created.
  // Before that, everything stays inside the phone.
  if (loginStage) loginStage.hidden = true;
  if (welcomeStage) welcomeStage.hidden = false;
  if (successEmail) successEmail.textContent = user && user.email ? user.email : "";
  resetSurprise();
}
function showLogin() {
  if (welcomeStage) welcomeStage.hidden = true;
  if (loginStage) loginStage.hidden = false;
  if (loginView) loginView.hidden = false;
  if (signupView) signupView.hidden = true;
}
function showSignup() {
  // Create Account + OTP stays inside the phone, not a separate page.
  if (welcomeStage) welcomeStage.hidden = true;
  if (loginStage) loginStage.hidden = false;
  if (loginView) loginView.hidden = true;
  if (signupView) signupView.hidden = false;
  if (signupStep1) signupStep1.hidden = false;
  if (signupStep2) signupStep2.hidden = true;
  clearSignupError();
  if (signupEmailInput) signupEmailInput.focus();
}
function showOtpStep(email) {
  pendingSignupEmail = email;
  if (otpEmailLabel) otpEmailLabel.textContent = email;
  if (signupStep1) signupStep1.hidden = true;
  if (signupStep2) signupStep2.hidden = false;
  clearSignupError();
  if (otpInput) otpInput.focus();
}
function notConfiguredMsg() {
  return "Supabase setup pending — add the Project URL and anon key in app.js first. For Google, enable the Google provider in Supabase.";
}

async function init() {
  if (!isConfigured) {
    if (setupHint) {
      setupHint.hidden = false;
      setupHint.textContent =
        "Setup pending: add SUPABASE_URL and SUPABASE_ANON_KEY in app.js. Login will not work until then.";
    }
    showLogin();
    return;
  }
  try {
    const mod = await import(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    );
    supabaseClient = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    showError(
      "Supabase failed to load — check your connection and refresh the page."
    );
    showLogin();
    return;
  }
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data && data.session && data.session.user) showSignedIn(data.session.user);
    else showLogin();
  } catch (e) {
    showLogin();
  }
  supabaseClient.auth.onAuthStateChange(function (_event, session) {
    if (session && session.user) showSignedIn(session.user);
    else showLogin();
  });
}

function readCreds() {
  return {
    email: emailInput ? emailInput.value.trim() : "",
    password: passwordInput ? passwordInput.value : "",
  };
}
function readSignupCreds() {
  return {
    email: signupEmailInput ? signupEmailInput.value.trim() : "",
    password: signupPasswordInput ? signupPasswordInput.value : "",
  };
}

if (loginBtn) {
  loginBtn.addEventListener("click", async function () {
    if (busy) return;
    clearError();
    if (!isConfigured || !supabaseClient) {
      showError(notConfiguredMsg());
      return;
    }
    const creds = readCreds();
    if (!creds.email || !creds.password) {
      showError("Email aur password dono dalo.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (error) showError(error.message);
      else if (data && data.session) showSignedIn(data.session.user);
    } catch (e) {
      showError("Login failed — please try again.");
    } finally {
      setBusy(false);
    }
  });
}

// "Create a new account" opens a SEPARATE signup page (not the login form).
if (signupBtn) {
  signupBtn.addEventListener("click", function () {
    clearError();
    showSignup();
  });
}

if (backToLoginBtn) {
  backToLoginBtn.addEventListener("click", function () {
    showLogin();
  });
}

// STEP 1 — email + password, then Send OTP. Supabase sends a 6-digit
// OTP code via signInWithOtp. The password is set after OTP verification,
// so password login works afterwards.
if (sendOtpBtn) {
  sendOtpBtn.addEventListener("click", async function () {
    if (busy) return;
    clearSignupError();
    if (!isConfigured || !supabaseClient) {
      showSignupError(notConfiguredMsg());
      return;
    }
    const creds = readSignupCreds();
    if (!creds.email || !creds.password) {
      showSignupError("Email aur password dono dalo.");
      return;
    }
    if (creds.password.length < 6) {
      showSignupError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      // OTP signup: signInWithOtp sends a code; signUp sends a link.
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: creds.email,
        options: { shouldCreateUser: true },
      });
      if (error) {
        showSignupError(error.message);
      } else {
        // OTP sent — open Step 2.
        showOtpStep(creds.email);
      }
    } catch (e) {
      showSignupError("OTP was not sent — please try again.");
    } finally {
      setBusy(false);
    }
  });
}

// STEP 2 — enter the OTP, verify it, and the account is created.
if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener("click", async function () {
    if (busy) return;
    clearSignupError();
    if (!isConfigured || !supabaseClient) {
      showSignupError(notConfiguredMsg());
      return;
    }
    const token = otpInput ? otpInput.value.trim() : "";
    if (!pendingSignupEmail) {
      showSignupError("Enter your email in Step 1 and tap Send OTP first.");
      return;
    }
    if (!/^\d{6}$/.test(token)) {
      showSignupError("Enter the 6-digit OTP sent to your email.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        email: pendingSignupEmail,
        token: token,
        type: "email",
      });
      if (error) showSignupError(error.message);
      else if (data && data.session) {
        // Account created and signed in. Now set the password
        // so password sign-in works later.
        const creds = readSignupCreds();
        if (creds.password && creds.password.length >= 6) {
          try {
            await supabaseClient.auth.updateUser({ password: creds.password });
          } catch (e) {}
        }
        showSignedIn(data.session.user);
      } else showSignupError("OTP verification failed — please try again.");
    } catch (e) {
      showSignupError("OTP verification failed — please try again.");
    } finally {
      setBusy(false);
    }
  });
}

if (resendOtpBtn) {
  resendOtpBtn.addEventListener("click", async function () {
    if (busy) return;
    clearSignupError();
    if (!isConfigured || !supabaseClient || !pendingSignupEmail) {
      showSignupError("Enter your email in Step 1 and tap Send OTP first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: pendingSignupEmail,
        options: { shouldCreateUser: true },
      });
      if (error) showSignupError(error.message);
      else showSignupError("OTP sent again — please check your email.");
    } catch (e) {
      showSignupError("OTP was not sent again — please try again.");
    } finally {
      setBusy(false);
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener("click", async function () {
    if (busy) return;
    clearError();
    if (!isConfigured || !supabaseClient) {
      showError(notConfiguredMsg());
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (error) showError(error.message);
    } catch (e) {
      showError("Google login did not open — please try again.");
    } finally {
      setBusy(false);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {}
    }
    showLogin();
  });
}

if (passwordInput) {
  passwordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && loginBtn) loginBtn.click();
  });
}

// ============ SURPRISE AFTER LOGIN ============
// Step 1: draw a heart on the canvas. Unlock is coverage-based:
// the strokes must spread across the canvas (left + right, top +
// bottom) and cover enough of it — a single dot or line is not a heart.
const drawStage = document.getElementById("drawStage");
const questionStage = document.getElementById("questionStage");
const answerStage = document.getElementById("answerStage");
const heartCanvas = document.getElementById("heartCanvas");
const drawHint = document.getElementById("drawHint");
const clearDrawBtn = document.getElementById("clearDrawBtn");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const playArea = document.getElementById("playArea");
const writeAnswerBtn = document.getElementById("writeAnswerBtn");
const answerTitle = document.getElementById("answerTitle");
const answerIntro = document.getElementById("answerIntro");
const answerInput = document.getElementById("answerInput");
const sendAnswerBtn = document.getElementById("sendAnswerBtn");
const answerSaved = document.getElementById("answerSaved");
const endStage = document.getElementById("endStage");
const endIntro = document.getElementById("endIntro");
const forAashi = document.getElementById("forAashi");

let drawing = false;
let drawPoints = [];
let noDodges = 0;
const MAX_NO_DODGES = 4;

function resetSurprise() {
  if (drawStage) drawStage.hidden = false;
  if (questionStage) questionStage.hidden = true;
  if (answerStage) answerStage.hidden = true;
  if (endStage) endStage.hidden = true;
  if (yesBtn) yesBtn.hidden = false;
  if (writeAnswerBtn) writeAnswerBtn.hidden = false;
  if (answerSaved) answerSaved.hidden = true;
  if (answerInput) answerInput.value = "";
  noDodges = 0;
  if (noBtn) {
    noBtn.hidden = false;
    noBtn.style.transform = "";
    noBtn.style.left = "calc(100% - 96px)";
    noBtn.style.top = "24px";
  }
  clearCanvas();
}
function clearCanvas() {
  drawPoints = [];
  if (!heartCanvas) return;
  const ctx = heartCanvas.getContext("2d");
  ctx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);
  if (drawHint) drawHint.textContent = "";
}
function canvasPos(e) {
  const rect = heartCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (heartCanvas.width / rect.width);
  const y = (e.clientY - rect.top) * (heartCanvas.height / rect.height);
  return { x: x, y: y };
}
function heartIsDrawn() {
  if (drawPoints.length < 40) return false;
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  const cells = new Set();
  for (const pt of drawPoints) {
    minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
    cells.add(Math.floor(pt.x / 60) + ":" + Math.floor(pt.y / 60));
  }
  // Spread left-right and top-bottom, covering a good part of the canvas.
  return (maxX - minX) >= 140 && (maxY - minY) >= 120 && cells.size >= 8;
}
function openQuestion() {
  if (drawStage) drawStage.hidden = true;
  if (questionStage) questionStage.hidden = false;
  if (answerStage) answerStage.hidden = true;
  if (endStage) endStage.hidden = true;
}
function openEnd(intro) {
  if (drawStage) drawStage.hidden = true;
  if (questionStage) questionStage.hidden = true;
  if (answerStage) answerStage.hidden = true;
  if (endStage) endStage.hidden = false;
  if (endIntro) endIntro.textContent = intro;
  // Replay the letter animation for "FOR Aashi" every time it opens.
  if (forAashi) {
    const text = "FOR Aashi";
    forAashi.innerHTML = "";
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement("span");
      span.textContent = text[i] === " " ? "\u00a0" : text[i];
      span.style.animationDelay = (i * 0.08) + "s";
      forAashi.appendChild(span);
    }
  }
}
function openAnswer(intro) {
  if (questionStage) questionStage.hidden = true;
  if (drawStage) drawStage.hidden = true;
  if (endStage) endStage.hidden = true;
  if (answerStage) answerStage.hidden = false;
  if (answerIntro) answerIntro.textContent = intro;
  if (answerInput) answerInput.focus();
}
if (heartCanvas) {
  const ctx = heartCanvas.getContext("2d");
  ctx.strokeStyle = "#e91e63";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  let last = null;
  heartCanvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    drawing = true;
    last = canvasPos(e);
    drawPoints.push(last);
    heartCanvas.setPointerCapture(e.pointerId);
  });
  heartCanvas.addEventListener("pointermove", function (e) {
    if (!drawing) return;
    const pos = canvasPos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    drawPoints.push(pos);
    last = pos;
  });
  function endDraw() {
    if (!drawing) return;
    drawing = false;
    if (heartIsDrawn()) openQuestion();
    else if (drawHint) drawHint.textContent = "Almost — draw a bigger heart.";
  }
  heartCanvas.addEventListener("pointerup", endDraw);
  heartCanvas.addEventListener("pointercancel", endDraw);
}
if (clearDrawBtn) {
  clearDrawBtn.addEventListener("click", clearCanvas);
}
// Step 2: the No button runs away inside the play area — smooth, and
// it never leaves the frame. After 4 dodges it disappears for good.
function dodgeNo() {
  if (!noBtn || !playArea) return;
  if (noDodges >= MAX_NO_DODGES) return;
  noDodges += 1;
  if (noDodges >= MAX_NO_DODGES) {
    noBtn.hidden = true;
    if (yesBtn) yesBtn.hidden = true;
    if (writeAnswerBtn) writeAnswerBtn.hidden = true;
    openEnd("No ran away — and yes, this was all for you.");
    return;
  }
  const area = playArea.getBoundingClientRect();
  const btn = noBtn.getBoundingClientRect();
  const maxX = Math.max(0, area.width - btn.width - 16);
  const maxY = Math.max(0, area.height - btn.height - 16);
  noBtn.style.transform = "none";
  noBtn.style.left = (8 + Math.random() * maxX) + "px";
  noBtn.style.top = (8 + Math.random() * maxY) + "px";
}
if (noBtn) {
  noBtn.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    dodgeNo();
  });
  noBtn.addEventListener("pointerenter", function () {
    dodgeNo();
  });
}
if (yesBtn) {
  yesBtn.addEventListener("click", function () {
    openAnswer("You said yes! Now tell me in your words too.");
  });
}
if (writeAnswerBtn) {
  writeAnswerBtn.addEventListener("click", function () {
    openAnswer("Write your answer — in your own words.");
  });
}
// Step 3: the dog drops in with the answer box. The answer is saved
// on this device only (localStorage) — there is no server inbox for it.
if (sendAnswerBtn) {
  sendAnswerBtn.addEventListener("click", function () {
    const text = answerInput ? answerInput.value.trim() : "";
    if (!text) {
      if (answerIntro) answerIntro.textContent = "Write something first — even one line.";
      return;
    }
    try {
      localStorage.setItem("love-msg-answer", text);
    } catch (e) {}
    if (answerSaved) answerSaved.hidden = false;
    sendAnswerBtn.disabled = true;
    setTimeout(function () {
      openEnd("Your answer is saved ❤️");
    }, 1200);
  });
}

init();
