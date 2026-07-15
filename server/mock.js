// In-memory mock of the Way API, mirroring the shapes in the docs, so the
// full booking flow runs without real credentials or Stripe.
import { randomUUID } from "crypto";

const img = (seed, w) =>
  `https://picsum.photos/seed/${seed}/${w}/${Math.round(w * 0.66)}`;

const media = (seed) => ({
  id: randomUUID(),
  kind: "cover",
  type: "image",
  links: [640, 750, 1080].map((w) => ({
    type: "image",
    url: img(seed, w),
    resolution: String(w),
  })),
});

const CATALOG = [
  {
    id: "d9fa9229-9132-415d-bc04-513062ee3bcd",
    experienceId: "c99f70ee-1c0e-4534-a31a-96d5d966cc4b",
    title: "Sunset Sailing Tour",
    summary: "A 90-minute guided sail along the coast at golden hour.",
    description:
      "<p>Glide across calm evening waters aboard a classic sloop. Includes a welcome drink, a knowledgeable skipper, and unbeatable sunset views.</p>",
    advertisedPrice: 89,
    category: "Water",
    kind: "experience",
    maxParticipants: 10,
    location: "Austin, TX, USA",
    duration: 90,
    tiers: [{ name: "Adult", price: 89, maxQuantity: 10 }],
    seed: "sail",
  },
  {
    id: "1f4877f4-a082-4a05-9cbf-fa129b28f01c",
    experienceId: "e7a3b8d1-4c2f-4b6e-9a5d-8f1c3e7b2a64",
    title: "Rooftop Wine Tasting",
    summary: "Sample six curated wines with skyline views and a sommelier.",
    description:
      "<p>An intimate guided tasting of six boutique wines paired with artisan cheeses, hosted on a downtown rooftop.</p>",
    advertisedPrice: 65,
    category: "Food & Drink",
    kind: "experience",
    maxParticipants: 12,
    location: "Austin, TX, USA",
    duration: 120,
    tiers: [
      { name: "Standard", price: 65, maxQuantity: 12 },
      { name: "Premium Pour", price: 95, maxQuantity: 6 },
    ],
    seed: "wine",
  },
  {
    id: "2a9c5f7a-3d1b-4a8c-b6e4-5a9d2c8f1e37",
    experienceId: "a1b2c3d4-4c2f-4b6e-9a5d-8f1c3e7b2a64",
    title: "Artisan Coffee Workshop",
    summary: "Roast, grind, and brew like a pro in this hands-on class.",
    description:
      "<p>Learn pour-over, espresso, and latte art from a champion barista. Take home a bag of freshly roasted beans.</p>",
    advertisedPrice: 45,
    category: "Food & Drink",
    kind: "experience",
    maxParticipants: 8,
    location: "Austin, TX, USA",
    duration: 75,
    tiers: [{ name: "Participant", price: 45, maxQuantity: 8 }],
    seed: "coffee",
  },
  {
    id: "3b0d6a8b-4e2c-4b9d-c7f5-6b0e3d9a2f48",
    experienceId: "b2c3d4e5-4c2f-4b6e-9a5d-8f1c3e7b2a64",
    title: "Desert Stargazing Night",
    summary: "Guided telescope viewing under dark desert skies.",
    description:
      "<p>Journey beyond the city lights for an astronomer-led tour of planets, nebulae, and constellations.</p>",
    advertisedPrice: 70,
    category: "Nature",
    kind: "experience",
    maxParticipants: 15,
    location: "Marfa, TX, USA",
    duration: 150,
    tiers: [
      { name: "Adult", price: 70, maxQuantity: 15 },
      { name: "Child", price: 40, maxQuantity: 15 },
    ],
    seed: "stars",
  },
  {
    id: "4c1e7b9c-5f3d-4cae-d806-7c1f4e0b3a59",
    experienceId: "c3d4e5f6-4c2f-4b6e-9a5d-8f1c3e7b2a64",
    title: "Private Cabana Day Pass",
    summary: "Reserve a poolside cabana for the day.",
    description:
      "<p>Your own shaded retreat with lounge seating, bottle service, and pool access from open to close.</p>",
    advertisedPrice: 250,
    category: "Leisure",
    kind: "experience",
    maxParticipants: 6,
    location: "Scottsdale, AZ, USA",
    duration: 480,
    tiers: [{ name: "Full-Day", price: 250, maxQuantity: 6 }],
    seed: "cabana",
  },
  {
    id: "5d2f8cad-6a4e-4dbf-e917-8d2f5f1c4b6a",
    experienceId: "d4e5f6a7-4c2f-4b6e-9a5d-8f1c3e7b2a64",
    title: "City Street-Art Bike Tour",
    summary: "Pedal through the mural district with a local artist.",
    description:
      "<p>A relaxed guided ride connecting the city's best murals and hidden galleries, with stops for photos and stories.</p>",
    advertisedPrice: 55,
    category: "Adventure",
    kind: "experience",
    maxParticipants: 10,
    location: "Austin, TX, USA",
    duration: 180,
    tiers: [{ name: "Rider", price: 55, maxQuantity: 10 }],
    seed: "bike",
  },
];

const QUESTIONS = {
  "e7a3b8d1-4c2f-4b6e-9a5d-8f1c3e7b2a64": [
    {
      questionId: "q-dietary-01",
      label: "Any dietary restrictions?",
      type: "select",
      required: false,
      options: [
        { key: "none", value: "None" },
        { key: "vegetarian", value: "Vegetarian" },
        { key: "vegan", value: "Vegan" },
      ],
    },
  ],
};

