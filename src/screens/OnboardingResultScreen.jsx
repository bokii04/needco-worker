import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function OnboardingResultScreen() {
  const { user, navigate, setWorker } = useApp();
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorker();
  }, []);

  const fetchWorker = async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase
      .from("workers")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setWorkerData(data);
      setWorker(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", background: "var(--bg)", gap: 16 }}>
        <div style={{ fontSize: 32 }}>🤖</div>
        <div style={{ fontWeight: 600, color: "var(--gold)", fontSize: 14 }}>Processing your application...</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>AI is verifying your identity</div>
      </div>
    );
  }

  const autoApproved = workerData?.status === "approved";
  const score = workerData?.approval_score || 0;
  const faceMatch = workerData?.face_match || false;
  const verificationScore = workerData?.verification_score || 0;

  let verificationResult = null;
  try {
    if (workerData?.verification_result) {
      verificationResult = JSON.parse(workerData.verification_result);
    }
  } catch(e) {}

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", padding: 32, background: "var(--bg)", textAlign: "center" }}>

      {/* Icon */}
      <div style={{
        width: 88, height: 88,
        background: autoApproved ? "linear-gradient(135deg, var(--gold), var(--gold-mid))" : "var(--bg-3)",
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, marginBottom: 24,
        boxShadow: autoApproved ? "var(--shadow-gold)" : "none"
      }}>
        {autoApproved ? "🎉" : "⏳"}
      </div>

      <h2 style={{ marginBottom: 8 }}>
        {autoApproved ? "You're approved!" : "Application submitted!"}
      </h2>
      <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 1, margin: "0 auto 20px" }} />

      {/* Trust score card */}
      <div className="card-gold" style={{ width: "100%", marginBottom: 20, padding: "20px" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Trust Score
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 52, color: score >= 70 ? "var(--gold)" : "var(--warning)", marginBottom: 8 }}>
          {score}
        </div>
        <div style={{ height: 8, background: "var(--bg-4)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${score}%`, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 4, transition: "width 1s ease" }} />
        </div>

        {/* Score breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, textAlign: "left" }}>
          {[
            ["Profile complete", (workerData?.full_name ? 20 : 0), 20],
            ["ID uploaded", (workerData?.id_photo_url ? 30 : 0), 30],
            ["Skills selected", (workerData?.skills?.length > 0 ? 20 : 0), 20],
            ["Experience stated", (workerData?.experience ? 20 : 0), 20],
            ["Selfie uploaded", (workerData?.selfie_url ? 10 : 0), 10],
          ].map(([label, earned, max]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: earned === max ? "var(--gold)" : "var(--text-muted)" }}>
                {earned}/{max} pts
              </span>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <span className={`badge ${autoApproved ? "badge-success" : "badge-warning"}`}>
            {autoApproved ? "✅ Auto-approved" : "⏳ Manual review"}
          </span>
          {faceMatch && <span className="badge badge-success">✅ Face verified</span>}
          {verificationScore > 0 && (
            <span className="badge badge-gold">🤖 AI: {verificationScore}% match</span>
          )}
        </div>
      </div>

      {/* AI verification details */}
      {verificationResult && (
        <div className="card" style={{ width: "100%", marginBottom: 20, textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 10 }}>
            🤖 AI Verification Result
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.6 }}>
            {verificationResult.summary}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["Face match", verificationResult.face_match ? "✅ Yes" : "❌ No", verificationResult.face_match],
              ["ID looks real", verificationResult.id_looks_real ? "✅ Yes" : "⚠️ Needs review", verificationResult.id_looks_real],
              ["ID type", verificationResult.id_type_detected || "Unknown", true],
              ["Match confidence", `${verificationResult.match_confidence}%`, verificationResult.match_confidence >= 70],
            ].map(([label, val, ok]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: ok ? "var(--gold)" : "var(--warning)" }}>{val}</span>
              </div>
            ))}
          </div>
          {verificationResult.flags?.length > 0 && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--warning-bg)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--warning)", marginBottom: 4 }}>⚠️ Flags</div>
              {verificationResult.flags.map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--text-muted)" }}>• {f}</div>
              ))}
            </div>
          )}
        </div>
      )}

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
