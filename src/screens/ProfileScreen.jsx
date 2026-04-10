import { useApp } from "../context/AppContext";

export default function ProfileScreen() {
  const { user, worker, logout, navigate } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      <div className="topbar">
        <span className="topbar-title">Profile</span>
      </div>

      <div className="scroll-body">
        {/* Profile header */}
        <div className="fade-up card-gold" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gold)" }} />
          ) : (
            <div className="avatar" style={{ width: 64, height: 64, background: "var(--gold)", color: "var(--bg)", fontSize: 22, fontWeight: 700 }}>
              {user?.initials || "WK"}
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "var(--text)" }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>{user?.email}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <span className="badge badge-gold">Worker</span>
              {worker?.status === "approved" && <span className="badge badge-success">✓ Verified</span>}
              {worker?.status === "pending" && <span className="badge badge-warning">⏳ Pending</span>}
            </div>
          </div>
        </div>

        {/* Worker stats */}
        <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            ["Jobs", worker?.total_jobs || 0],
            ["Rating", `${worker?.rating || 0}★`],
            ["Score", `${worker?.approval_score || 0}pts`],
          ].map(([l, v]) => (
            <div key={l} className="card" style={{ textAlign: "center", padding: "14px 8px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "var(--gold)", marginBottom: 4 }}>{v}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Skills */}
        {worker?.skills && (
          <>
            <p className="section-label fade-up-2">My skills</p>
            <div className="fade-up-2" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {worker.skills.map(s => <span key={s} className="badge badge-gold">{s}</span>)}
            </div>
          </>
        )}

        {/* Account */}
        <p className="section-label fade-up-3">Account</p>
        <div className="fade-up-3 card" style={{ marginBottom: 20 }}>
          {[
            ["Email", user?.email || "—"],
            ["City", worker?.city || "Iloilo City"],
            ["Experience", worker?.experience || "—"],
            ["App version", "Need.co Worker v2.0"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{k}</span>
              <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="fade-up-4 card" style={{ marginBottom: 20 }}>
          {["Notifications", "Payment details", "Help & support", "Terms of service"].map((item, i, arr) => (
            <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
              <span style={{ fontSize: 14, color: "var(--text)" }}>{item}</span>
              <span style={{ color: "var(--text-muted)" }}>›</span>
            </div>
          ))}
        </div>

        {!worker && (
          <button className="btn btn-gold fade-up-4" style={{ marginBottom: 12 }} onClick={() => navigate("register")}>
            Complete worker profile →
          </button>
        )}

        <button className="btn btn-danger fade-up-5" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
