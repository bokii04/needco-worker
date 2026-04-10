import { useApp } from "../context/AppContext";
import { useNotifications } from "../lib/useNotifications";

export default function BottomNav() {
  const { screen, navigate, user } = useApp();
  const { unread } = useNotifications(user?.id);

  const items = [
    { id: "home", icon: "🏠", label: "Dashboard" },
    { id: "notifications", icon: "🔔", label: "Alerts", badge: unread },
    { id: "earnings", icon: "💰", label: "Earnings" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  return (
    <div className="bottom-nav">
      {items.map(item => (
        <button key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <span className="nav-icon">{item.icon}</span>
            {item.badge > 0 && (
              <div style={{
                position: "absolute", top: -4, right: -6,
                width: 16, height: 16, borderRadius: "50%",
                background: "var(--danger)", color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid var(--bg)"
              }}>
                {item.badge > 9 ? "9+" : item.badge}
              </div>
            )}
          </div>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
