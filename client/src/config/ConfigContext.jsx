import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.config().then(setConfig).catch(() => setConfig({ currency: "USD", mode: "mock" }));
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}
