// Love-msg v2 — LOGIN PAGE ONLY (for Shivam)
// No dashboard, no websites, no LOVE.exe copy, no flying hearts.
// STEP 1 (Shivam ko karna hai): Supabase project banao, Authentication > Email on karo,
// Settings > API se Project URL aur anon key copy karke neeche dalo.
// Google ke liye: Google Cloud me OAuth client banao, uski ID/Secret Supabase
// Authentication > Providers > Google me dalo. Tabhi Google button kaam karega.
// OTP ke liye: Supabase > Authentication > Providers > Email me "Confirm email"
// ON rakho, aur email bhejne ke liye SMTP sahi hona chahiye (default Supabase
// email, ya apna Gmail SMTP). Agar Confirm email OFF hai to OTP nahi aayega
// aur account turant ban jayega — OTP chahiye to Confirm email ON karo.
// IMPORTANT: yahan sirf anon key dalni hai. service_role key KABHI code me mat dalna.
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

// Signup page (separate page, OTP flow)
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
}
function showLogin() {
  if (welcomeStage) welcomeStage.hidden = true;
  if (loginStage) loginStage.hidden = false;
  if (loginView) loginView.hidden = false;
  if (signupView) signupView.hidden = true;
}
function showSignup() {
  // Create Account + OTP stays INSIDE the phone — not a separate page.
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
  return "Supabase setup pending hai — app.js me apna Project URL aur anon key dalo, phir dobara try karo. Google ke liye pehle Supabase me Google provider on karna padega.";
}

async function init() {
  if (!isConfigured) {
    if (setupHint) {
      setupHint.hidden = false;
      setupHint.textContent =
        "Setup pending: app.js me SUPABASE_URL aur SUPABASE_ANON_KEY dalo. Tab tak login kaam nahi karega — ye fake login nahi hai.";
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
      "Supabase load nahi hua — internet / CDN check karo aur page refresh karo."
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
      showError("Login nahi hua — dobara try karo.");
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

// STEP 1 — email + password, then Send OTP. Supabase sends a 6-digit OTP
// to the email (only if Confirm email is ON in Supabase).
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
      showSignupError("Password kam se kam 6 characters ka rakho.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: creds.email,
        password: creds.password,
      });
      if (error) {
        showSignupError(error.message);
      } else if (data && data.session) {
        // Confirm email OFF hai — OTP nahi aayega, account turant ban gaya.
        showSignedIn(data.session.user);
      } else {
        // OTP email par gaya — Step 2 kholo.
        showOtpStep(creds.email);
      }
    } catch (e) {
      showSignupError("OTP nahi bheja gaya — dobara try karo.");
    } finally {
      setBusy(false);
    }
  });
}

// STEP 2 — OTP dalo, verify karo, tab account create hota hai.
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
      showSignupError("Pehle Step 1 me email dalke Send OTP dabao.");
      return;
    }
    if (!/^\d{6}$/.test(token)) {
      showSignupError("6-digit OTP dalo — jo email par aaya hai.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        email: pendingSignupEmail,
        token: token,
        type: "signup",
      });
      if (error) showSignupError(error.message);
      else if (data && data.session) showSignedIn(data.session.user);
      else showSignupError("OTP verify nahi hua — dobara try karo.");
    } catch (e) {
      showSignupError("OTP verify nahi hua — dobara try karo.");
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
      showSignupError("Pehle Step 1 me email dalke Send OTP dabao.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabaseClient.auth.resend({
        type: "signup",
        email: pendingSignupEmail,
      });
      if (error) showSignupError(error.message);
      else showSignupError("OTP dobara bhej diya — email check karo.");
    } catch (e) {
      showSignupError("OTP dobara nahi bheja gaya — dobara try karo.");
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
      showError("Google login nahi khula — dobara try karo.");
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

init();
