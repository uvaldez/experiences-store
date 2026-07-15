import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ConfigProvider, useConfig } from "./config/ConfigContext.jsx";
import { CheckoutProvider } from "./checkout/CheckoutContext.jsx";
import Home from "./pages/Home.jsx";
import Listings from "./pages/Listings.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import Checkout from "./pages/Checkout.jsx";
import Confirmation from "./pages/Confirmation.jsx";

function Header() {
  const config = useConfig();
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        Experiences
      </Link>
      <nav>
        <Link to="/experiences">Browse</Link>
      </nav>
      {config?.mode === "mock" && (
        <span className="mode-badge" title="No API credentials set — using mock data">
          demo mode
        </span>
      )}
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <CheckoutProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/experiences" element={<Listings />} />
            <Route path="/experiences/:id" element={<ListingDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmation/:cartCode" element={<Confirmation />} />
          </Routes>
        </CheckoutProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}
