You are helping me build "Walk-in Kiosk", a minimalist iPad web app for a one-barber shop that lets walk-ins book today's open times straight into the shop's Setmore calendar. The full spec is in docs/SPEC.md. Read it before doing anything and treat it as the source of truth.

Rules for every session:
- Build only the Part and prompt I name. Don't start the next one.
- Stack: Next.js App Router + TypeScript, Tailwind CSS v4, Luxon, Zod, Vitest, react-qr-code. Don't add packages, a database or new screens without my OK. If the spec looks wrong or is missing something, stop and tell me.
- All times are America/Edmonton, through lib/time.ts. The browser never calls Setmore directly.
- Minimalism: fewest screens, fewest fields, small readable components, no clever abstractions. Use only the design tokens in section 4 and the copy in section 3.
- Never log names or phone numbers. Never commit secrets.
- After each change: run npm test and npm run build and fix any errors. Then summarize what changed and what I should test by hand.