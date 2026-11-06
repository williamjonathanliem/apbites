# APBites

Food pre-ordering inside APSpace. Order between classes, pay with APCard, pick a 10-minute pickup slot, collect by showing a QR the stall scans.

APU Cloud Innovation Hackathon 2026 · Smart Campus and Student Experience.

- Live demo: _not deployed yet_
- Student app: `/student` (phone) · Stall screen: `/stall` (tablet, landscape)

## Run locally

Needs Node 22+, Java 21+ (for the Firestore emulator) and the Firebase CLI.

```bash
npm install -g firebase-tools
npm install
npm --prefix web install
```

Start the Firestore emulator (UI at http://127.0.0.1:4000):

```bash
npm run emulators
```

In a second terminal, load the sample data and start the app:

```bash
npm run seed
npm run dev
```

Open http://localhost:5173/student. `npm run dev` also serves the `/api` functions (Vite runs the same files Vercel runs, against the emulator), so no Vercel login is needed locally.

`npm run seed` wipes and reloads everything, dated today. Rerun it before each demo.

`npm test` runs the server tests. The order tests (slot race, APCard, FPX) need the emulator running and seeded.

## How it fits together

- **Firestore** (Firebase, free Spark plan): the data. Both apps listen live, so new orders and status changes appear without refresh. Clients can only read (`firestore.rules`).
- **`/api`** (Vercel functions): every write, such as placing an order, booking a slot, taking APCard payment and, later, the pickup QR and Gemini. Logic lives in `/server`.
- **`/web`** (React + Vite on Vercel): `/student` and `/stall`.

### Windows: Firestore emulator exits with "failed to open a new selector"

Java can't create its socket if your temp path contains `'` (for example `C:\Users\William's`). Point Java at a plain folder before starting the emulators (PowerShell):

```powershell
New-Item -ItemType Directory -Force C:\apbites-tmp | Out-Null
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\apbites-tmp -Djava.io.tmpdir=C:\apbites-tmp"
firebase emulators:start --project demo-apbites
```

## Demo settings (`config/app` in Firestore, set by `seed/data.js`)

| Key | Default | What it does |
| --- | --- | --- |
| `demoTime` | `13:15` | Pins the time of day so the demo works at any hour. `null` = real time |
| `timetableSource` | `sample` | `sample` = generated timetable with a 14:30 class today. `apu` = APU's public timetable feed |
| `intake` | `APD2F2609SE` | Intake used for the `apu` timetable |
| `slotTimes` | 13:30, 13:40, 13:50, 14:00 | Pickup slots offered |

### Timetable

APSpace's timetable comes from APU's public feed (`https://s3-ap-southeast-1.amazonaws.com/open-ws/weektimetable`, no login). `POST /api/sync-timetable` pulls it for one intake and keeps only module, room and times; lecturer names and emails are dropped. If the feed fails or has no classes, it falls back to the sample generator. The demo uses `sample` so there is always a class at 14:30.

## Deploy

Everything stays on free tiers: Firebase Spark for Firestore, Vercel Hobby for the web app and `/api`.

1. Create a Firebase project (Spark) with Firestore in `asia-southeast1`.
2. Deploy the rules: `firebase login`, `firebase use --add` (pick the project), `npm run deploy:rules`.
3. Firebase console → Project settings → Service accounts → Generate new private key.
4. Import the repo in Vercel and set the environment variables:

| Variable | Value |
| --- | --- |
| `FIREBASE_PROJECT_ID` | your project id |
| `FIREBASE_SERVICE_ACCOUNT` | the private key JSON, whole file on one line (server only) |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | from the Firebase web app config (safe in the browser) |
| `VITE_USE_EMULATORS` | `false` |

5. Seed the real project once: set `GOOGLE_APPLICATION_CREDENTIALS` to the key file, then `node seed/seed.js --prod <projectId>`.

## Sample data

All stalls, prices, students and orders are invented. Sample student: `TP000000`, SAMPLE STUDENT, APCard RM50.00. Hana Japanese Kitchen is the main demo stall; its 13:30 slot is seeded full.
