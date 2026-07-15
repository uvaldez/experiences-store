import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { money, formatSession } from "../lib/format.js";

const MAX_ATTEMPTS = 12;

export default function Confirmation() {
  const { cartCode } = useParams();
  const { state } = useLocation();
  const fallback = state?.fallback || null;

  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | found | pending
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    let attempts = 0;
    setStatus("loading");

    async function poll() {
      attempts++;
      try {
        const res = await api.bookings({ cartConfirmationCode: cartCode });
        if (!active) return;
        if (res.items?.[0]) {
          setBooking(res.items[0]);
          setStatus("found");
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      if (!active) return;
      if (attempts >= MAX_ATTEMPTS) {
        setStatus("pending");
        return;
      }
      setTimeout(poll, 1500);
    }

    poll();
    return () => {
      active = false;
    };
  }, [cartCode, reload]);

  // Finalized booking — the happy path.
  if (status === "found" && booking) {
    return (
      <main className="page confirmation">
        <div className="confirm-card">
          <div className="check">✓</div>
          <h1>Booking confirmed</h1>
          <p className="muted">
            A confirmation has been sent to {booking.purchaser?.emailAddress}.
          </p>

          <div className="confirm-row">
            <span>Confirmation code</span>
            <strong>{booking.confirmationCode}</strong>
          </div>
          <div className="confirm-row">
            <span>Experience</span>
            <strong>{booking.experience?.title}</strong>
          </div>
          <div className="confirm-row">
            <span>When</span>
            <strong>{formatSession(booking.event?.startDateTime)}</strong>
          </div>
          <div className="confirm-row">
            <span>Guests</span>
            <strong>{booking.participants?.length}</strong>
          </div>
          <div className="confirm-row total">
            <span>Paid</span>
            <strong>{money(booking.amount, booking.currency)}</strong>
          </div>

          <Link to="/experiences" className="btn btn-primary full">
            Browse more experiences
          </Link>
        </div>
      </main>
    );
  }

  // Payment succeeded, booking still finalizing (webhook lag) or timed out.
  const finalizing = status === "loading";
  return (
    <main className="page confirmation">
      <div className="confirm-card">
        <div className={`check ${finalizing ? "spin" : "pending"}`}>
          {finalizing ? "◍" : "✓"}
        </div>
        <h1>{finalizing ? "Finalizing your booking" : "Payment received"}</h1>
        <p className="muted">
          {finalizing
            ? "Your payment went through — we're confirming your booking with the provider."
            : `Your booking is being finalized. A confirmation email will be sent to ${
                fallback?.email || "you"
              } shortly.`}
        </p>

        {fallback && (
          <>
            <div className="confirm-row">
              <span>Experience</span>
              <strong>{fallback.title}</strong>
            </div>
            <div className="confirm-row">
              <span>When</span>
              <strong>{fallback.sessionLabel}</strong>
            </div>
            <div className="confirm-row">
              <span>Guests</span>
              <strong>{fallback.guests}</strong>
            </div>
            <div className="confirm-row total">
              <span>Paid</span>
              <strong>{money(fallback.amount, fallback.currency)}</strong>
            </div>
          </>
        )}

        <div className="confirm-row">
          <span>Reference</span>
          <strong>{cartCode}</strong>
        </div>

        {!finalizing && (
          <button className="btn btn-primary full" onClick={() => setReload((n) => n + 1)}>
            Check again
          </button>
        )}
        <Link to="/experiences" className="btn btn-ghost full">
          Back to experiences
        </Link>
      </div>
    </main>
  );
}
