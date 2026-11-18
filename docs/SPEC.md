# Walk-in Kiosk — Build Spec & Iteration Plan

Nov 18, 2026 · @Sarbaz

## How to use this document

Build the app in seven parts (0–6), one part per coding session. Parts 1 and 2 run on fake data, so you can start coding before Setmore approves API access.

1. Export this doc as Markdown and save it in your repo as `docs/SPEC.md`. When a decision changes, update the spec. The spec is the source of truth, not the chat history.
2. Start every AI coding session by pasting the **Master context prompt** (Appendix). It tells the agent to read `docs/SPEC.md` and build only the current part.
3. Paste the prompt for the part you're on (Build plan). Bigger parts have 2–3 prompts: send one, test, then send the next.
4. Check the part's **Done when** list yourself before moving on. Commit after every working step, so you always have a save point to roll back to.
5. If the agent wants to add a library, a database or a screen that isn't in this spec, say no, or update the spec first.

Sections 1–12 describe **what** to build. The Build plan says **in what order**. Anything marked **VERIFY** is a fact to confirm against Setmore's official docs before you rely on it.

| Part | What you build | Needs Setmore API access? |
| --- | --- | --- |
| 0 | Accounts, API access request, empty repo | Request only |
| 1 | Kiosk screens on mock data | No |
| 2 | Slot engine, unit tests, API routes (mock) | No |
| 3 | Live Setmore integration | Yes |
| 4 | Kiosk hardening: security, errors, idle reset | Yes |
| 5 | Polish, deploy, pilot week | Yes |
| 6+ | Backlog of optional features | Depends |

## 1. Overview

The kiosk lets a walk-in book the next free time on an iPad in about 15 seconds and writes it straight into the barber's Setmore calendar, so she never has to track who came in first.

**Client:** Jaribu Barbershop Ltd, Carrington, Calgary. One barber, open daily 10:00–21:00. Today all bookings live in Setmore: online bookings plus phone bookings she enters herself.

**Problem:** Walk-ins either book themselves on the Setmore page (slow, many steps) or she has to remember who walked in first while she's cutting hair.

**Solution:** An iPad at the door runs a web app. A walk-in picks a service and sees only today's open start times, with Setmore appointments and earlier walk-ins already excluded. They enter a first name and phone number and tap Book. The app creates a normal Setmore appointment, which shows up in her Setmore app like any other booking. She doesn't have to do anything.

**In scope (v1)**

- Today-only booking for one barber (one Setmore staff member)
- Up to 6 service buttons, each mapped to a Setmore service
- Open start times calculated from Setmore appointments, her hours and the service length
- Each booking written to Setmore (a customer plus an appointment)
- A fallback message when Setmore can't be reached
- A QR code to her Setmore page for booking another day

**Out of scope (v1)**

- Our own database: Setmore is the only source of truth
- A barber dashboard: she keeps using Setmore
- Payments, customer accounts, cancelling from the kiosk, multiple barbers, booking future days
- Our own text messages: Setmore's confirmations and reminders, if she has them on, cover this

**Design principles**

1. **Fewest screens, fewest fields.** Each screen does one thing. A new field or screen needs a strong reason.
2. **Setmore is the single source of truth.** We never store appointments ourselves.
3. **Calm over clever.** Black, white and one accent colour, big type, no animation beyond a short fade.
4. **Fail safe.** If anything breaks, the kiosk says "Please let the barber know you're here." The shop never stops working.
5. **Config over code.** Shop-specific values (name, hours, services) live in one config file, so a second shop is a new config, not a new app.

## 2. User flows

The walk-in is the only person who uses the kiosk. The barber keeps working from her Setmore calendar exactly as she does today.

**Walk-in: happy path**

1. **Welcome** → tap "Book a walk-in".
2. **Service** → tap a service, e.g. "Skin fade · $45".
3. **Time** → the app loads today's open start times for that service. The earliest is highlighted, and "Now" appears if she's free right now. Tap one.
4. **Details** → a summary at the top ("Skin fade · 2:15 PM"), then first name and phone number (10 digits). Tap "Book 2:15 PM".
5. The server checks the time is still free, then creates the Setmore customer and appointment.
6. **Done** → "You're booked, Carlos." The kiosk goes back to Welcome after 10 seconds.

**Barber**

- Sees the new appointment in her Setmore app, marked "Walk-in (kiosk)" in its notes.
- Serves customers in Setmore's time order, as she does now.
- Blocks breaks in Setmore (see Configuration for the backup option).

**Customers with appointments** (booked online or by phone) don't use the kiosk. The Welcome screen tells them: "Have an appointment? Just have a seat."

**When things go wrong**

| Situation | What the kiosk does |
| --- | --- |
| No open times left today | Time screen: "No walk-in times left today." plus the QR code to book another day |
| Before opening, after the walk-in cut-off, or walk-ins switched off | Welcome: "Walk-ins are closed right now." plus the QR code. The Book button is hidden. |
| The time is taken between choosing and booking | Back to Time with fresh times and the note "That time was just taken. Please pick another." |
| Setmore can't be reached, or any server error | Error screen: "Something went wrong. Please let the barber know you're here." Returns to Welcome after 15 s. |
| Customer walks away mid-flow | After 60 s with no taps, reset to Welcome. Nothing is booked. |
| Double tap on Book | The button disables after the first tap. The server treats the same phone + same start time as one booking. |
| Wi-Fi drops | A "Reconnecting…" banner shows, and Book stays disabled until the connection is back. |

## 3. Screens and copy

The kiosk has five screens (Welcome, Service, Time, Details, Done) plus one Error screen. It's designed for an iPad in portrait and also works in landscape. The wording below is final copy: use it as written.

**On every screen**

- A back arrow at the top left (not on Welcome or Done), at least 64 px tall.
- After 60 s with no taps, the kiosk returns to Welcome.
- If the connection drops, a thin "Reconnecting…" banner shows at the top.

### Welcome

```
┌──────────────────────────────────────┐
│                                      │
│  JARIBU BARBERSHOP                   │
│                                      │
│  Walk in?                            │
│  Book the next free time.            │
│                                      │
│  ┌────────────────────────────────┐  │
│  │       Book a walk-in      →      │  │
│  └────────────────────────────────┘  │
│                                      │
│  Have an appointment?                │
│  Just have a seat.                   │
│                                      │
│  ──────────────────────────────────  │
│  [QR]  Book another day              │
│        Scan with your phone camera   │
└──────────────────────────────────────┘
```

When walk-ins are closed, the button is hidden and the headline changes:

- Before opening: "Walk-ins open at 10:00 AM."
- After the cut-off, or when switched off in config: "Walk-ins are closed for today."

The QR code and "Book another day" stay visible.

### Service

```
← Back

What are you getting?

┌─────────────────┐  ┌─────────────────┐
│ Haircut         │  │ Skin fade       │
│ $35             │  │ $45             │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│ Buzz cut        │  │ Beard & line-up │
│ $25             │  │ $30             │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│ Kids (5–10)     │  │ Seniors 65+     │
│ $30             │  │ $30             │
└─────────────────┘  └─────────────────┘

Something else? Please ask the barber.
```

The six buttons, taken from her Setmore booking page (confirm the list with her before Part 1):

| Button label | Setmore service | Price | Length |
| --- | --- | --- | --- |
| Haircut | Barber basic | $35 | 30 min |
| Skin fade | Skin fade | $45 | 45 min |
| Buzz cut | Buzz cut | $25 | 15 min |
| Beard & line-up | Beard trim & line-up | $30 | 23 min |
| Kids (5–10) | Kids haircut (ages 5–10) | $30 | 20 min |
| Seniors 65+ | Seniors 65+ and very fine hair | $30 | 20 min |

