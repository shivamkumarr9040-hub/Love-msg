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
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

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

init();
