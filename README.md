# Experiences Store

An ecommerce storefront for digital experiences, built on the [Way API](https://docs.letsway.com).
React (Vite) frontend + Express backend that acts as the server-to-server proxy.

## Why a backend

The Way `Way-Secret-Key` must **never** reach the browser. The Express server holds the
credentials and exposes a thin, browser-safe API; the React app only ever talks to the
backend. This also keeps card handling in Stripe's scope — the API and this app never see
card data.

## Run

```bash
npm run install:all   # installs root, client, and server deps
npm run dev           # server on :3001, client on :5173
```

Open http://localhost:5173.

### Modes

- **Mock mode (default):** with no credentials set, the backend serves representative
  data matching the Way API shapes, and payment is simulated. The full browse → select →
  checkout → confirm flow runs out of the box. A "demo mode" badge shows in the header.
- **Live mode:** copy `server/.env.example` to `server/.env` and set `WAY_BRAND_ID`,
  `WAY_SECRET_KEY` (and `WAY_API`). The backend then proxies the real Way API. Set
  `STRIPE_PUBLISHABLE_KEY` to enable real card payment via Stripe Elements.

## Booking flow (mirrors the Way "Build a Booking Integration" guide)

1. `GET /api/config` — brand settings (currency, payment methods) + Stripe publishable key
2. `GET /api/listings` — browse experiences
3. `GET /api/listings/:id` — listing detail (`kind`, price tiers)
4. `GET /api/listings/:id/sessions` — availability
5. `GET /api/experiences/:experienceId/custom-questions` — extra questions
6. Client mints a `cartId` (`GET /api/cart/new`)
7. `POST /api/checkout/book` — creates the booking (`processing`), returns Stripe `clientSecret`
8. Charge the card with Stripe (or simulated in mock mode)
9. `GET /api/bookings?cartConfirmationCode=…` — verify it flipped to `confirmed`
10. On failure: `POST /api/checkout/discard` and retry with a fresh `cartId`

`POST /api/checkout/payment-intent` is also exposed for showing a running total /
mounting a pre-booking payment form.

## Layout

```
client/                 Vite + React
  src/
    api/client.js        talks only to the backend
    config/              brand config context (currency, mode, Stripe key)
    checkout/            checkout draft context + Stripe/simulated payment
    pages/               Home, Listings, ListingDetail, Checkout, Confirmation
server/
  app.js                 Express app + routes (/api/*), exported as a handler
  index.js               local dev entry — imports app.js and listens on :3001
  way.js                 Way API client (holds credentials, server-side only)
  mock.js                in-memory mock of the Way API for demo mode
api/
  [...path].js           Vercel serverless entry — mounts server/app.js
vercel.json              build client → static, route /api/* to the function
```

## Deploy to Vercel

The Express app is exported from `server/app.js` and mounted as a single
serverless function (`api/[...path].js`); `vercel.json` builds the Vite client
to static output and lets Vercel route `/api/*` to the function.

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new). The
   settings in `vercel.json` are picked up automatically — no framework preset
   needed.
2. Add environment variables in **Project → Settings → Environment Variables**
   (never commit them):
   - `WAY_BRAND_ID`
   - `WAY_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY` — the key matching the brand's `paymentPlatform`
   - `WAY_API` *(optional; defaults to staging `https://api.staging.letsway.com`)*
3. Deploy. The client calls same-origin `/api/*`, which hits the function.

Note: **mock mode is not reliable on Vercel** — its in-memory store doesn't
persist across serverless invocations. Set the `WAY_*` credentials so the
deployment runs in live mode.