From Part 3 on, price and length are read from Setmore. The table above is the mock data for Parts 1–2.

### Time

```
← Skin fade · $45

Pick a time today

┌──────────┐ ┌──────────┐ ┌──────────┐
│   Now    │ │ 2:15 PM  │ │ 3:15 PM  │
└──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│ 4:30 PM  │ │ 5:15 PM  │ │ 6:00 PM  │
└──────────┘ └──────────┘ └──────────┘

Times shown are free on today's schedule.
```

- The first (earliest) option uses the filled accent style. All others are outlined.
- "Now" appears only when the slot engine says she's free right away (section 8).
- Loading: the grid shows six grey placeholder boxes and "Checking today's schedule…".
- No times: "No walk-in times left today." plus the QR code to book another day.

### Details

```
← Back

Skin fade · Today 2:15 PM

First name
┌──────────────────────────────┐
│ Carlos                       │
└──────────────────────────────┘
Phone number
┌──────────────────────────────┐
│ (403) 555-0123               │
└──────────────────────────────┘
For your booking confirmation.

┌──────────────────────────────┐
│         Book 2:15 PM         │
└──────────────────────────────┘
```

- **First name:** 1–30 characters (letters, spaces, hyphens, apostrophes). Auto-capitalize the first letter.
- **Phone:** 10 digits, formatted as typed: (403) 555-0123. Use `inputMode="tel"`.
- The Book button stays disabled until both fields are valid. While booking it reads "Booking…" and can't be tapped again.
- If "Now" was picked, the summary reads "Skin fade · Now" and the button reads "Book now".

### Done

```
✓

You're booked, Carlos.
Skin fade · 2:15 PM

Please be back by 2:10 PM.
Feel free to step out until then.
```

- For "Now": "You're next, Carlos. Have a seat."
- "Back by" time = start time minus 5 minutes.
- Returns to Welcome after 10 s, or straight away on any tap.

### Error

```
Something went wrong.
Please let the barber know you're here.

[ Back to start ]
```

Returns to Welcome after 15 s.

**Copy rules:** sentence case, times written as "2:15 PM", prices in whole dollars, no exclamation marks, no jargon.

## 4. Design system

Black on white, one typeface, big touch targets and almost no decoration. People read the kiosk at arm's length while standing, so nothing is smaller than 16 px and nothing tappable is shorter than 72 px.

**Colour tokens**

| Token | Hex | Use |
| --- | --- | --- |
| `bg` | #FFFFFF | Page background |
| `surface` | #F5F5F4 | Option tiles, input fields, loading placeholders |
| `line` | #E7E5E4 | Borders, dividers |
| `ink` | #0C0A09 | Text, primary button fill, selected tile, focus ring |
| `muted` | #57534E | Secondary text (prices, hints) |
| `danger` | #B91C1C | Field errors only |

The only "accent" is `ink`: the primary action is a filled black button with white text. A brand colour can be added later as one extra token.

**Type:** Inter, loaded with `next/font`, falling back to `system-ui`.

| Style | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| Display | 48 / 56 | 600 | Welcome headline, Done headline |
| Title | 36 / 44 | 600 | Screen titles |
| Large | 24 / 32 | 500 | Buttons, tile labels, inputs |
| Body | 20 / 28 | 400 | Body text |
| Small | 16 / 24 | 400 | Hints, QR caption (the minimum size) |

**Spacing and shape:** 8 px grid (8, 16, 24, 32, 48, 64). Page padding is 48 px, with 16 px between tiles. Buttons and tiles use 16 px corners, inputs 12 px.

**Touch targets**

- Primary button: full width, 88 px tall.
- Service tile: 2-column grid, at least 112 px tall.
- Time tile: 3-column grid, at least 80 px tall.
- Inputs: 72 px tall, 24 px text.
- Back arrow: 64 × 64 px hit area.

**Components** (build these once in `components/ui`, reuse everywhere):

- `Button`: variants `primary` (filled ink), `secondary` (outlined), `ghost` (back arrow).
- `OptionTile`: a service or time choice; `selected` / `highlight` state = filled ink.
- `TextField`: label above, hint or error below.
- `Screen`: the page wrapper (padding, back slot, title slot).
- `Banner`: the "Reconnecting…" bar.
- `QrBlock`: QR code plus "Book another day" text.

**Motion:** a 150 ms opacity fade between screens and a 0.98 scale on press. Nothing else. Respect `prefers-reduced-motion`.

**Icons:** only a back arrow and a check mark, drawn as inline SVG. No icon library.

