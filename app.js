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

// Live site URL. Reset and Google links must always open the live site:
// when the site runs on localhost, a link back to localhost breaks as soon
// as the local server is off (the browser shows "site can't be reached").
const LIVE_URL = "https://shivamkumarr9040-hub.github.io/Love-msg/";
function getRedirectUrl() {
  return window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? LIVE_URL
    : window.location.origin + window.location.pathname;
}

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

// Forgot password + reset password flow
const forgotBtn = document.getElementById("forgotBtn");
const forgotView = document.getElementById("forgotView");
const forgotEmailInput = document.getElementById("forgotEmail");
const forgotError = document.getElementById("forgotError");
const forgotHint = document.getElementById("forgotHint");
const sendResetBtn = document.getElementById("sendResetBtn");
const backToLoginBtn2 = document.getElementById("backToLoginBtn2");
const resetView = document.getElementById("resetView");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const setPasswordBtn = document.getElementById("setPasswordBtn");
const resetError = document.getElementById("resetError");
const resetHint = document.getElementById("resetHint");

// True when the page was opened from a password-reset email link.
// Supabase puts type=recovery in the URL hash for those links.
const isRecovery = window.location.hash.indexOf("type=recovery") !== -1;

// Secure-account mode: opened from the "Secure your account" link in the
// password-changed email. Shows the reset-link form with a secure heading
// and the account email prefilled, so a hacked account can be recovered.
const secureParams = new URLSearchParams(window.location.search);
const isSecureMode = secureParams.get("secure") === "1";
const secureEmail = secureParams.get("email") || "";

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
  [loginBtn, signupBtn, googleBtn, sendOtpBtn, verifyOtpBtn, resendOtpBtn, sendResetBtn, setPasswordBtn].forEach(function (b) {
    if (b) b.disabled = on;
  });
}
function showSignedIn(user) {
  // Full screen opens ONLY after login / account is created.
  // Before that, everything stays inside the phone.
  if (loginStage) loginStage.hidden = true;
  if (welcomeStage) welcomeStage.hidden = false;
  if (successEmail) successEmail.textContent = user && user.email ? user.email : "";
  if (window.startCosmic) window.startCosmic();
}
function showLogin() {
  if (window.stopCosmic) window.stopCosmic();
  if (welcomeStage) welcomeStage.hidden = true;
  if (loginStage) loginStage.hidden = false;
  if (loginView) loginView.hidden = false;
  if (signupView) signupView.hidden = true;
  if (forgotView) forgotView.hidden = true;
  if (resetView) resetView.hidden = true;
}
function showForgot() {
  // Forgot password stays inside the phone, not a separate page.
  if (welcomeStage) welcomeStage.hidden = true;
  if (loginStage) loginStage.hidden = false;
  if (loginView) loginView.hidden = true;
  if (signupView) signupView.hidden = true;
  if (forgotView) forgotView.hidden = false;
  if (resetView) resetView.hidden = true;
  if (forgotError) forgotError.textContent = "";
  if (forgotHint) forgotHint.hidden = true;
  const forgotHeading = forgotView ? forgotView.querySelector("h2") : null;
  if (forgotHeading) forgotHeading.textContent = "Forgot password";
  const forgotSub = forgotView ? forgotView.querySelector(".phone-sub") : null;
  if (forgotSub) forgotSub.textContent = "Enter your email — we'll send you a link to set a new password.";
  if (forgotEmailInput) forgotEmailInput.focus();
}
function showSecure() {
  // "Secure your account" — the same reset-link form as forgot password,
  // with a secure heading and the account email prefilled.
  showForgot();
  const secureHeading = forgotView ? forgotView.querySelector("h2") : null;
  if (secureHeading) secureHeading.textContent = "Secure your account";
  const secureSub = forgotView ? forgotView.querySelector(".phone-sub") : null;
  if (secureSub) secureSub.textContent = "If you didn't change your password, send yourself a reset link and set a new one.";
  if (forgotEmailInput && secureEmail) forgotEmailInput.value = secureEmail;
}
function showReset() {
  // Set-new-password screen, opened from the reset link in the email.
  if (welcomeStage) welcomeStage.hidden = true;
  if (loginStage) loginStage.hidden = false;
  if (loginView) loginView.hidden = true;
  if (signupView) signupView.hidden = true;
  if (forgotView) forgotView.hidden = true;
  if (resetView) resetView.hidden = false;
  if (resetError) resetError.textContent = "";
  if (resetHint) resetHint.hidden = true;
  if (newPasswordInput) newPasswordInput.focus();
}
function showSignup() {
  // Create Account + OTP stays inside the phone, not a separate page.
  if (welcomeStage) welcomeStage.hidden = true;
  if (loginStage) loginStage.hidden = false;
  if (loginView) loginView.hidden = true;
  if (signupView) signupView.hidden = false;
  if (forgotView) forgotView.hidden = true;
  if (resetView) resetView.hidden = true;
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

// Tell the account owner their password was changed (Edge Function
// "notify-password-changed" sends the email with a "Secure your account"
// link). Best-effort: the password is already changed even if the
// email fails, so this never blocks the UI or throws.
async function notifyPasswordChanged(email) {
  if (!email || !supabaseClient || !supabaseClient.functions) return;
  try {
    await supabaseClient.functions.invoke("notify-password-changed", {
      body: { email: email },
    });
  } catch (e) {}
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
    // A recovery link signs the user in with a recovery session —
    // show the set-new-password screen instead of the universe.
    if (isRecovery && data && data.session && data.session.user) showReset();
    else if (isSecureMode) showSecure();
    else if (data && data.session && data.session.user) showSignedIn(data.session.user);
    else showLogin();
  } catch (e) {
    if (isSecureMode) showSecure();
    else showLogin();
  }
  supabaseClient.auth.onAuthStateChange(function (_event, session) {
    // While the reset or secure screen is open, don't jump into the universe.
    if (isRecovery || isSecureMode) return;
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

// "Forgot password?" opens the reset-link form inside the phone.
if (forgotBtn) {
  forgotBtn.addEventListener("click", function () {
    clearError();
    showForgot();
  });
}

if (backToLoginBtn2) {
  backToLoginBtn2.addEventListener("click", function () {
    showLogin();
  });
}

// Send the password-reset email. Supabase sends a link; opening it
// brings the user back here with type=recovery in the URL.
if (sendResetBtn) {
  sendResetBtn.addEventListener("click", async function () {
    if (busy) return;
    if (forgotError) forgotError.textContent = "";
    if (forgotHint) forgotHint.hidden = true;
    if (!isConfigured || !supabaseClient) {
      if (forgotError) forgotError.textContent = notConfiguredMsg();
      return;
    }
    const email = forgotEmailInput ? forgotEmailInput.value.trim() : "";
    if (!email || email.indexOf("@") === -1) {
      if (forgotError) forgotError.textContent = "Enter a valid email address.";
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl(),
      });
      if (error) {
        if (forgotError) forgotError.textContent = error.message;
      } else if (forgotHint) {
        forgotHint.hidden = false;
        forgotHint.textContent =
          "Reset link sent to " + email + " — check your inbox (and spam folder).";
      }
    } catch (e) {
      if (forgotError) forgotError.textContent = "Reset link was not sent — please try again.";
    } finally {
      setBusy(false);
    }
  });
}

// Set the new password after opening the reset link.
if (setPasswordBtn) {
  setPasswordBtn.addEventListener("click", async function () {
    if (busy) return;
    if (resetError) resetError.textContent = "";
    if (resetHint) resetHint.hidden = true;
    if (!isConfigured || !supabaseClient) {
      if (resetError) resetError.textContent = notConfiguredMsg();
      return;
    }
    const next = newPasswordInput ? newPasswordInput.value : "";
    const confirm = confirmPasswordInput ? confirmPasswordInput.value : "";
    if (!next || next.length < 6) {
      if (resetError) resetError.textContent = "Password must be at least 6 characters.";
      return;
    }
    if (next !== confirm) {
      if (resetError) resetError.textContent = "Passwords do not match.";
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabaseClient.auth.updateUser({ password: next });
      if (error) {
        if (resetError) resetError.textContent = error.message;
      } else if (resetHint) {
        resetHint.hidden = false;
        resetHint.textContent = "Password changed — opening your universe…";
        // Clear the recovery token from the URL, then enter the universe.
        try {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch (e) {}
        const user = data && data.user ? data.user : null;
        // Notify the account owner that the password changed, so a
        // hacked account gets caught. Fire-and-forget, never blocks.
        if (user && user.email) notifyPasswordChanged(user.email);
        setTimeout(function () {
          if (user) showSignedIn(user);
          else showLogin();
        }, 1200);
      }
    } catch (e) {
      if (resetError) resetError.textContent = "Password was not changed — please try again.";
    } finally {
      setBusy(false);
    }
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
          redirectTo: getRedirectUrl(),
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