const bookingsByCartCode = new Map();

function listItem(l) {
  return {
    id: l.id,
    experienceId: l.experienceId,
    title: l.title,
    summary: l.summary,
    advertisedPrice: l.advertisedPrice,
    hidePrice: false,
    currency: "USD",
    kind: l.kind,
    maxParticipants: l.maxParticipants,
    category: { id: randomUUID(), name: l.category },
    location: { name: l.location },
    medias: [media(l.seed)],
  };
}

function code(len) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const mockWay = {
  brandSettings: async () => ({
    brandEmail: "hello@experiences.example",
    paymentPlatform: "stripe-us",
    currency: "USD",
    wayVersion: "V1",
    products: ["activate"],
    paymentMethods: { card: true, apple_pay: false, google_pay: false },
  }),

  listings: async (query = {}) => {
    const q = (query.search || "").toLowerCase();
    const filtered = CATALOG.filter(
      (l) =>
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q)
    );
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;
    const start = (page - 1) * limit;
    return {
      items: filtered.slice(start, start + limit).map(listItem),
      itemsPerPage: limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      currentPage: page,
    };
  },

  listing: async (id) => {
    const l = CATALOG.find((x) => x.id === id);
    if (!l) {
      const e = new Error("Not found");
      e.status = 404;
      throw e;
    }
    return {
      data: {
        ...listItem(l),
        description: l.description,
        duration: l.duration,
        bookingAvailabilityMode: "group",
        isBookable: true,
        resourceGroupCollectionId: null,
        resourceGroups: [],
        priceTiers: l.tiers.map((t) => ({ id: randomUUID(), ...t })),
        medias: [media(l.seed), media(l.seed + "-2"), media(l.seed + "-3")],
      },
    };
  },

  sessions: async (id) => {
    const l = CATALOG.find((x) => x.id === id);
    if (!l) return { data: { sessions: [] } };
    const sessions = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let d = 2; d <= 16; d += 2) {
      const day = new Date(base);
      day.setDate(day.getDate() + d);
      for (const hour of [10, 14, 18]) {
        const dt = new Date(day);
        dt.setHours(hour);
        sessions.push({
          sessionId: null,
          scheduleId: randomUUID(),
          isRepeating: true,
          isPrivateEvent: false,
          startDateTime: toLocalIso(dt),
          duration: l.duration,
          participantCount: 0,
          capacity: l.maxParticipants,
          status: "OPEN",
          experienceId: l.experienceId,
          hostedBy: null,
          priceTiers: l.tiers.map((t) => ({
            id: randomUUID(),
            name: t.name,
            price: t.price,
            maxQuantity: t.maxQuantity,
            participantsCount: 0,
          })),
        });
      }
    }
    return { data: { sessions } };
  },

  customQuestions: async (experienceId) => ({
    items: QUESTIONS[experienceId] || [],
  }),

  paymentIntent: async (cartId, body) => {
    const total = cartTotal(body?.data || []);
    if (body?.getOnlyTotalNetAmount) return { data: { totalNetAmount: total } };
    return {
      data: {
        totalNetAmount: total,
        paymentIntentSecret: `pi_mock_${cartId.slice(0, 8)}_secret_${code(6)}`,
      },
    };
  },

  book: async (body) => {
    const total = cartTotal(body?.data || []);
    const cartConfirmationCode = code(9);
    const item = body.data[0] || {};
    const l =
      CATALOG.find((x) => x.experienceId === item.experienceId) || CATALOG[0];
    const booking = {
      id: randomUUID(),
      confirmationCode: code(9),
      cartId: body.cartId,
      cartConfirmationCode,
      amount: total,
      currency: "USD",
      amountRefunded: 0,
      // Non-card methods confirm synchronously; card stays processing until "payment".
      status: body.paymentMethod === "credit-card" ? "processing" : "confirmed",
      paymentMethod: body.paymentMethod || "credit-card",
      purchaser: body.purchaser,
      participants: (item.participants || []).map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        priceTierName: p.priceTierName,
        cancelledAt: null,
      })),
      event: { timezone: "America/Chicago", startDateTime: item.sessionTime },
      experience: { id: l.experienceId, title: l.title },
    };
    bookingsByCartCode.set(cartConfirmationCode, booking);
    return {
      data: {
        subjectId: body.cartId,
        subjectType: "cart",
        confirmationCode: cartConfirmationCode,
        amount: total,
        currency: "USD",
        clientSecret:
          body.paymentMethod === "credit-card"
            ? `pi_mock_${body.cartId.slice(0, 8)}_secret_${code(6)}`
            : null,
      },
    };
  },

  discardCart: async () => ({ data: { discarded: true } }),

  bookings: async (query = {}) => {
    const b = bookingsByCartCode.get(query.cartConfirmationCode);
    // Simulate the Stripe webhook having settled the payment by now.
    if (b && b.status === "processing") b.status = "confirmed";
    return { items: b ? [b] : [] };
  },
};

function cartTotal(data) {
  const priceByTier = new Map();
  for (const l of CATALOG)
    for (const t of l.tiers) priceByTier.set(`${l.experienceId}:${t.name}`, t.price);
  let total = 0;
  for (const item of data) {
    for (const p of item.participants || []) {
      total += priceByTier.get(`${item.experienceId}:${p.priceTierName}`) || 0;
    }
  }
  return total;
}

function toLocalIso(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}:00`;
}
