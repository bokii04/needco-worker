import { useApp } from "../context/AppContext";

export default function OnboardingResultScreen() {
  const { worker, navigate } = useApp();

  const autoApproved = worker?.status === "approved";
  const score = worker?.approval_score || 0;
  const faceMatch = worker?.face_match || false;
  const verificationScore = worker?.verification_score || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", padding: 32, background: "var(--bg)", textAlign: "center" }}>
      <div style={{ width: 88, height: 88, background: autoApproved ? "linear-gradient(135deg, var(--gold), var(--gold-mid))" : "var(--bg-3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 24, boxShadow: autoApproved ? "var(--shadow-gold)" : "none" }}>
        {autoApproved ? "🎉" : "⏳"}
      </div>

      <h2 style={{ marginBottom: 8 }}>{autoApproved ? "You're approved!" : "Application submitted!"}</h2>

      <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 1, margin: "0 auto 20px" }} />

      {/* Trust score */}
      <div className="card-gold" style={{ width: "100%", marginBottom: 20, padding: "20px" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Trust Score</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 52, color: score >= 70 ? "var(--gold)" : "var(--warning)", marginBottom: 8 }}>{score}</div>
        <div style={{ height: 8, background: "var(--bg-4)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${score}%`, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 4 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <span className={`badge ${autoApproved ? "badge-success" : "badge-warning"}`}>
            {autoApproved ? "✅ Auto-approved" : "⏳ Manual review"}
          </span>
          {faceMatch && <span className="badge badge-success">✅ Face verified</span>}
          {verificationScore > 0 && <span className="badge badge-gold">AI: {verificationScore}% match</span>}
        </div>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
        {autoApproved
          ? "Your identity has been verified! You can now go online and start accepting jobs in Iloilo City & Pavia."
          : "Our admin team will review your profile within 24 hours. You'll be notified once approved. Upload a clearer ID photo to boost your score."}
      </p>

      <button className="btn btn-gold" style={{ width: "100%" }} onClick={() => navigate("home")}>
        {autoApproved ? "Start working! 🚀" : "Got it, I'll wait!"}
      </button>
    </div>
  );
}
