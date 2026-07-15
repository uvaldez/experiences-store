const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function req(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  config: () => req("/config"),
  listings: (params = {}) =>
    req(`/listings?${new URLSearchParams(params)}`),
  listing: (id) => req(`/listings/${id}`),
  sessions: (id, params = {}) =>
    req(`/listings/${id}/sessions?${new URLSearchParams(params)}`),
  customQuestions: (experienceId) =>
    req(`/experiences/${experienceId}/custom-questions`),
  newCart: () => req("/cart/new"),
  paymentIntent: (body) =>
    req("/checkout/payment-intent", { method: "POST", body: JSON.stringify(body) }),
  book: (body) =>
    req("/checkout/book", { method: "POST", body: JSON.stringify(body) }),
  discardCart: (cartId) =>
    req("/checkout/discard", { method: "POST", body: JSON.stringify({ cartId }) }),
  bookings: (params = {}) => req(`/bookings?${new URLSearchParams(params)}`),
};
