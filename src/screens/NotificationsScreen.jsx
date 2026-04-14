import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function NotificationsScreen() {
  const { navigate, user } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchNotifications();
  }, [user?.id]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const typeIcon = { job_request: "🔔", job_accepted: "✅", payment: "💰", review: "⭐", system: "ℹ️", general: "📢" };

  const formatTime = (ts) => {
    const diff = Math.floor((new Date() - new Date(ts)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return Math.floor(diff/60) + "m ago";
    if (diff < 86400) return Math.floor(diff/3600) + "h ago";
    return new Date(ts).toLocaleDateString("en-PH");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate("home")}>←</button>
        <span className="topbar-title">Notifications</span>
        {notifications.some(n => !n.is_read) && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      <div className="scroll-body">
        {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading...</div>}

        {!loading && notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <h3 style={{ marginBottom: 8 }}>No notifications yet</h3>
            <p style={{ color: "var(--text-muted)" }}>You'll be notified when new jobs arrive</p>
          </div>
        )}

        {notifications.map(n => (
          <div key={n.id} style={{
            display: "flex", gap: 14, padding: "14px 16px",
            background: n.is_read ? "var(--bg-2)" : "var(--gold-light)",
            border: "1px solid " + (n.is_read ? "var(--border)" : "var(--border-gold)"),
            borderRadius: "var(--radius-md)", marginBottom: 8,
            cursor: "pointer"
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: n.is_read ? "var(--bg-3)" : "var(--bg-4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {typeIcon[n.type] || "📢"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: 14, color: "var(--text)" }}>{n.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>{formatTime(n.created_at)}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