**Not in v1:** dark mode (it's a lit shop), other languages, a custom on-screen keyboard (the iOS keyboard is fine).

Starting theme for `app/globals.css` (Tailwind v4):

```css
@import "tailwindcss";

@theme {
  --color-bg: #ffffff;
  --color-surface: #f5f5f4;
  --color-line: #e7e5e4;
  --color-ink: #0c0a09;
  --color-muted: #57534e;
  --color-danger: #b91c1c;
  --radius-tile: 16px;
  --radius-field: 12px;
  --font-sans: var(--font-inter), system-ui, sans-serif;
}

html, body { background: var(--color-bg); color: var(--color-ink); }
/* kiosk: no text selection, no callouts, no rubber-band scroll */
body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; overscroll-behavior: none; }
input { -webkit-user-select: text; user-select: text; }
```

## 5. Architecture

There are two boundaries: the iPad only calls our own API routes, and only the server-side Setmore adapter holds the token and talks to Setmore. Everything else is plain, testable code.

&#91;embedded content: architecture · iPad, our server, Setmore\]

The highlighted adapter is the only piece that knows Setmore exists. Swapping mock for live changes nothing else.

**Where state lives:** only in Setmore (appointments, customers) and in config + env vars (shop settings, secrets). The kiosk page only holds which screen is showing.

**One booking, step by step**

1. The kiosk loads: `GET /api/status` (open?) and `GET /api/services`.
2. The customer taps a service: `GET /api/slots?service=…`. The server fetches today's busy times through the adapter (always fresh), runs `findSlots` and returns up to 6 times.
3. The customer enters their details and taps Book: `POST /api/book`.
4. The server validates the input, checks the shop is open, fetches busy times again, checks `fits(start)` and the duplicate rule, then calls `createBooking` (customer first, then appointment).
5. Setmore stores the appointment. It appears in her Setmore app and blocks that time on her online booking page.
6. The server returns success, and the kiosk shows Done.

## 6. Tech stack

One Next.js project on Vercel holds both the kiosk pages and the small backend. There's no database and no separate server to look after.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (latest stable, App Router) + TypeScript | Pages and API routes in one project. The Setmore token stays on the server. AI coding tools know it well. |
| Runtime | Current Node.js LTS | Required by Next.js. |
| Styling | Tailwind CSS v4 | All design tokens in one file, no separate CSS to maintain. |
| Dates and time zones | Luxon | Every time is handled in `America/Edmonton` explicitly, which avoids UTC bugs. |
| Validation | Zod | Checks API inputs and Setmore's responses. |
| Tests | Vitest | Unit tests for the slot engine, the riskiest logic. |
| QR code | `react-qr-code` | Draws the "Book another day" QR from the URL in config, as an SVG. |
| Hosting | Vercel | Deploys on every `git push`, stores secrets as environment variables, shows logs. |
| Uptime check | UptimeRobot or Better Stack (free tier) | Pings `/api/health` and emails you when the kiosk backend is down. |

**Deliberately not used:** a database, an auth library, a state-management library, a UI component kit, an icon library, CSS-in-JS. Each would add code to maintain without solving a v1 problem.

**Hosting plan:** Vercel's free Hobby plan is for personal, non-commercial use only. Commercial projects need Pro at $20 per seat per month ([Vercel pricing comparison](https://modelence.com/compare/vercel-pricing), [terms excerpt](https://conductatlas.com/platform/vercel/vercel-terms-of-service/provision/CA-P-048642/hobby-plan-personal-non-commercial-use-only/)). Building a prototype on Hobby is fine, but move to Pro once the product is commercial ([Vercel community answer](https://community.vercel.com/t/is-hobby-plan-suitable-for-a-saas-prototype/7205)). Plan: build Parts 1–4 on Hobby, upgrade to Pro before the pilot in Part 5. One Pro seat can host every future shop, so this cost is shared across clients.

## 7. Setmore integration

The app talks to Setmore through one small adapter with three jobs: list services, list today's busy times, and create a booking. Everything else in the app depends only on that adapter, so it runs on mock data until API access arrives.

**Access (from [Setmore's support article](https://support.setmore.com/en/articles/579360-request-access-to-the-setmore-api))**

- API access needs a paid Setmore Pro account.
- You request access by emailing api@setmore.com with your name, the account email and your use case (draft in the Appendix). There's no stated review time.
- Authentication is OAuth 2.0. Docs are on Apiary and at developers.setmore.com.
- There's **no sandbox**: every call hits a live account. Develop against a separate test Setmore account, never her real calendar.
- Rate limits apply but aren't published. The kiosk only calls Setmore when a customer taps, so volume stays low.

**Authentication flow (VERIFY against the docs)**

1. After approval, you get a long-lived **refresh token**. Store it only in the `SETMORE_REFRESH_TOKEN` environment variable.
2. The server exchanges it for a short-lived **access token** and sends that as `Authorization: Bearer <token>`.
3. Keep the access token in server memory until about 60 s before it expires. On a `401`, refresh once and retry once.

**Endpoints we expect to use (VERIFY each one)**

The paths below come from community integrations, such as [Pipedream's Setmore code](https://pipedream.com/apps/setmoreappointments/integrations/piped) and the community [setmore-sdk](https://socket.dev/npm/package/setmore-sdk). They are not official docs. Base URL: `https://developer.setmore.com/api/v1`.

| Purpose | Expected call | When it's used |
| --- | --- | --- |
| Access token | `GET /o/oauth2/token?refreshToken=…` | Server start, then on expiry |
| Staff list | `GET /bookingapi/staffs` | Once, in Part 0, to find her `staff_key` |
| Services | `GET /bookingapi/services` | Service screen (cached 10 min) |
| Appointments for a day | `GET /bookingapi/appointments?startDate=…&endDate=…` | Every Time screen load and before every booking |
| Available slots (may exist) | `POST /bookingapi/slots` | If it exists, compare with our engine in Part 3 |
| Create customer | `POST /bookingapi/customer/create` | On Book |
| Create appointment | `POST /bookingapi/appointment/create` | On Book |

The community SDK creates appointments with `staff_key`, `service_key`, `customer_key`, `start_time`, `end_time` and `cost`. Expect those field names, but confirm them.

**Probe script (do this as soon as access is approved):** `scripts/setmore-probe.ts` calls each read endpoint on the test account and saves the raw JSON to `fixtures/setmore/*.json`, with names and phone numbers replaced by fake ones. The AI agent then writes types and mapping from real responses instead of guesses. Questions the probe answers:

- [ ] What date and time format do appointments use, and which time zone?
- [ ] How are cancelled appointments marked? (Exclude them from busy times.)
- [ ] Does blocked time or a break show up in the API? If not, use the config fallback (section 10).
- [ ] Which customer fields are required? Is last name required? Is email required?
- [ ] Is there a slots endpoint, and does it respect her hours and breaks?
- [ ] Can customers be looked up by phone number? (Backlog: reuse existing customers.)

**Adapter interface** (`lib/setmore/types.ts`):

```ts
import type { DateTime } from "luxon";

export type Service = {
  key: string;          // Setmore service_key
  name: string;
  durationMin: number;
  priceCents: number;
};

export type Busy = {
  start: DateTime;      // always in America/Edmonton
  end: DateTime;
  source: "appointment" | "block";
};

export type BookingInput = {
  serviceKey: string;
  start: DateTime;
  end: DateTime;
  firstName: string;
  phone: string;        // E.164, e.g. +14035550123
};

export interface SetmoreClient {
  listServices(): Promise<Service[]>;
  listBusy(date: string): Promise<Busy[]>;   // date = "YYYY-MM-DD" in America/Edmonton
  createBooking(input: BookingInput): Promise<{ appointmentKey: string }>;
}
```

Two implementations, picked by `SETMORE_MODE`:

- `MockSetmoreClient` (`lib/setmore/mock.ts`): in-memory, seeded with 4 appointments today, 300 ms fake delay. `MOCK_FAIL=taken` makes the next booking hit a "slot taken" race; `MOCK_FAIL=down` makes every call fail.
- `LiveSetmoreClient` (`lib/setmore/live.ts`): real HTTP calls, with an 8 s timeout per request.

**Mapping rules**

- Convert every Setmore time to a Luxon `DateTime` in `America/Edmonton` inside the adapter. Nothing outside the adapter sees Setmore's format.
- Busy = all non-cancelled appointments for her staff key, plus blocked time if the API exposes it.
- Customer: `first_name` = the typed name. If last name is required, send "Walk-in". Phone in the format Setmore expects (check fixtures).
- Appointment: cost = service price. Add the note "Walk-in (kiosk)" in whatever comment or label field exists, so she can tell kiosk bookings apart.

**Errors**

- `401`: refresh the token once, retry once, then show the error screen.
- `429`, `5xx` or timeout on a read: show the error screen. Never loop.
- Timeout on **create**: never retry blindly, since that could double-book. Fetch the appointments again. If a booking with this phone at this start time exists, treat it as success. If not, show the error screen.
- Log every Setmore error on the server (status, endpoint, duration), but never log names or phone numbers.

## 8. Slot engine

The slot engine is one pure function: it takes today's busy times, her hours, the service length and the current time, and returns up to six start times that don't clash with anything. It never calls Setmore itself, which makes it easy to test.

```ts
// lib/slots/engine.ts
import type { DateTime } from "luxon";
import type { Busy } from "@/lib/setmore/types";

export type SlotOptions = {
  now: DateTime;             // America/Edmonton
  open: DateTime;            // today's opening time
  close: DateTime;           // today's closing time; a booking must END by this
  lastStart: DateTime;       // latest time a walk-in may START (config)
  durationMin: number;
  bufferMin: number;         // clean-up gap kept after every booking (default 5)
  stepMin: number;           // grid for start times (default 15)
  leadMin: number;           // minimum minutes from now for a grid time (default 10)
  maxOptions: number;        // default 6
  busy: Busy[];
};

export type Slot = { start: DateTime; end: DateTime; isNow: boolean };

export function fits(start: DateTime, o: SlotOptions): boolean;
export function findSlots(o: SlotOptions): Slot[];
```

**Rules**

1. **Closed means no slots.** If `now` is before `open` or after `lastStart`, return `[]`.
2. **A start time fits** when all of these hold:
   - `start >= open` and `start <= lastStart`
   - `end = start + durationMin`, and `end <= close`
   - for every busy block `b`: `start >= b.end + buffer` **or** `end + buffer <= b.start`
3. **"Now":** round `now` up to the next 5 minutes (14:02 → 14:05). If that time fits, it's the first option, with `isNow: true`.
4. **Grid times:** every `stepMin` boundary, starting at `now + leadMin` rounded up to the grid (14:02 + 10 → 14:15), through `lastStart`.
5. **Right-after times:** for each busy block, `b.end + buffer` rounded up to the next 5 minutes. These catch gaps the 15-minute grid would miss. For example, an appointment ending at 14:45 makes 14:50 a candidate.
6. Merge the candidates, remove duplicates, sort, keep those that fit and return the first `maxOptions`. "Now" counts as one of the six.

At booking time, the API calls `fits()` again with freshly fetched busy times, so a start that was valid a minute ago but is now taken gets rejected.

**Breaks:** if Setmore's API doesn't return her blocked time, breaks from config (section 10) are added to `busy` with `source: "block"` before calling the engine.

**Do all time maths with Luxon in `America/Edmonton`** (`DateTime.plus`, `startOf`), never with raw milliseconds or `new Date()` strings. That keeps daylight-saving days correct.

**Unit tests** (`lib/slots/engine.test.ts`): all on a fixed date, hours 10:00–21:00, `lastStart` 20:30, buffer 5, step 15, lead 10, max 6.

| # | Setup | Expected |
| --- | --- | --- |
| 1 | Empty day, now 10:00, 30 min | Now (10:00), 10:15, 10:30, 10:45, 11:00, 11:15 |
| 2 | Appointment 14:30–15:15, now 14:00, 45 min | No Now. First slot 15:20 |
| 3 | Same appointment, now 14:00, 15 min | Now (14:00) fits, since it ends 14:15 and +5 buffer is still before 14:30 |
| 4 | Appointment ends 14:30, now 14:20, 30 min | No slot starts before 14:35 |
| 5 | Appointments 14:00–14:45 and 15:30–16:00, now 14:40, 30 min | First slot 14:50 (a right-after time). 15:00 is excluded. Next slots from 16:05 |
| 6 | Now 20:20, 45 min | `[]`, because it would end after 21:00 |
| 7 | Now 20:20, 30 min | Now (20:20) and 20:30 |
| 8 | Now 20:45 | `[]` (past `lastStart`) |
| 9 | Now 09:30 | `[]` (before opening) |
| 10 | Now 14:02, empty afternoon | Now starts 14:05; first grid time is 14:15 |
| 11 | Long empty day | Never more than 6 slots |
| 12 | A daylight-saving day (e.g. 2027-03-14), now 10:00 | Same results as on a normal day |
| 13 | Busy block from a config break 13:00–13:30, now 12:40, 30 min | No slot between 12:40 and 13:35 |

## 9. API routes

The kiosk page talks only to these five routes on our own server, never to Setmore directly. Every response sends `Cache-Control: no-store`. From Part 4 on, every route except `/api/health` requires the kiosk cookie.

| Route | Purpose | Success response |
| --- | --- | --- |
| `GET /api/status` | Is the kiosk open for walk-ins right now? Polled every 60 s. | `{ "state": "open" }`, `{ "state": "before_open", "opensAt": "10:00 AM" }` or `{ "state": "closed" }` |
| `GET /api/services` | The service buttons | `{ "services": [{ "id": "skin-fade", "label": "Skin fade", "priceLabel": "$45", "durationMin": 45 }] }` |
| `GET /api/slots?service=skin-fade` | Today's open start times | `{ "date": "2026-11-18", "slots": [{ "start": "2026-11-18T14:15:00-07:00", "label": "2:15 PM", "isNow": false }] }` |
| `POST /api/book` | Create the booking | `{ "ok": true, "firstName": "Carlos", "serviceLabel": "Skin fade", "startLabel": "2:15 PM", "backByLabel": "2:10 PM", "isNow": false }` |
| `GET /api/health` | Uptime check | `{ "ok": true, "mode": "live", "setmore": "ok" }` (Setmore check cached 5 min) |

Service `id` is the kiosk button id from config. Setmore keys stay on the server.

**`POST /api/book` request body**

```json
{
  "service": "skin-fade",
  "start": "2026-11-18T14:15:00-07:00",
  "firstName": "Carlos",
  "phone": "4035550123"
}
```

**What `/api/book` does, in order**

1. Validate the body with Zod: known service, `start` is today in `America/Edmonton`, name matches the rules in section 3, phone is 10 digits (converted to `+1XXXXXXXXXX`).
2. Check `/api/status` logic says `open`.
3. Fetch busy times fresh and call `fits(start)`. If it doesn't fit, return `409 SLOT_TAKEN` with fresh slots.
4. Duplicate check: if an appointment already exists at this start with this phone, return success without booking again.
5. Call `createBooking`. On timeout, follow the create-timeout rule in section 7.
6. Return the success body.

**Errors:** every error is `{ "error": "<CODE>", "message": "<for logs, not shown to customers>" }`.

| Status | Code | Kiosk shows |
| --- | --- | --- |
| 400 | `INVALID_INPUT` (+ `fields`) | Field errors on Details |
| 403 | `NOT_A_KIOSK` | Error screen |
| 409 | `SLOT_TAKEN` (+ `slots`) | Time screen with fresh times and "That time was just taken. Please pick another." |
| 423 | `CLOSED` | Welcome in its closed state |
| 502 | `UPSTREAM` | Error screen |

## 10. Configuration and environment variables

Everything specific to Jaribu lives in `config/shop.ts`, and every secret lives in environment variables. A second shop later means a new config file plus new env vars. No code changes.

```ts
// config/shop.ts
export const shop = {
  name: "Jaribu Barbershop",
  timezone: "America/Edmonton",
  walkInsEnabled: true,          // false = kiosk shows "closed for today"

  // 24h "HH:mm". null = closed all day. lastStart = latest walk-in START time.
  hours: {
    mon: { open: "10:00", close: "21:00", lastStart: "20:30" },
    tue: { open: "10:00", close: "21:00", lastStart: "20:30" },
    wed: { open: "10:00", close: "21:00", lastStart: "20:30" },
    thu: { open: "10:00", close: "21:00", lastStart: "20:30" },
    fri: { open: "10:00", close: "21:00", lastStart: "20:30" },
    sat: { open: "10:00", close: "21:00", lastStart: "20:30" },
    sun: { open: "10:00", close: "21:00", lastStart: "20:30" },
  },

  // Fallback only if Setmore's API doesn't return blocked time.
  // e.g. { days: ["mon", "tue"], start: "13:00", end: "13:30" }
  breaks: [] as { days: string[]; start: string; end: string }[],

  slots: { stepMin: 15, bufferMin: 5, leadMin: 10, maxOptions: 6 },
  kiosk: { idleResetSec: 60, doneResetSec: 10, errorResetSec: 15, backByMin: 5 },

  bookingUrl: "https://jaribubarbershopltd.setmore.com/",  // QR code target

  // Order = order on screen. setmoreKey is filled in during Part 3 (from the probe).
  // mock = used only when SETMORE_MODE=mock.
  services: [
    { id: "haircut",   label: "Haircut",         setmoreKey: "", mock: { priceCents: 3500, durationMin: 30 } },
    { id: "skin-fade", label: "Skin fade",       setmoreKey: "", mock: { priceCents: 4500, durationMin: 45 } },
    { id: "buzz-cut",  label: "Buzz cut",        setmoreKey: "", mock: { priceCents: 2500, durationMin: 15 } },
    { id: "beard",     label: "Beard & line-up", setmoreKey: "", mock: { priceCents: 3000, durationMin: 23 } },
    { id: "kids",      label: "Kids (5–10)",     setmoreKey: "", mock: { priceCents: 3000, durationMin: 20 } },
    { id: "seniors",   label: "Seniors 65+",     setmoreKey: "", mock: { priceCents: 3000, durationMin: 20 } },
  ],
} as const;
```

Her hours come from her Setmore page (open daily, 10 AM–9 PM). The `lastStart` of 20:30 and the 5-minute buffer are suggestions: confirm both with her.

**Environment variables** (commit `.env.example` with blank values; never commit `.env.local`):

| Name | Example | Notes |
| --- | --- | --- |
| `SETMORE_MODE` | `mock` or `live` | `mock` for Parts 1–2 and local UI work |
| `SETMORE_BASE_URL` | `https://developer.setmore.com/api/v1` | Change it if the official docs say otherwise |
| `SETMORE_REFRESH_TOKEN` | (secret) | From Setmore after API approval. Server only. |
| `SETMORE_STAFF_KEY` | (from the probe) | Her staff key |
| `KIOSK_SECRET` | 64 random hex characters | Used once to register the iPad (Part 4). Generate with `openssl rand -hex 32`. |
| `MOCK_FAIL` | empty, `taken` or `down` | Development only: simulates failures in mock mode |

Use separate values for development (test Setmore account) and production (her account) in Vercel's environment settings.

## 11. Project structure

The kiosk is a single page with no URL changes. One `useReducer` moves between screens, so the iPad never navigates away and browser history can't get in the way.

```
walk-in-kiosk/
├─ app/
│  ├─ layout.tsx            # Inter font, globals, viewport (no pinch zoom)
│  ├─ globals.css           # Tailwind theme from section 4
│  ├─ page.tsx              # the kiosk: screen state machine
│  ├─ setup/route.ts        # Part 4: registers the iPad (sets the kiosk cookie)
│  └─ api/
│     ├─ status/route.ts
│     ├─ services/route.ts
│     ├─ slots/route.ts
│     ├─ book/route.ts
│     └─ health/route.ts
├─ components/
│  ├─ ui/                   # Button, OptionTile, TextField, Screen, Banner, QrBlock
│  └─ screens/              # Welcome, Service, Time, Details, Done, Error
├─ lib/
│  ├─ setmore/
│  │  ├─ types.ts           # adapter interface (section 7)
│  │  ├─ mock.ts
│  │  ├─ live.ts
│  │  └─ index.ts           # getSetmoreClient(): mock or live from SETMORE_MODE
│  ├─ slots/
│  │  ├─ engine.ts          # findSlots, fits (section 8)
│  │  └─ engine.test.ts
│  ├─ time.ts               # today(), "HH:mm" → DateTime, "2:15 PM" labels
│  ├─ hours.ts              # open / before_open / closed
│  ├─ validation.ts         # Zod schemas, phone → +1XXXXXXXXXX
│  └─ kiosk-auth.ts         # Part 4: cookie check
├─ config/shop.ts
├─ scripts/setmore-probe.ts
├─ fixtures/setmore/        # scrubbed sample responses
├─ docs/SPEC.md             # this document
├─ .env.example
└─ vitest.config.ts
```

**Kiosk state machine** (`app/page.tsx`):

```ts
type State =
  | { screen: "welcome" }
  | { screen: "service" }
  | { screen: "time"; serviceId: string; notice?: "taken" }
  | { screen: "details"; serviceId: string; slot: SlotDTO }
  | { screen: "done"; result: BookingResult }
  | { screen: "error" };
```

The idle timer resets on any tap and dispatches `{ type: "reset" }` back to `welcome`. Each screen component gets only the data and callbacks it needs.

## 12. Security and privacy

Two things must never happen: someone outside the shop books or wipes appointments, or the Setmore token leaks. The rules below prevent both while collecting as little personal data as possible.

**Secrets**

- The Setmore refresh and access tokens live only on the server. Never give an env var the `NEXT_PUBLIC_` prefix, and never send a token to the browser.
- `.env.local` is in `.gitignore`. If a secret is ever committed, rotate it right away.

**Only the shop's iPad can book**

- Every API route except `/api/health` requires an `httpOnly`, `Secure`, `SameSite=Strict` cookie named `kiosk`.
- The cookie's value is an HMAC of a fixed string, signed with `KIOSK_SECRET`. The server checks it with a timing-safe comparison.
- `GET /setup?key=<KIOSK_SECRET>` sets the cookie and redirects to `/`. A wrong key returns 403.
- On iOS, a home-screen web app keeps its own cookies, separate from Safari. So add the app to the home screen **from the `/setup?key=…` URL**. It re-registers on every launch, and the cookie never goes stale.
- Any other device sees: "This page only works on the shop's kiosk."
- If the iPad is lost, change `KIOSK_SECRET` in Vercel and redeploy. The old cookie stops working.
- Speed bump: at most 10 bookings per 10 minutes, checked in server memory. This isn't perfect on serverless, but it's enough to stop a stuck button or a prank.

**Personal data**

- Collect only a first name and phone number, and send both straight to Setmore, where her other customers' details already live. **The app stores nothing.**
- Server logs record status codes, routes and durations, never names or phone numbers.
- Alberta's private-sector privacy law (PIPA) applies to the shop. Keep the hint under the phone field ("For your booking confirmation.") and get her OK on the wording before launch.
- Whether the customer gets a confirmation text depends on her Setmore notification settings. Check them together in Part 5.

**Device and dependencies**

- The iPad runs Guided Access with a passcode only she and you know (section 14).
- Keep dependencies few. Run `npm audit` and update packages once a month (runbook).

## 13. Build plan

Seven parts, each ending with something that works and can be tested. Send the prompts in order, one at a time, after the Master context prompt (Appendix). Test and commit between prompts.

### Part 0: Prerequisites (no code)

**Goal:** everything in place to start building, with the Setmore API request already sent, since approval can take a while.

- [ ] Confirm with the barber: the 6 services, her hours, `lastStart` (20:30?), a 5-minute buffer, whether she takes fixed breaks, collecting first name + phone, and moving to Setmore Pro.
- [ ] She upgrades to Setmore Pro, or confirms she's on it.
- [ ] Create a **test Setmore account** with your own email: one staff member, the same 6 services, the same hours.
- [ ] Email api@setmore.com using the Appendix template. Ask for access on the test account and on hers, and ask whether the test account also needs Pro.
- [ ] Install current Node.js LTS, Git and your editor (Cursor, VS Code or similar).
- [ ] Create a GitHub repo `walk-in-kiosk` and a Vercel account (Hobby for now).
- [ ] Generate `KIOSK_SECRET` with `openssl rand -hex 32` and keep it in your password manager.

**Done when:** the API request is sent, the test account mirrors her setup, and the repo exists.

### Getting started on Windows (do this once, before Part 1)

These steps take you from an empty computer to an AI editor with the project open and saved on GitHub. Run the commands in PowerShell, one block at a time, and check each result before moving on.

**Step 1: Install the tools**

1. **Node.js:** download the **LTS** version from nodejs.org and install it with the defaults.
2. **Git:** download from git-scm.com and install it with the defaults.
3. **AI code editor:** Cursor (cursor.com) is easiest. VS Code with an AI extension also works.
4. **Close PowerShell and open a new window** so it finds the new tools. Check that both print a version number:

   ```powershell
   node -v
   git --version
   ```

   If either says "not recognized", reinstall that tool and open a new PowerShell window again.
5. Tell Git who you are (one time):

   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```

6) Allow npm and npx to run in PowerShell (one time). Windows blocks them by default with the error "running scripts is disabled on this system":

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Type `Y` if asked. This only changes your own user account.

7. Create the parent folder if it doesn't exist yet: `mkdir $HOME\Documents\Walk_In_Kiosk_Barber_App`. (`$HOME` is your user folder, e.g. `C:\Users\srbzk`.)

**Step 2: Create the project**

```powershell
cd $HOME\Documents\Walk_In_Kiosk_Barber_App
npx create-next-app@latest walk-in-kiosk --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

Press Enter for any questions it asks, and wait for "Success". This creates the `walk-in-kiosk` folder **and** sets up Git inside it. Then:

```powershell
cd walk-in-kiosk
npm run dev
```

Open http://localhost:3000. If you see the Next.js welcome page, it works. Press Ctrl + C to stop it.

**From now on, run every command from inside `walk-in-kiosk`.** Your PowerShell prompt should end in `\walk-in-kiosk>`. If Git says "not a git repository", you're in the wrong folder.

**Step 3: Add this spec to the project**

1. In this doc, click the doc's name → **Export** → **Markdown**.
2. In File Explorer, open the `walk-in-kiosk` folder, create a folder named `docs`, move the downloaded file into it, and rename it `SPEC.md`.

**Step 4: Save it to GitHub**

1. On github.com, click **New repository**, name it `walk-in-kiosk`, leave every box unchecked (no README) and click **Create repository**.
2. In PowerShell, inside `walk-in-kiosk`, run this with your real GitHub username in place of `YOUR-USERNAME`:

   ```powershell
   git add .
   git commit -m "Initial project and spec"
   git remote add origin https://github.com/YOUR-USERNAME/walk-in-kiosk.git
   git branch -M main
   git push -u origin main
   ```

   Sign in if a GitHub window pops up. Refresh the repo page: your files should be there.

**Step 5: Open it in your AI editor**

1. In Cursor: **File → Open Folder** → choose the `walk-in-kiosk` folder itself, not the folder above it.
2. Open the AI chat panel, paste the **Master context prompt** (Appendix A), then **Prompt 1.1** below.

**After every prompt, save your work:**

```powershell
git add .
git commit -m "Part 1.1 setup"
git push
```

Change the message each time, e.g. "Part 1.2 screens".

### Part 1: Kiosk screens on mock data

**Goal:** the whole kiosk works end to end on an iPad-sized screen, using fake data. You can show this to the barber before any Setmore access exists.

**Before you start:** finish "Getting started on Windows" above. The app is created, `docs/SPEC.md` is in place, and the project is open in your AI editor.

**Prompt 1.1: setup**

```
Read docs/SPEC.md sections 1, 4, 6, 10 and 11. We are doing Part 1, prompt 1.1 only.
- Replace app/globals.css with the Tailwind theme and kiosk CSS from section 4.
- Load Inter with next/font as the CSS variable --font-inter in app/layout.tsx.
- In app/layout.tsx set the viewport: width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no.
- Create config/shop.ts exactly as in section 10.
- Create .env.example with the variables from section 10 (blank values). Make sure .env.local is in .gitignore.
- Create the folders from section 11 (empty placeholder files where needed).
- Install only: luxon, @types/luxon, zod, react-qr-code, vitest. No other packages.
- Add an npm script "test": "vitest".
Don't build any screens yet. When done, list the files you created or changed.
```

**Prompt 1.2: components and screens**

```
Read docs/SPEC.md sections 3, 4 and 11. Part 1, prompt 1.2 only.
1. Build the UI components in components/ui (Button, OptionTile, TextField, Screen, Banner, QrBlock), using only the design tokens and sizes from section 4.
2. Build the six screens in components/screens exactly as the wireframes and copy in section 3. Use hard-coded sample data for now.
3. Build app/page.tsx as the state machine in section 11 and wire the screens together. Include:
   - the idle reset to Welcome after 60 s with no taps (any tap restarts the timer)
   - Done returns to Welcome after 10 s, Error after 15 s
   - a 150 ms fade between screens, turned off under prefers-reduced-motion
Design for iPad portrait (820x1180) and check it also works in landscape. No new packages. Keep components small and readable.
```

**Prompt 1.3: mock backend and wiring**

```
Read docs/SPEC.md sections 7, 9 and 10. Part 1, prompt 1.3 only.
1. Create lib/setmore/types.ts exactly as in section 7. Create lib/setmore/mock.ts implementing SetmoreClient in memory: services from the config mock values; 4 appointments today at 11:00-11:30, 13:00-13:45, 15:30-16:00 and 18:00-18:20 (America/Edmonton); a 300 ms delay; MOCK_FAIL=taken and MOCK_FAIL=down as described in section 7. lib/setmore/index.ts returns the mock when SETMORE_MODE=mock.
2. Create lib/time.ts (today's date and DateTimes in America/Edmonton, "2:15 PM" labels) and lib/hours.ts (open / before_open / closed, from config).
3. Create the API routes from section 9: status, services, slots, book, health. For now /api/slots returns the next 6 quarter-hours from now that don't overlap a mock appointment (a simple placeholder loop; the real engine comes in Part 2). /api/book validates the body with Zod (lib/validation.ts) and calls the mock createBooking.
4. Replace the sample data in app/page.tsx with calls to these routes, including loading states, the 409 SLOT_TAKEN flow and the error screen.
Don't add the kiosk cookie yet (that's Part 4).
```

**Done when**

- [ ] With `npm run dev` in an iPad-sized browser window, the full flow works from Welcome to Done.
- [ ] Back works on every screen, and the idle reset works.
- [ ] `MOCK_FAIL=taken` shows "That time was just taken". `MOCK_FAIL=down` shows the error screen.
- [ ] Changing the hours in config to test shows both closed states.
- [ ] It looks right on a real iPad: run `npm run dev -- -H 0.0.0.0` and open `http://<your-computer-ip>:3000` on the iPad over the same Wi-Fi.
- [ ] Pushed to GitHub, and a Vercel preview deploy works with `SETMORE_MODE=mock`.

### Part 2: Slot engine

**Goal:** real availability logic, fully unit-tested, still running on mock data.

**Prompt 2.1: engine, tests first**

```
Read docs/SPEC.md section 8. Part 2, prompt 2.1 only.
1. Write lib/slots/engine.test.ts first, with every test case from the table in section 8 (Vitest, fixed dates, Luxon in America/Edmonton).
2. Then implement lib/slots/engine.ts (fits and findSlots) exactly per the rules in section 8, until all tests pass.
Pure functions only: no fetch, no Date.now(), no config import. Show me the test output.
```

**Prompt 2.2: use the engine everywhere**

```
Read docs/SPEC.md sections 8, 9 and 10. Part 2, prompt 2.2 only.
1. Add lib/slots/today.ts: builds SlotOptions for today from config (hours, lastStart, slot settings, breaks), the service length, and busy times from getSetmoreClient().listBusy(today).
2. Make /api/slots use findSlots (delete the placeholder loop) and return labels as in section 9.
3. Make /api/book follow the steps in section 9: validate, check open, fetch busy times fresh and call fits(), duplicate check, createBooking, then return the success body or 409 SLOT_TAKEN with fresh slots.
4. Make the mock's createBooking add the booking to its in-memory appointments, so the booked time disappears for the next customer.
5. Add unit tests for lib/validation.ts: names, phone formats, a start time that isn't today.
```

**Done when**

- [ ] `npm test` passes: all engine and validation tests.
- [ ] After booking 2:15, the next customer no longer sees 2:15 (mock).
- [ ] A skin fade is never offered at a time that overlaps a mock appointment or ends after 21:00.
- [ ] "Now" appears only when there's room right now.

### Part 3: Live Setmore

**Goal:** the kiosk reads from and writes to the **test** Setmore account.

**Before you start:** API access is approved, the test account's refresh token is in `.env.local`, and `SETMORE_MODE` is still `mock`.

**Prompt 3.1: probe the real API**

```
Read docs/SPEC.md section 7. Part 3, prompt 3.1 only.
Write scripts/setmore-probe.ts (run with: npx tsx scripts/setmore-probe.ts) that:
- gets an access token using SETMORE_REFRESH_TOKEN from .env.local and SETMORE_BASE_URL
- calls the staff, services and appointments (today and the next 7 days) endpoints, plus the slots endpoint if it exists
- saves each raw response to fixtures/setmore/<name>.json, with customer names, emails and phone numbers replaced by fake values
- prints a short summary: staff keys, service keys with durations and prices, number of appointments
Read-only: the script must never create, change or delete anything. If an endpoint returns 404, log it and continue.
```

Then, yourself: read the fixtures, tick off the probe questions in section 7, and update this spec where reality differs (endpoints, formats, required fields). Fill in each service's `setmoreKey` in config, and set `SETMORE_STAFF_KEY`.

**Prompt 3.2: live reads**

```
Read docs/SPEC.md section 7 and the JSON files in fixtures/setmore/. Part 3, prompt 3.2 only.
Implement listServices and listBusy in lib/setmore/live.ts (createBooking throws "not implemented" for now):
- access token handling and the 401 refresh-once rule from section 7
- Zod schemas for Setmore's responses, based on the fixtures
- map to the Service and Busy types, convert all times to America/Edmonton, and exclude cancelled appointments
- 8 s timeout per request; cache services for 10 minutes; never cache appointments
- never log names or phone numbers
Add unit tests that run the mapping functions against the fixture files. lib/setmore/index.ts returns the live client when SETMORE_MODE=live.
```

Test it: set `SETMORE_MODE=live`, add a few appointments in the test Setmore account by hand, and check the kiosk skips those times.

**Prompt 3.3: live booking**

```
Read docs/SPEC.md sections 7 and 9 and the fixtures. Part 3, prompt 3.3 only.
Implement createBooking in lib/setmore/live.ts: create the customer, then the appointment (staff key from env, service key from config, start and end, cost, note "Walk-in (kiosk)"). Use the field names confirmed by the fixtures, and follow the create-timeout rule in section 7: never retry a create blindly, re-fetch and check instead.
Implement the duplicate check in /api/book. If you need the customer's phone on busy items, add an optional customerPhone field to the Busy type and update section 7 of the spec to match.
Then give me a short checklist of manual tests to run against the test account.
```

**Done when**

- [ ] A kiosk booking appears in the test Setmore account at the right time, with the right service, the "Walk-in (kiosk)" note, and the customer's name and phone.
- [ ] That time disappears from the kiosk **and** from the Setmore online booking page.
- [ ] If you add an appointment in Setmore while a walk-in sits on the Details screen, their booking gets `SLOT_TAKEN`.
- [ ] A bad token or no network shows the error screen and leaves no half-made bookings.
- [ ] If Setmore has a slots endpoint: compare its times with ours on 3 different days and record which one you trust, and why, in section 8.

### Part 4: Kiosk hardening

**Goal:** safe to leave unattended for an 11-hour day: only the iPad can book, and nothing falls over when the network does.

**Prompt 4.1: only the iPad can book**

```
Read docs/SPEC.md section 12. Part 4, prompt 4.1 only.
Implement kiosk registration exactly as in section 12:
- app/setup/route.ts: GET /setup?key=... compares the key with KIOSK_SECRET (timing-safe), sets the kiosk cookie (httpOnly, Secure, SameSite=Strict, Max-Age 400 days, Path=/) and redirects to /. Wrong or missing key: 403 plain text.
- lib/kiosk-auth.ts: the HMAC cookie value and a requireKiosk(request) helper.
- Call requireKiosk in every API route except /api/health; return 403 NOT_A_KIOSK.
- In app/page.tsx, a 403 shows "This page only works on the shop's kiosk." instead of the error screen.
- Add the booking speed bump from section 12 to /api/book (10 per 10 minutes, in memory).
Explain how to test this locally and on a Vercel preview.
```

Secure cookies need HTTPS, so test registration on a Vercel preview URL, not on your computer's local IP address.

**Prompt 4.2: resilience**

```
Read docs/SPEC.md sections 2, 3 and 9. Part 4, prompt 4.2 only.
Make the kiosk resilient:
- A "Reconnecting..." banner driven by navigator.onLine and the online/offline events; Book is disabled while offline.
- Every client fetch times out after 10 s and goes to the error screen.
- The Book button disables on the first tap and shows "Booking...".
- On Welcome, poll /api/status every 60 s and switch between the open and closed states automatically.
- Reload the page (only while on Welcome) after midnight America/Edmonton, and when the page becomes visible after being hidden, so a long-running iPad always runs the latest deploy.
- An error boundary shows the Error screen if anything fails to render.
Then go through every row of the failure table in section 2 and tell me how each one is handled.
```

**Done when**

- [ ] On a Vercel preview, your own phone shows "This page only works on the shop's kiosk."
- [ ] After visiting `/setup?key=…` on the iPad, everything works.
- [ ] Airplane mode mid-flow shows the banner without crashing, and turning it off recovers.
- [ ] You've tested every row of the failure table in section 2 by hand.

### Part 5: Polish, deploy and pilot

**Goal:** live in the shop on her real Setmore account, after a week of watching real customers use it.

**Prompt 5.1: polish pass**

```
Read docs/SPEC.md sections 3 and 4. Part 5, prompt 5.1 only.
Do a polish pass without adding features:
- Compare every screen with the wireframes, copy and sizes in sections 3 and 4. List the differences, then fix them.
- Make every tap target meet the minimum sizes, and check colour contrast.
- Add aria-labels to icon-only buttons and make the flow usable with VoiceOver.
- Remove unused code, console.log calls and unused dependencies.
- Make sure npm run build passes with no type or lint errors.
```

**Prompt 5.2: operations**

```
Read docs/SPEC.md sections 9 and 14. Part 5, prompt 5.2 only.
- Make /api/health return { ok, mode, setmore } as in section 9, with the Setmore check cached for 5 minutes and status 503 when Setmore fails.
- Add app/manifest.ts (name "Walk-ins", display "standalone", white background) so the home-screen app opens full screen.
- Write README.md: local setup, env vars, running the probe, deploying, registering the iPad, and a link to docs/SPEC.md.
```

**Go-live checklist**

- [ ] Upgrade Vercel to Pro (commercial use, section 6).
- [ ] Set production env vars: her refresh token and staff key, `SETMORE_MODE=live`, and a new `KIOSK_SECRET`. Put her service keys in config.
- [ ] Optional: a custom domain such as `kiosk.<your-domain>`.
- [ ] Add an UptimeRobot (or Better Stack) monitor on `/api/health`: 5-minute checks, email alerts to you.
- [ ] Check her Setmore notification settings together: does a walk-in get a confirmation text?
- [ ] Set up the iPad (section 14).
- [ ] Pilot week: visit on two busy days, watch real customers, and note every hesitation. Fix the top three.
- [ ] Get her sign-off, a testimonial, and permission to show it in your portfolio.

### Part 6+: Backlog

Build these only when she asks for them, or when the pilot shows a real need. Effort: S = one session, M = two or three.

| Feature | Why it helps | Effort | Notes |
| --- | --- | --- | --- |
| Reuse returning customers by phone | No duplicate customers in her Setmore | S | Needs a search-by-phone endpoint (see probe questions) |
| Admin page with PIN: walk-ins off for today, change `lastStart`, hide a service | Small changes without a redeploy | M | First piece of stored state: use a small key-value store |
| Group check-in ("+ Add another person") | A parent with two kids books back-to-back times | M | The engine needs to search for consecutive slots |
| "Next open walk-in time" on Welcome or a TV | Fewer "how long's the wait?" questions | S | Reuses `findSlots` |
| Weekly stats email | Shows her the value and supports renewal | M | Counts Setmore appointments with the kiosk note |
| Multi-shop support | Set up shop #2 in an afternoon | M | One config per shop, picked by domain |
| Our own "you're up next" texts | Customers can wait elsewhere | M | Adds a texting provider, a per-text cost and consent wording |
| Second language | Serves more customers | S | Move all copy into one file first |

For any backlog item, use the same spec-first prompt:

```
Read docs/SPEC.md. We are adding the backlog item "<feature name>" from Part 6.
First, update the spec: change or add the relevant sections (screens, copy, API, config, tests) and show me the changes. Wait for my OK.
Then implement it with tests, without changing unrelated code.
```

## 14. iPad setup, operations and runbook

The iPad takes about 15 minutes to set up. After that, most problems are fixed by re-opening the setup link or updating one environment variable.

**iPad setup**

1. Use any iPad on a recent iPadOS. Keep it plugged in, on a lockable stand or wall mount near the door, on the shop's Wi-Fi.
2. Settings → Display & Brightness → Auto-Lock → **Never**.
3. Turn on a Focus or Do Not Disturb mode so notifications never pop up over the kiosk.
4. In Safari, open `https://<your-domain>/setup?key=<KIOSK_SECRET>`, then Share → **Add to Home Screen**, and name it "Walk-ins". Open it from the home-screen icon from now on. (Prompt 5.2 adds the manifest that makes it open full screen.)
5. Settings → Accessibility → **Guided Access** → On, and set a passcode. Open the Walk-ins app, triple-click the top (or Home) button, and tap Start.
6. Make one test booking end to end, then delete it in Setmore.

**Runbook**

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Every booking shows the error screen | Setmore is down, or the token expired or was revoked | Check `/api/health` and the Vercel logs. For a token problem, get a new refresh token, update the env var and redeploy. Meanwhile she takes walk-ins by hand. |
| iPad shows "This page only works on the shop's kiosk" | Cookie lost, or `KIOSK_SECRET` changed | Exit Guided Access, open the setup link again, restart Guided Access |
| Times offered during her break | The break isn't blocked in Setmore, or the API doesn't return blocked time | Block it in Setmore. If the API ignores blocks, add it to `breaks` in config. |
| Times off by an hour or more | A time zone bug | Check that every date goes through `lib/time.ts` in `America/Edmonton`, and rerun test 12 |
| Blank or frozen screen | Wi-Fi dropped or Safari crashed | Exit Guided Access, close the app, reopen it, restart Guided Access |
| Duplicate bookings | Double tap, or a retried create | Check the logs, then the duplicate rule in section 9 |
| She changes her hours or services | — | Update `config/shop.ts`, run the tests, deploy |

**Monthly maintenance** (this is part of what the monthly fee covers)

- [ ] Read the Vercel logs and the uptime alerts for errors.
- [ ] Run `npm audit`, update minor package versions, run the tests and deploy.
- [ ] Look for Setmore emails about API changes.
- [ ] Ask her how it's going, and log any requests in the Part 6 backlog.

## Appendix

### A. Master context prompt

Paste this at the start of every AI coding session, before the Part prompt:

```
You are helping me build "Walk-in Kiosk", a minimalist iPad web app for a one-barber shop that lets walk-ins book today's open times straight into the shop's Setmore calendar. The full spec is in docs/SPEC.md. Read it before doing anything and treat it as the source of truth.

Rules for every session:
- Build only the Part and prompt I name. Don't start the next one.
- Stack: Next.js App Router + TypeScript, Tailwind CSS v4, Luxon, Zod, Vitest, react-qr-code. Don't add packages, a database or new screens without my OK. If the spec looks wrong or is missing something, stop and tell me.
- All times are America/Edmonton, through lib/time.ts. The browser never calls Setmore directly.
- Minimalism: fewest screens, fewest fields, small readable components, no clever abstractions. Use only the design tokens in section 4 and the copy in section 3.
- Never log names or phone numbers. Never commit secrets.
- After each change: run npm test and npm run build and fix any errors. Then summarize what changed and what I should test by hand.
```

### B. Setmore API access email

```
Subject: API access request — walk-in booking kiosk for a barbershop

Hi Setmore API team,

I'm a software development student building a walk-in check-in kiosk for Jaribu Barbershop Ltd in Calgary, which uses Setmore for all its bookings.

Use case: an iPad in the shop shows walk-in customers today's open times (read from Setmore) and books the chosen time as a normal Setmore appointment. Setmore stays the single source of truth; we don't store appointments ourselves.

Endpoints we expect to need: staff, services, appointments for a date range, customer creation and appointment creation (and available slots, if that exists).

Accounts:
- Test account: [your name], [your Setmore login email]
- Production account (Pro): Jaribu Barbershop Ltd, [her Setmore login email]. The owner, [her name], has approved this and is cc'd.

Questions:
1. Does the test account also need a Pro plan for API access?
2. Is there an available-slots endpoint, and does blocked time or a break show up in the appointments data?
3. What are the rate limits?

Thanks,
[Your name]
[Phone] · [GitHub or portfolio link]
```

### C. Glossary

| Term | Meaning here |
| --- | --- |
| Adapter | The one file set (`lib/setmore/`) that talks to Setmore. Swapping mock for live changes nothing else. |
| Busy time | Any period she can't take a walk-in: a Setmore appointment or a blocked break. |
| Slot | A start time the engine says fits: no clash, buffer respected, ends before closing. |
| Refresh token / access token | The long-lived secret from Setmore, and the short-lived token the server trades it for on each use. |
| Mock mode | `SETMORE_MODE=mock`: fake in-memory Setmore for building and testing without API access. |
| Fixture | A saved, scrubbed copy of a real Setmore response, used for types and tests. |
| Guided Access | The iPad feature that locks it to one app until a passcode is entered. |
| Vercel preview | The temporary HTTPS URL Vercel creates for every pushed branch. |

### Sources

- [Jaribu Barbershop Setmore booking page](https://jaribubarbershopltd.setmore.com/): services, prices, lengths, hours
- [Setmore: Request access to the Setmore API](https://support.setmore.com/en/articles/579360-request-access-to-the-setmore-api): Pro requirement, request process, OAuth 2.0, no sandbox
- [Pipedream Setmore integration code](https://pipedream.com/apps/setmoreappointments/integrations/piped): base URL used by a community integration
- [setmore-sdk (community)](https://socket.dev/npm/package/setmore-sdk): appointment field names
- [Vercel pricing comparison, 2026](https://modelence.com/compare/vercel-pricing) and [Vercel terms excerpt](https://conductatlas.com/platform/vercel/vercel-terms-of-service/provision/CA-P-048642/hobby-plan-personal-non-commercial-use-only/): Hobby is non-commercial, Pro is $20 per seat per month
- [Vercel community: Hobby for a SaaS prototype](https://community.vercel.com/t/is-hobby-plan-suitable-for-a-saas-prototype/7205)
