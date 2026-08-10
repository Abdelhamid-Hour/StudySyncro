import { getLang } from "../../../../main_assets/js/i18n.mjs";
import { sendData } from "../../../../main_assets/js/utils.mjs";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const initPushNotifications = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push messaging is not supported in this browser.");
    return;
  }

  try {
    // 1. Fetch VAPID public key (use cached if available)
    let publicKey = localStorage.getItem("vapid_public_key");
    if (!publicKey) {
      const vapidData = await sendData(
        "/api/notifications/vapidPublicKey",
        null,
        "GET",
      );
      publicKey = vapidData.publicKey;
      localStorage.setItem("vapid_public_key", publicKey);
    }

    // 2. Register Service Worker
    const registration = await navigator.serviceWorker.register("/sw.mjs", {
      type: "module",
    });
    console.log("Service Worker registered successfully.");

    // 3. Ask for permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied.");
      return;
    }

    // 4. Subscribe to Push Manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // 5. Send subscription to backend ONLY if it changed or language changed
    const currentLang = getLang();
    const subHash = JSON.stringify(subscription) + "_" + currentLang;

    if (localStorage.getItem("cached_push_sub") === subHash) {
      console.log("Push subscription already synced for this language.");
      return;
    }

    await sendData("/api/notifications/subscribe", { subscription }, "POST");
    localStorage.setItem("cached_push_sub", subHash);
    console.log("Successfully subscribed to push notifications!");
  } catch (error) {
    console.error("Error during push subscription:", error);
  }
};
