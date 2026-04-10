import { useApp } from "../context/AppContext";

export default function RejectedScreen() {
  const { worker, logout, navigate } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", padding: 32, background: "var(--bg)", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
      <h2 style={{ marginBottom: 8 }}>Application not approved</h2>
      <div style={{ width: 40, height: 2, background: "var(--danger)", borderRadius: 1, margin: "0 auto 20px" }} />

      {worker?.rejection_reason && (
        <div className="card" style={{ width: "100%", marginBottom: 20, borderLeft: "3px solid var(--danger)", textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Reason</div>
          <div style={{ fontSize: 14, color: "var(--text)" }}>{worker.rejection_reason}</div>
        </div>
      )}

      <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
        You can reapply with a clearer ID photo and complete profile. Make sure your selfie matches your ID clearly.
      </p>

      <button className="btn btn-gold" style={{ width: "100%", marginBottom: 12 }} onClick={() => navigate("onboarding")}>
        Reapply →
      </button>
      <button className="btn btn-outline" style={{ width: "100%" }} onClick={logout}>
        Sign out
      </button>
    </div>
  );
}
