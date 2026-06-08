"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

export function PushSubscriber() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        setRegistration(reg);
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
          }
        });
      });
    }
  }, []);

  const subscribeButtonOnClick = async () => {
    if (!registration) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Notification permission denied");
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);
      setIsSubscribed(true);

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!res.ok) {
         throw new Error("Failed to save subscription on server");
      }

      alert("Successfully subscribed to notifications!");
    } catch (error) {
      console.error("Failed to subscribe to push notifications", error);
      alert("Failed to subscribe. Please ensure notifications are allowed.");
    }
  };

  const unsubscribeButtonOnClick = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);
      // We aren't implementing the DELETE route for brevity, but it could be added.
      alert("Unsubscribed from notifications.");
    }
  };

  return (
    <button
      onClick={isSubscribed ? unsubscribeButtonOnClick : subscribeButtonOnClick}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
    >
      {isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {isSubscribed ? "Disable Notifications" : "Enable Notifications"}
    </button>
  );
}
