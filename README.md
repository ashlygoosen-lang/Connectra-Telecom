# Connectra Telecom — Website

Connectra Telecom is a division of **VINK Group (Pty) Ltd**, registration number 2018/079316/07 (head office: Cape Town). The footer carries a one-line text statement of this; no VINK logo or links appear on the Connectra site. Connectra's logo and link appear on the VINK Group site (ashlygoosen-lang/VINKLIFE).

React 19 + Vite + Tailwind v4 frontend (from the Figma Make export) with a Node/Express backend. In production both run as **one service**: Express serves the API under `/api` and the built frontend.

```
connectra/
├── frontend/          React app (src/App.tsx, motion.ts, motion.css, api.ts, data.ts)
├── backend/           Express API (src/server.js, api.js, catalog.js, auth.js, db.js)
├── package.json       root scripts used by Railway
└── railway.json
```

## Run locally

```bash
npm run build                 # installs both apps and builds the frontend
npm start                     # http://localhost:4000
```

For live-reload while developing, run `npm run dev:backend` and `npm run dev:frontend` (Vite on :5173 proxies `/api` to :4000).

Demo account: `demo@connectra.africa` / `Connectra2026!` (set `SEED_DEMO=false` to disable, or `DEMO_PASSWORD` to change it).

## Deploy on Railway

1. Push this folder to GitHub and create a Railway service from the repo (root directory = repo root).
2. Railway uses `railway.json`: build `npm run build`, start `npm start`, health check `/api/health`.
3. Set variables: `JWT_SECRET` (long random string), `ADMIN_KEY` (for `/api/admin/summary`), `SITE_URL` (the public address, e.g. `https://connectra.co.za`, used for the Google logo, canonical link and share image), optionally `CORS_ORIGIN`.
4. To keep data across deploys, add a Volume mounted at `/data` and set `DATA_DIR=/data`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/phones`, `/api/phones/:slug` | Phone catalogue (filters: `brand`, `maxPrice`, `sort=price`) |
| GET | `/api/plans/voip` | VoIP plans (Voice Flex R29, Home Unlimited R199, Cloud PBX R149/user), call rates, area codes |
| GET | `/api/plans/internet`, `/api/deals`, `/api/business/solutions`, `/api/faqs`, `/api/stats` | Content |
| POST | `/api/coverage/check` | `{ address }` → fibre / 5G / LTE availability |
| POST | `/api/newsletter` | `{ email }` |
| POST | `/api/business/callback` | `{ email, companySize, solution }` |
| POST | `/api/orders` | Phone, internet or VoIP order (`type: "voip"`, `planId`, `users`, `number: { type: "new", areaCode } \| { type: "port", portNumber }`). Prices are calculated server-side. Only the card's last 4 digits are accepted. |
| GET | `/api/orders/:ref?email=` | Order tracking |
| POST | `/api/auth/register`, `/api/auth/login` | Returns a bearer token |
| GET | `/api/account/me` | Profile, usage, bill, orders (auth) |
| POST | `/api/account/data-topup` | `{ gb: 1 \| 5 \| 10 \| 20 }` → R85 / R229 / R349 / R499 added to the next bill (auth) |
| GET | `/api/support/topics`, `/api/support/articles?q=&topic=` | Help centre search |
| POST | `/api/support/tickets` | `{ name, email, topic, message }` |
| GET | `/api/admin/summary` | Leads, orders, tickets — header `x-admin-key: $ADMIN_KEY` |

Write endpoints are rate-limited per IP. Data is stored in a JSON file (`DATA_DIR/db.json`).

**Currency:** all prices and payments are South African Rand (ZAR), VAT inclusive, formatted the South African way (R1 099 / R1 099,00). Orders store `currency: "ZAR"`.

**Still to connect for production:** a South African payment gateway such as PayFast, Yoco, Peach Payments or Paystack, charging in ZAR (orders are saved as `pending-gateway`), a real ID-verification provider (the checkout step is simulated), a network coverage API (results are currently deterministic per address), and transactional email.

## Logo in Google & branding

- Favicon set (`favicon.ico` 16/32/48, `favicon.svg`, 48/96/192/512 PNGs, Apple touch icon, maskable icon, `site.webmanifest`), built from the Connectra logo mark. Google shows this favicon beside search results.
- `Organization` + `WebSite` structured data with `logo` → `/assets/connectra-logo.png` (512×512), The server fills in absolute URLs from `SITE_URL`.
- Social share card `/assets/og-image.jpg` (1200×630) for WhatsApp, Facebook, LinkedIn and X.
- `/robots.txt` and `/sitemap.xml` are generated with the live address.

After going live: add the site to Google Search Console, submit `/sitemap.xml` and request indexing of the home page. Google usually picks up the favicon and logo within days to a few weeks.

## Connectra Voice (VoIP) — `frontend/src/voip.tsx`

Dedicated `#/voip` page: plans for home and business, a line configurator (new number by area code or keep an existing number, users for Cloud PBX), a call-cost estimator comparing Voice Flex and Home Unlimited, per-second call-rate table, Cloud PBX features with a quote form, and a VoIP FAQ. VoIP also appears in the main navigation and dropdown, as a home-page band, on the Business page and in support topics. Call rates (35c landline / 45c mobile / from 49c international) are placeholders to confirm.

## Interactive showcase (`frontend/src/showcase.tsx`)

- **Network map**: a dot-matrix map of South Africa (`saMap.ts`, generated) with 12 city 5G hubs, flowing backbone links, hover/focus labels, and a coverage reveal that ripples out from Johannesburg
- **Speed finder**: on the Home Internet page, household size and online habits feed a live gauge that recommends a fibre plan
- **Mega menu**: desktop dropdown panels for Mobile Contracts (brands, featured phones, SIM-only promo) and Home Internet (plans, router promo)
- **360° device viewer**: drag or tap "View in 360°" on any phone to rotate it and see the back
- Phones are drawn in CSS and tinted with each model's real colour (frame, buttons, screen, back camera module)

Performance: self-hosted Inter and Poppins (no Google Fonts request), hero photo served as WebP/JPEG at 560/1024 px (19–43 KB instead of the 1.6 MB PNG), preloaded with `imagesrcset`.

## Animation system

All motion is dependency-free (`frontend/src/motion.ts` + `motion.css`) and only animates transform / opacity / clip-path:

- Intro loader (first visit per session) and View-Transitions page changes
- Hero: masked word-by-word headline, shimmering gradient line, clip-path image reveal, floating stat pills, drifting aurora background, scroll + pointer parallax layers
- Scroll reveals with sibling stagger, section-heading wipes, animated counters, speed bars, data ring, number-transfer line, pulsing coverage towers
- Magnetic primary buttons with light sweep, 3D tilt + cursor spotlight on cards, sliding nav indicator, hide-on-scroll header, scroll progress bar, subtle cursor ring
- Smooth FAQ accordion, staggered mobile menu, checkout step slides, product colour swap, toasts and modals

Pointer effects (tilt, magnetic, parallax, cursor) only run on desktop with a fine pointer; mobile gets shorter, lighter reveals. `prefers-reduced-motion` turns everything off.
