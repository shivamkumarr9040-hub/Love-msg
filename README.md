# Love-msg v2 — Login page ONLY (Valentine gift)

Sirf login page. Koi dashboard nahi, koi websites list nahi, LOVE.exe ka copy nahi,
dil udte hue nahi.

Home page pe ek iPhone smooth slide-up hoke aata hai (spring easing, staggered
fields). Phone ke andar login hai: **Sign in**, **Create a new account**,
**Sign in with Google**. Login hote hi phone ke andar hi "You're signed in"
dikhta hai + Logout. Bas. Phone baad me hilta nahi — hilta hua button tap
karna mushkil hota hai, isliye entrance ke baad phone steady rehta hai.

## Files

- `index.html` — login page + iPhone
- `style.css` — dark premium design + phone animation
- `app.js` — Supabase login / signup / Google / logout (keys yahi dalni hain)

## Setup — pehle ye karo, warna login kaam nahi karega

### 1. Supabase project
1. supabase.com > New project > naam, password, region Singapore/Mumbai > Create.
2. Authentication > Providers > Email > Enable. Testing ke liye "Confirm email" off rakho.
3. Settings > API se `Project URL` aur `anon public` key copy karo.
4. `app.js` ke upar wali 2 lines me dalo:
   `SUPABASE_URL = "https://xyz.supabase.co"` aur `SUPABASE_ANON_KEY = "..."`
5. Sirf **anon** key dalni hai. `service_role` key kabhi code me mat dalna.

Jab tak keys nahi dalte, login screen par saaf likha aayega
"Supabase setup pending hai" — ye fake login nahi hai.

### 2. Google login (optional)
1. console.cloud.google.com > New project.
2. APIs & Services > OAuth consent screen > External > app naam + email > Save.
3. Credentials > Create Credentials > OAuth client ID > Web application.
4. Authorized redirect URIs me dalo:
   `https://<tumhara-project-ref>.supabase.co/auth/v1/callback`
5. Client ID + Client Secret copy karo.
6. Supabase > Authentication > Providers > Google > Enable, ID/Secret paste karo > Save.
7. Supabase > Authentication > URL Configuration me:
   Site URL: `https://shivamkumarr9040-hub.github.io/Love-msg/`
   Redirect URLs me bhi wahi link add karo.

### 3. GitHub repo me dalo
Repo: `shivamkumarr9040-hub/Love-msg` (dost ka repo — upload dost ko karna hai,
ya dost tumhe collaborator banaye).
GitHub website > Add file > Upload files > is folder ki 3 files
(`index.html`, `style.css`, `app.js`) drag karo > Commit changes.
`index.html` root me hona chahiye.

### 4. Local run
```bash
python -m http.server 8000
# phir kholo: http://localhost:8000
```
Google login ke liye http/https chahiye, `file://` par Google redirect kaam nahi karega.

### 5. Live link (GitHub Pages)
Repo > Settings > Pages > Branch: `main`, Folder: `/(root)` > Save.
1–2 minute me live: `https://shivamkumarr9040-hub.github.io/Love-msg/`

## Test (verified 2026-11-18)

Headless Chromium, `node test-login.mjs` (server: `python -m http.server 8000`):
iPhone + login form visible, setup hint shown, Sign in / Google / Create account
par placeholder config me honest error + button wapas enable, login ke baad
phone ke andar signed-in screen + Logout wapas login par le jata hai.
**Console errors: 0.**
Real Supabase login (asli account se) abhi test nahi hua — uske liye keys
dalne ke baad ek baar signup + login karke dekhna hoga.
