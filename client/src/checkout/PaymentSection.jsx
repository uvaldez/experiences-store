import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { money } from "../lib/format.js";

// Real Stripe requires a publishable key and a live payment-intent secret.
function isLiveStripe(config, mountSecret) {
  const key = config?.stripePublishableKey;
  return Boolean(key && mountSecret && !mountSecret.startsWith("pi_mock"));
}

function StripeForm({ amount, currency, onBook, onPaid, onFailed }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  async function pay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);

    // Validate the card details before we create a booking.
    const submit = await elements.submit();
    if (submit.error) {
      setError(submit.error.message);
      setBusy(false);
      return;
    }

    // Create the booking (holds inventory), then charge — the documented order.
    let booking;
    try {
      booking = await onBook();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      return;
    }

    const { paymentIntent, error: payErr } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (payErr) {
      setError(payErr.message);
      setBusy(false);
      onFailed();
      return;
    }
    if (paymentIntent?.status === "succeeded") onPaid(booking);
    else {
      setError(`Payment status: ${paymentIntent?.status}`);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={pay} className="card-form">
      <h2>Payment</h2>
      <PaymentElement
        onReady={() => setReady(true)}
        onLoadError={(e) =>
          setError(
            e?.error?.message ||
              "Could not load the payment form. Check that STRIPE_PUBLISHABLE_KEY belongs to the same Stripe account as the brand's payment platform."
          )
        }
      />
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary full" disabled={!stripe || !ready || busy}>
        {busy ? "Processing…" : `Pay ${money(amount, currency)}`}
      </button>
    </form>
  );
}

function SimulatedForm({ amount, currency, onBook, onPaid, onFailed }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function pay(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    let booking;
    try {
      booking = await onBook();
    } catch (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    await new Promise((r) => setTimeout(r, 900));
    onPaid(booking);
  }

  return (
    <form onSubmit={pay} className="card-form">
      <h2>Payment</h2>
      <p className="notice">
        Demo mode — no real charge. In live mode this is a Stripe Elements card
        form. Card data would go straight to Stripe; the API never sees it.
      </p>
      <div className="fake-card">
        <input value="4242 4242 4242 4242" readOnly />
        <div className="row">
          <input value="12 / 34" readOnly />
          <input value="123" readOnly />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="btn btn-primary full" disabled={busy}>
          {busy ? "Processing…" : `Pay ${money(amount, currency)}`}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={onFailed}
        >
          Simulate failure
        </button>
      </div>
    </form>
  );
}

export default function PaymentSection({
  config,
  mountSecret,
  amount,
  currency,
  onBook,
  onPaid,
  onFailed,
}) {
  const live = isLiveStripe(config, mountSecret);
  const key = config?.stripePublishableKey;
  const stripePromise = useMemo(() => (live ? loadStripe(key) : null), [live, key]);

  if (live) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret: mountSecret }}>
        <StripeForm
          amount={amount}
          currency={currency}
          onBook={onBook}
          onPaid={onPaid}
          onFailed={onFailed}
        />
      </Elements>
    );
  }
  return (
    <SimulatedForm
      amount={amount}
      currency={currency}
      onBook={onBook}
      onPaid={onPaid}
      onFailed={onFailed}
    />
  );
}
