import { useApp } from "../context/AppContext";
import { useNotifications } from "../lib/useNotifications";

export default function NotificationsScreen() {
  const { navigate, user } = useApp();
  const { notifications, unread, markAllRead, markRead } = useNotifications(user?.id);

  const typeIcon = {
    job_request: "🔔",
    job_accepted: "✅",
    payment: "💰",
    review: "⭐",
    system: "ℹ️",
    general: "📢"
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString("en-PH");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate("home")}>←</button>
        <span className="topbar-title">Notifications</span>
        {unread > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="scroll-body">
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <h3 style={{ marginBottom: 8 }}>No notifications yet</h3>
            <p style={{ color: "var(--text-muted)" }}>You'll be notified when new jobs arrive</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifications.map((n, i) => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{
                display: "flex", gap: 14, padding: "14px 16px",
                background: n.is_read ? "var(--bg-2)" : "var(--gold-light)",
                border: `1px solid ${n.is_read ? "var(--border)" : "var(--border-gold)"}`,
                borderRadius: "var(--radius-md)", cursor: "pointer",
                transition: "all 0.15s"
              }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: n.is_read ? "var(--bg-3)" : "var(--bg-4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {typeIcon[n.type] || "📢"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: 14, color: "var(--text)" }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>{formatTime(n.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{n.body}</div>
                  {!n.is_read && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", marginTop: 8 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
