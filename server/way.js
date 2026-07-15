const WAY_API = process.env.WAY_API || "https://api.staging.letsway.com";
const BRAND_ID = process.env.WAY_BRAND_ID;
const SECRET_KEY = process.env.WAY_SECRET_KEY;

export const isLive = Boolean(BRAND_ID && SECRET_KEY);
export const brandId = BRAND_ID;

function headers(extra = {}) {
  return {
    "Way-Brand-Id": BRAND_ID,
    "Way-Secret-Key": SECRET_KEY,
    ...extra,
  };
}

async function request(method, path, { query, body } = {}) {
  const url = new URL(`${WAY_API}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url, {
    method,
    headers: headers(body ? { "Content-Type": "application/json" } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(`Way API ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const way = {
  brandSettings: () => request("GET", `/v1/brands/${BRAND_ID}/settings`),
  listings: (query) => request("GET", `/v3/listings`, { query }),
  listing: (id) => request("GET", `/v3/listings/${id}`),
  sessions: (id, query) => request("GET", `/v1/listings/${id}/sessions`, { query }),
  customQuestions: (experienceId) =>
    request("GET", `/v1/brands/${BRAND_ID}/experiences/${experienceId}/custom-questions`),
  paymentIntent: (cartId, body) =>
    request("POST", `/v1/brands/${BRAND_ID}/carts/${cartId}/payment_intents`, { body }),
  book: async (body) => {
    const res = await request("POST", `/v1/brands/${BRAND_ID}/book-bulk`, { body });
    // book-bulk returns `amount` in minor units (cents) — unlike tier prices,
    // payment-intent totals, and get-bookings, which are all in major units.
    // Normalize to dollars so the client works in one consistent unit.
    if (res?.data && typeof res.data.amount === "number") {
      res.data.amount = res.data.amount / 100;
    }
    return res;
  },
  discardCart: (cartId) => request("POST", `/v1/brands/${BRAND_ID}/carts/${cartId}/discard`, { body: {} }),
  bookings: (query) => request("GET", `/v1/bookings`, { query }),
};
