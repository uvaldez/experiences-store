import { createContext, useContext, useState } from "react";

const CheckoutContext = createContext(null);
const KEY = "checkout-draft";

function load() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export function CheckoutProvider({ children }) {
  const [draft, setDraftState] = useState(load);

  const setDraft = (next) => {
    setDraftState(next);
    if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
    else sessionStorage.removeItem(KEY);
  };

  return (
    <CheckoutContext.Provider value={{ draft, setDraft }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within CheckoutProvider");
  return ctx;
}
