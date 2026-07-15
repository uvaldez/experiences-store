export function money(amount, currency = "USD") {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function coverImage(listing, width = 640) {
  const media = listing?.medias?.[0];
  if (!media?.links?.length) return null;
  const match = media.links.find((l) => l.resolution === String(width));
  return (match || media.links[media.links.length - 1]).url;
}

export function formatSession(iso) {
  if (!iso) return "";
  // Sessions come back as local wall-clock time (no zone); parse as local.
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dayKey(iso) {
  return iso.slice(0, 10);
}
