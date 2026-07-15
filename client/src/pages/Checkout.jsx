import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useCheckout } from "../checkout/CheckoutContext.jsx";
import { useConfig } from "../config/ConfigContext.jsx";
import { money } from "../lib/format.js";
import PaymentSection from "../checkout/PaymentSection.jsx";

export default function Checkout() {
  const { draft, setDraft } = useCheckout();
  const config = useConfig();
  const navigate = useNavigate();

  const [purchaser, setPurchaser] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
  });
  const [cartId, setCartId] = useState(null);
  const [payment, setPayment] = useState(null); // { secret, total } from the payment intent
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!draft && !done) navigate("/experiences", { replace: true });
  }, [draft, done, navigate]);

  useEffect(() => {
    const g = draft?.item?.participants?.[0];
    if (g) setPurchaser((p) => ({ ...p, firstName: g.firstName, lastName: g.lastName }));
  }, [draft]);

  if (!draft) return null;
  const currency = draft.listing.currency || "USD";
  const total = payment?.total ?? draft.subtotal;

  const purchaserValid =
    purchaser.firstName.trim() &&
    purchaser.lastName.trim() &&
    /\S+@\S+\.\S+/.test(purchaser.emailAddress);

  // Step 6: price the cart and get a secret to mount the payment form.
  // This creates NO booking and holds no inventory.
  async function toPayment(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { cartId: newCartId } = await api.newCart();
      const pi = await api.paymentIntent({ cartId: newCartId, data: [draft.item] });
      setCartId(newCartId);
      setPayment({ secret: pi.data.paymentIntentSecret, total: pi.data.totalNetAmount });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Step 7: create the booking — invoked on Pay, immediately before the charge.
  async function bookNow() {
    const res = await api.book({
      cartId,
      purchaser,
      data: [draft.item],
      paymentMethod: "credit-card",
      siteLanguage: "en",
      deviceType: "pc",
    });
    return res.data; // { confirmationCode (cart), amount, clientSecret, ... }
  }

  function onPaid(booking) {
    // Payment settled client-side; Way finalizes via its Stripe webhook, which
    // may lag a few seconds. Hand a summary to the confirmation page so it can
    // show something immediately while it polls for the finalized booking.
    const fallback = {
      title: draft.listing.title,
      sessionLabel: draft.sessionLabel,
      amount: booking.amount ?? draft.subtotal,
      currency,
      guests: draft.item.participants.length,
      email: purchaser.emailAddress,
    };
    setDone(true);
    setDraft(null);
    navigate(`/confirmation/${booking.confirmationCode}`, { state: { fallback } });
  }

  async function onFailed() {
    // A cart with a payment attempt is not reusable — release it and restart.
    if (cartId) await api.discardCart(cartId).catch(() => {});
    setPayment(null);
    setCartId(null);
    setError("Payment failed — your cart was released. Please try again.");
  }

  return (
    <main className="page checkout">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <div className="checkout-main">
          {!payment ? (
            <form onSubmit={toPayment} className="card-form">
              <h2>Your details</h2>
              <div className="row">
                <input
                  placeholder="First name"
                  value={purchaser.firstName}
                  onChange={(e) =>
                    setPurchaser({ ...purchaser, firstName: e.target.value })
                  }
                />
                <input
                  placeholder="Last name"
                  value={purchaser.lastName}
                  onChange={(e) =>
                    setPurchaser({ ...purchaser, lastName: e.target.value })
                  }
                />
              </div>
              <input
                placeholder="Email address"
                type="email"
                value={purchaser.emailAddress}
                onChange={(e) =>
                  setPurchaser({ ...purchaser, emailAddress: e.target.value })
                }
              />
              <input
                placeholder="Phone number (optional)"
                value={purchaser.phoneNumber}
                onChange={(e) =>
                  setPurchaser({ ...purchaser, phoneNumber: e.target.value })
                }
              />
              {error && <p className="error">{error}</p>}
              <button
                className="btn btn-primary full"
                disabled={!purchaserValid || busy}
              >
                {busy ? "Preparing…" : "Continue to payment"}
              </button>
            </form>
          ) : (
            <PaymentSection
              config={config}
              mountSecret={payment.secret}
              amount={total}
              currency={currency}
              onBook={bookNow}
              onPaid={onPaid}
              onFailed={onFailed}
            />
          )}
        </div>

        <aside className="summary">
          <h2>Order summary</h2>
          {draft.listing.image && (
            <img className="summary-img" src={draft.listing.image} alt="" />
          )}
          <h3>{draft.listing.title}</h3>
          <p className="muted">{draft.sessionLabel}</p>
          <ul className="summary-lines">
            {draft.item.participants.map((p, i) => (
              <li key={i}>
                <span>
                  {p.firstName} {p.lastName} · {p.priceTierName}
                </span>
              </li>
            ))}
          </ul>
          <div className="subtotal">
            <span>Total</span>
            <span>{money(total, currency)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
