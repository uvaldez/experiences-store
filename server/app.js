import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { way, isLive } from "./way.js";
import { mockWay } from "./mock.js";

const app = express();
const api = isLive ? way : mockWay;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";

app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    const status = err.status || 502;
    res.status(status).json({ error: err.message, details: err.body ?? null });
  });

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", mode: isLive ? "live" : "mock" })
);

// Brand config + Stripe publishable key (publishable keys are safe client-side).
app.get(
  "/api/config",
  wrap(async (req, res) => {
    const settings = await api.brandSettings();
    res.json({
      mode: isLive ? "live" : "mock",
      currency: settings.currency,
      paymentMethods: settings.paymentMethods,
      paymentPlatform: settings.paymentPlatform,
      stripePublishableKey: STRIPE_PUBLISHABLE_KEY,
    });
  })
);

app.get(
  "/api/listings",
  wrap(async (req, res) => {
    res.json(await api.listings(req.query));
  })
);

app.get(
  "/api/listings/:id",
  wrap(async (req, res) => {
    res.json(await api.listing(req.params.id));
  })
);

app.get(
  "/api/listings/:id/sessions",
  wrap(async (req, res) => {
    res.json(await api.sessions(req.params.id, req.query));
  })
);

app.get(
  "/api/experiences/:experienceId/custom-questions",
  wrap(async (req, res) => {
    res.json(await api.customQuestions(req.params.experienceId));
  })
);

// Mint a cart id server-side (client may also generate its own).
app.get("/api/cart/new", (req, res) => res.json({ cartId: randomUUID() }));

app.post(
  "/api/checkout/payment-intent",
  wrap(async (req, res) => {
    const { cartId, data, getOnlyTotalNetAmount } = req.body;
    res.json(await api.paymentIntent(cartId, { data, getOnlyTotalNetAmount }));
  })
);

app.post(
  "/api/checkout/book",
  wrap(async (req, res) => {
    res.json(await api.book(req.body));
  })
);

app.post(
  "/api/checkout/discard",
  wrap(async (req, res) => {
    res.json(await api.discardCart(req.body.cartId));
  })
);

app.get(
  "/api/bookings",
  wrap(async (req, res) => {
    res.json(await api.bookings(req.query));
  })
);

export default app;
