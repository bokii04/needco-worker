import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    requestPermission();

    // Realtime listener
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnread(prev => prev + 1);
        showBrowserNotification(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnread(data.filter(n => !n.is_read).length);
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const showBrowserNotification = (notif) => {
    if (Notification.permission === "granted") {
      new Notification(notif.title, {
        body: notif.body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
      });
    }
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  return { notifications, unread, permission, markAllRead, markRead, requestPermission };
}

export async function sendNotification(userId, title, body, type = "general", data = {}) {
  await supabase.from("notifications").insert({ user_id: userId, title, body, type, data });
}
