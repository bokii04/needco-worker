import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function OnboardingResultScreen() {
  const { user, navigate, setWorker } = useApp();
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWorker(); }, []);

  const fetchWorker = async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data } = await supabase.from("workers").select("*").eq("user_id", user.id).single();
    if (data) { setWorkerData(data); setWorker(data); }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", background: "var(--bg)", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <div style={{ color: "var(--gold)", fontWeight: 600 }}>Submitting application...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", padding: 32, background: "var(--bg)", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
      <h2 style={{ marginBottom: 8 }}>Application submitted!</h2>
      <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 1, margin: "0 auto 20px" }} />
      <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
        Our admin team will review your profile and ID within <strong style={{ color: "var(--gold)" }}>24–48 hours</strong>. You'll be notified once approved.
      </p>
      <button className="btn btn-gold" style={{ width: "100%" }} onClick={() => navigate("pending")}>
        Got it! 👍
      </button>
    </div>
  );
}
