// Love-msg v2 — LOGIN PAGE ONLY (Valentine gift for Shivam)
// No dashboard, no websites, no LOVE.exe copy, no flying hearts.
// STEP 1 (Shivam ko karna hai): Supabase project banao, Authentication > Email on karo,
// Settings > API se Project URL aur anon key copy karke neeche dalo.
// Google ke liye: Google Cloud me OAuth client banao, uski ID/Secret Supabase
// Authentication > Providers > Google me dalo. Tabhi Google button kaam karega.
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
const phoneBody = document.querySelector(".phone-body");
const successBox = document.getElementById("loginSuccess");
const successEmail = document.getElementById("successEmail");

const isConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR_SUPABASE_URL") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY") &&
  SUPABASE_URL.startsWith("https://");

let supabaseClient = null;
let busy = false;

function showError(msg) {
  if (loginError) loginError.textContent = msg;
}
function clearError() {
  if (loginError) loginError.textContent = "";
}
function setBusy(on) {
  busy = on;
  [loginBtn, signupBtn, googleBtn].forEach(function (b) {
    if (b) b.disabled = on;
  });
}
function showSignedIn(user) {
  if (phoneBody) phoneBody.classList.add("signed-in");
  if (successBox) successBox.hidden = false;
  if (successEmail) successEmail.textContent = user && user.email ? user.email : "";
}
function showLogin() {
  if (phoneBody) phoneBody.classList.remove("signed-in");
  if (successBox) successBox.hidden = true;
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

if (signupBtn) {
  signupBtn.addEventListener("click", async function () {
    if (busy) return;
    clearError();
    if (!isConfigured || !supabaseClient) {
      showError(notConfiguredMsg());
      return;
    }
    const creds = readCreds();
    if (!creds.email || !creds.password) {
      showError("Email aur password dono dalo — phir Create account dabao.");
      return;
    }
    if (creds.password.length < 6) {
      showError("Password kam se kam 6 characters ka rakho.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: creds.email,
        password: creds.password,
      });
      if (error) showError(error.message);
      else if (data && data.session) showSignedIn(data.session.user);
      else
        showError(
          "Account ban gaya! Agar Supabase me email confirmation on hai to pehle apni email confirm karo, phir Sign in dabao."
        );
    } catch (e) {
      showError("Account nahi bana — dobara try karo.");
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
