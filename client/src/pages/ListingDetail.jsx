import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useCheckout } from "../checkout/CheckoutContext.jsx";
import { money, coverImage, formatSession, dayKey } from "../lib/format.js";

function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setDraft } = useCheckout();

  const [listing, setListing] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState(null);

  const [selectedDay, setSelectedDay] = useState(null);
  const [session, setSession] = useState(null);
  const [quantities, setQuantities] = useState({}); // tierName -> count
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]); // {firstName,lastName,answers:{qid:{value,key}}}

  useEffect(() => {
    setError(null);
    api.listing(id).then((r) => setListing(r.data)).catch((e) => setError(e.message));
    api
      .sessions(id, { from: isoDate(1), to: isoDate(31) })
      .then((r) => setSessions(r.data?.sessions || []))
      .catch((e) => setError(e.message));
  }, [id]);

  const days = useMemo(() => {
    if (!sessions) return [];
    const map = new Map();
    for (const s of sessions) {
      if (s.status !== "OPEN") continue;
      const k = dayKey(s.startDateTime);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    }
    return [...map.entries()].sort();
  }, [sessions]);

  const daySlots = days.find(([k]) => k === selectedDay)?.[1] || [];
  const totalGuests = Object.values(quantities).reduce((a, b) => a + b, 0);

  function chooseSession(s) {
    setSession(s);
    setQuantities({});
    setParticipants([]);
    api
      .customQuestions(s.experienceId)
      .then((r) => setQuestions(r.items || []))
      .catch(() => setQuestions([]));
  }

  function setTierQty(tier, delta) {
    setQuantities((q) => {
      const next = { ...q };
      const val = Math.max(0, (next[tier.name] || 0) + delta);
      const cap = Math.min(tier.maxQuantity ?? 99, session.capacity - session.participantCount);
      const others = Object.entries(next)
        .filter(([n]) => n !== tier.name)
        .reduce((a, [, v]) => a + v, 0);
      next[tier.name] = Math.min(val, Math.max(0, cap - others));
      return next;
    });
  }

  // Keep participant rows in sync with total guest count.
  useEffect(() => {
    setParticipants((prev) => {
      const flat = [];
      for (const tier of session?.priceTiers || []) {
        for (let i = 0; i < (quantities[tier.name] || 0); i++) {
          flat.push({ priceTierName: tier.name });
        }
      }
      return flat.map((slot, i) => ({
        firstName: prev[i]?.firstName || "",
        lastName: prev[i]?.lastName || "",
        answers: prev[i]?.answers || {},
        priceTierName: slot.priceTierName,
      }));
    });
  }, [quantities, session]);

  const subtotal = useMemo(() => {
    if (!session) return 0;
    return (session.priceTiers || []).reduce(
      (sum, t) => sum + (quantities[t.name] || 0) * t.price,
      0
    );
  }, [session, quantities]);

  function updateParticipant(i, field, value) {
    setParticipants((p) =>
      p.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))
    );
  }

  function updateAnswer(i, q, value, key) {
    setParticipants((p) =>
      p.map((row, idx) =>
        idx === i
          ? { ...row, answers: { ...row.answers, [q.questionId]: { value, key } } }
          : row
      )
    );
  }

  const canContinue =
    session &&
    totalGuests > 0 &&
    participants.every((p) => p.firstName.trim() && p.lastName.trim()) &&
    participants.every((p) =>
      questions.every((q) => !q.required || p.answers[q.questionId]?.value)
    );

  function proceed() {
    setDraft({
      listing: {
        id: listing.id,
        title: listing.title,
        currency: listing.currency || "USD",
        image: coverImage(listing, 640),
      },
      item: {
        experienceId: session.experienceId,
        sessionTime: session.startDateTime,
        sessionDuration: session.duration,
        mode: listing.bookingAvailabilityMode === "private" ? "private" : "shared",
        participants: participants.map((p) => ({
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          priceTierName: p.priceTierName,
          customQuestionResponses: Object.entries(p.answers).map(([questionId, a]) => ({
            questionId,
            answer: [{ value: a.value, key: a.key ?? null }],
          })),
        })),
      },
      sessionLabel: formatSession(session.startDateTime),
      subtotal,
    });
    navigate("/checkout");
  }

  if (error) return <main className="page"><p className="error">{error}</p></main>;
  if (!listing) return <main className="page"><p className="muted">Loading…</p></main>;

  return (
    <main className="page detail">
      <div className="detail-hero">
        {coverImage(listing, 750) && (
          <img src={coverImage(listing, 750)} alt={listing.title} />
        )}
      </div>

      <div className="detail-grid">
        <div>
          <h1>{listing.title}</h1>
          {listing.location?.name && <p className="muted">{listing.location.name}</p>}
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: listing.description || "" }}
          />
        </div>

        <aside className="booking-box">
          <h2>Book this experience</h2>

          {!sessions && <p className="muted">Loading availability…</p>}
          {sessions && days.length === 0 && (
            <p className="muted">No upcoming availability.</p>
          )}

          {days.length > 0 && (
            <>
              <label className="field-label">Choose a date</label>
              <div className="chips">
                {days.map(([k]) => (
                  <button
                    key={k}
                    className={`chip-btn ${selectedDay === k ? "active" : ""}`}
                    onClick={() => {
                      setSelectedDay(k);
                      setSession(null);
                    }}
                  >
                    {new Date(k + "T00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </button>
                ))}
              </div>
            </>
          )}

          {selectedDay && (
            <>
              <label className="field-label">Choose a time</label>
              <div className="chips">
                {daySlots.map((s) => (
                  <button
                    key={s.startDateTime}
                    className={`chip-btn ${
                      session?.startDateTime === s.startDateTime ? "active" : ""
                    }`}
                    onClick={() => chooseSession(s)}
                  >
                    {new Date(s.startDateTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            </>
          )}

          {session && (
            <>
              <label className="field-label">Guests</label>
              {session.priceTiers.map((t) => (
                <div key={t.name} className="tier-row">
                  <div>
                    <div className="tier-name">{t.name}</div>
                    <div className="muted small">{money(t.price, listing.currency)}</div>
                  </div>
                  <div className="stepper">
                    <button onClick={() => setTierQty(t, -1)} aria-label="decrease">
                      −
                    </button>
                    <span>{quantities[t.name] || 0}</span>
                    <button onClick={() => setTierQty(t, 1)} aria-label="increase">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {participants.length > 0 && (
            <div className="participants">
              <label className="field-label">Guest details</label>
              {participants.map((p, i) => (
                <div key={i} className="participant">
                  <div className="row">
                    <input
                      placeholder="First name"
                      value={p.firstName}
                      onChange={(e) => updateParticipant(i, "firstName", e.target.value)}
                    />
                    <input
                      placeholder="Last name"
                      value={p.lastName}
                      onChange={(e) => updateParticipant(i, "lastName", e.target.value)}
                    />
                  </div>
                  <div className="tier-tag">{p.priceTierName}</div>
                  {questions.map((q) => (
                    <div key={q.questionId} className="question">
                      <label>
                        {q.label}
                        {q.required && " *"}
                      </label>
                      {q.type === "select" ? (
                        <select
                          value={p.answers[q.questionId]?.key || ""}
                          onChange={(e) => {
                            const opt = q.options.find((o) => o.key === e.target.value);
                            updateAnswer(i, q, opt?.value || "", opt?.key || null);
                          }}
                        >
                          <option value="">Select…</option>
                          {q.options.map((o) => (
                            <option key={o.key} value={o.key}>
                              {o.value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={p.answers[q.questionId]?.value || ""}
                          onChange={(e) => updateAnswer(i, q, e.target.value, null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {totalGuests > 0 && (
            <div className="subtotal">
              <span>Subtotal</span>
              <span>{money(subtotal, listing.currency)}</span>
            </div>
          )}

          <button
            className="btn btn-primary full"
            disabled={!canContinue}
            onClick={proceed}
          >
            Continue to checkout
          </button>
        </aside>
      </div>
    </main>
  );
}
