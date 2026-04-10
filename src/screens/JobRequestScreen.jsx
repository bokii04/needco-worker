import { useApp } from "../context/AppContext";

export default function JobRequestScreen() {
  const { navigate, activeJob, setActiveJob } = useApp();

  if (!activeJob) {
    navigate("home");
    return null;
  }

  const accept = () => navigate("activejob");
  const decline = () => { setActiveJob(null); navigate("home"); };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <h2 style={{ marginBottom: 6 }}>New job request!</h2>
          <p style={{ color: "var(--text-muted)" }}>Review the details below</p>
        </div>

        <div className="card-gold" style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "var(--gold)", marginBottom: 10 }}>{activeJob.service}</div>
          <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>{activeJob.desc}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>📍 {activeJob.address} · {activeJob.distance}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>🕐 {activeJob.when}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>👤 {activeJob.customer}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 36, color: "var(--gold)", textAlign: "center" }}>₱{activeJob.price}</div>
        </div>

        <button className="btn btn-gold" style={{ marginBottom: 10 }} onClick={accept}>✓ Accept job</button>
        <button className="btn btn-danger" onClick={decline}>✗ Decline</button>
      </div>
    </div>
  );
}
