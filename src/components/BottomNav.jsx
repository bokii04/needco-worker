import { useApp } from "../context/AppContext";

export default function BottomNav() {
  const { screen, navigate } = useApp();
  const items = [
    { id: "home", icon: "🏠", label: "Dashboard" },
    { id: "earnings", icon: "💰", label: "Earnings" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  return (
    <div className="bottom-nav">
      {items.map(item => (
        <button key={item.id} className={`nav-item ${screen === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
