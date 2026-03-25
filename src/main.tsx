import { createRoot } from "react-dom/client";

console.log("[BOOT] main.tsx loaded at", new Date().toISOString());

import App from "./App.tsx";
import "./index.css";
import { initNotifications } from "./lib/notifications";

async function clearLegacyPwaCache() {
  console.log("[BOOT] clearLegacyPwaCache start");
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  console.log("[BOOT] clearLegacyPwaCache done");
}

void clearLegacyPwaCache().finally(() => {
  console.log("[BOOT] rendering app");
  createRoot(document.getElementById("root")!).render(<App />);
  initNotifications();
});
