# Connectra Telecom — Website

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
3. Set variables: `JWT_SECRET` (long random string), `ADMIN_KEY` (for `/api/admin/summary`), optionally `CORS_ORIGIN`.
4. To keep data across deploys, add a Volume mounted at `/data` and set `DATA_DIR=/data`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/phones`, `/api/phones/:slug` | Phone catalogue (filters: `brand`, `maxPrice`, `sort=price`) |
| GET | `/api/plans/internet`, `/api/deals`, `/api/business/solutions`, `/api/faqs`, `/api/stats` | Content |
| POST | `/api/coverage/check` | `{ address }` → fibre / 5G / LTE availability |
| POST | `/api/newsletter` | `{ email }` |
| POST | `/api/business/callback` | `{ email, companySize, solution }` |
| POST | `/api/orders` | Phone or internet order. Prices are calculated server-side. Only the card's last 4 digits are accepted. |
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

## Animation system

All motion is dependency-free (`frontend/src/motion.ts` + `motion.css`) and only animates transform / opacity / clip-path:

- Intro loader (first visit per session) and View-Transitions page changes
- Hero: masked word-by-word headline, shimmering gradient line, clip-path image reveal, floating stat pills, drifting aurora background, scroll + pointer parallax layers
- Scroll reveals with sibling stagger, section-heading wipes, animated counters, speed bars, data ring, number-transfer line, pulsing coverage towers
- Magnetic primary buttons with light sweep, 3D tilt + cursor spotlight on cards, sliding nav indicator, hide-on-scroll header, scroll progress bar, subtle cursor ring
- Smooth FAQ accordion, staggered mobile menu, checkout step slides, product colour swap, toasts and modals

Pointer effects (tilt, magnetic, parallax, cursor) only run on desktop with a fine pointer; mobile gets shorter, lighter reveals. `prefers-reduced-motion` turns everything off.
