import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNotifications } from "./lib/notifications";

async function clearLegacyPwaCache() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

void clearLegacyPwaCache().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
  initNotifications();
});
