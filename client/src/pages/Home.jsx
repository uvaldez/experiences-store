import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow">Digital Experiences</p>
        <h1>Welcome to Experiences</h1>
        <p className="tagline">
          Discover and book unforgettable experiences — sailing at sunset, rooftop
          tastings, stargazing, and more.
        </p>
        <Link to="/experiences" className="btn btn-primary">
          Browse experiences
        </Link>
      </section>
    </main>
  );
}
