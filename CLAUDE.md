# APBites

Food pre-ordering inside APSpace (APU's student app). Students order and pay with APCard, pick a 10-minute pickup slot, and collect by showing a QR that the stall scans. Built for the APU Cloud Innovation Hackathon 2026 (submission 10 Nov 2026, 23:59 MYT).

Full spec: see the Spec page in the team Notion.

## Stack

- Frontend: React + Vite, one app with two route groups: `/student/*` and `/stall/*`
- Hosting: Vercel (frontend and server functions), same pattern as lepak.gg
- Database: Cloud Firestore with live listeners (`onSnapshot`), Firebase Spark (free) plan. No Cloud Functions, so no Blaze
- Server: Vercel functions in `/api` (Node.js), logic in `/server`, Firestore via firebase-admin
- AI: Gemini API, called ONLY from server functions (`/api`)
- No login: a fixed sample student (`students/TP000000`) stands in for APSpace identity

## Repo layout

```
/web            React app
  /src/student  APSpace dashboard clone, stalls, menu, cart, checkout, status, pickup QR
  /src/stall    stall screen: orders, status buttons, QR scanner, stats
  /src/shared   Firestore client, types, UI components, design tokens
/api            Vercel functions, one file per endpoint (thin wrappers)
/server         shared logic used by /api, /web and /seed: orders, suggest, search, usual, timetable, clock
/seed           sample data (stalls, menus, student) and the seed script
firestore.rules
firebase.json   Firestore rules + emulator only
vercel.json
```

## Commands

```
npm run emulators                # Firestore emulator (Windows: see README for the Java temp-dir fix)
npm run seed                     # load sample data into the emulator
npm run dev                      # web app; Vite also runs /api handlers against the emulator
npm test                         # server tests (order tests need the emulator running)
npm run deploy:rules             # deploy Firestore rules (works on Spark)
vercel deploy                    # deploy web + /api
```

## Server functions (/api)

- `place-order` (placeOrder): validates cart (one stall), checks and books the slot in a transaction, deducts APCard or records FPX, creates the order
- `mark-ready` (markReady): sets status ready, creates a signed single-use `pickupToken` and `tokenExpiresAt`
- `verify-pickup` (verifyPickup): called by the stall scanner; checks token, stall, status and expiry, then sets collected
- `parse-order-text` (parseOrderText): Gemini turns plain words (any language) into matching menu items for the student to confirm
- `sync-timetable`: refreshes the timetable from APU's public feed (lecturer data dropped) or the sample generator
- Plain rules, no AI, in `/server` and run in the browser: `findUsual` (most-ordered item), `suggestSlot` (earliest open slot leaving 30 min to eat before the next class)

## Data model (Firestore)

- `students/{tpNumber}`: name, intake, apcardBalance, timetable[]
- `stalls/{stallId}`: name, cuisine, location, openHours, slotCapacity, prepMinPerOrder, isOpen
- `stalls/{stallId}/menuItems/{itemId}`: name, description, priceRM, tags[], available
- `orders/{orderId}`: orderNo, studentId, studentName, stallId, stallName, items[] (copied name and price), totalRM, date, pickupSlot, dining, payMethod, payStatus, payRef, status, pickupToken, tokenExpiresAt, collectedAt, createdAt
- `config/app`: demoTime, timetableSource, intake, slotMinutes, slotTimes[], qrValidMinutesAfterSlot. `config/counters`: orderNo
- `slots/{stallId_date_time}`: stallId, date, time, booked, capacity

Order status: `new` -> `preparing` -> `ready` -> `collected` (or `uncollected` after QR expiry).

## Business rules (do not change without the team)

- Slots are 10 minutes, max 5 pre-orders per stall per slot, enforced server-side
- One stall per cart
- Prepaid only (APCard or FPX); block APCard if balance < total
- Stall sets preparing and ready; only a valid QR scan sets collected
- Pickup QR: one per order, single-use, server-signed, expires 30 min after the slot, contains no personal data

## Rules for writing code

- Never call Gemini or hold API keys in the browser. All secrets live in Vercel env vars (server only, never `VITE_`).
- Clients may READ orders, slots and stalls but never WRITE orders, slots or balances. Writes go through `/api`. Keep `firestore.rules` in line with this.
- Every Gemini feature has a non-AI fallback (keyword search) so the demo never breaks.
- Gemini output is a suggestion only; the student confirms every cart change. Never claim food is allergen-free.
- Use sample data only. Never put real student names, TP numbers or photos in the repo.
- Money is stored as numbers in RM with 2 decimals; format as `RM12.90`.
- Times are Asia/Kuala_Lumpur.
- Call the wallet APCard, never APWallet.

## UI (match APSpace)

- Background #000000, cards #191919, accent #6D54D4, small accent text #A897F5, muted text #949494
- Font Roboto; card and tile radius 15px; card titles 20px/500 in accent; tile labels 16px/900 white
- Dark theme only. Buttons at least 44px tall. Mobile-first for the student app; the stall screen is tablet landscape.

## Out of scope

Real APSpace or APCard integration, seat finding, crowd tracking, menu-from-photo, admin panel, physical hardware.
