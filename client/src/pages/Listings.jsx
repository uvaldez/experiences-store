import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { money, coverImage } from "../lib/format.js";

export default function Listings() {
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    const t = setTimeout(() => {
      api
        .listings(search ? { search } : {})
        .then((res) => active && setItems(res.items || []))
        .catch((err) => active && setError(err.message));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [search]);

  return (
    <main className="page">
      <div className="page-head">
        <h1>Experiences</h1>
        <input
          className="search"
          type="search"
          placeholder="Search experiences…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {!items && !error && <p className="muted">Loading…</p>}
      {items && items.length === 0 && <p className="muted">No experiences found.</p>}

      <div className="grid">
        {items?.map((l) => (
          <Link key={l.id} to={`/experiences/${l.id}`} className="card">
            <div className="card-media">
              {coverImage(l) ? (
                <img src={coverImage(l)} alt={l.title} loading="lazy" />
              ) : (
                <div className="card-media placeholder" />
              )}
              {l.category?.name && <span className="chip">{l.category.name}</span>}
            </div>
            <div className="card-body">
              <h3>{l.title}</h3>
              <p className="muted clamp">{l.summary}</p>
              <div className="card-foot">
                {l.location?.name && <span className="muted">{l.location.name}</span>}
                {!l.hidePrice && (
                  <span className="price">
                    from {money(l.advertisedPrice, l.currency)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
