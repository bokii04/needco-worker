import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function PendingScreen() {
  const { user, worker, logout, setWorker, navigate } = useApp();
  const [timeLeft, setTimeLeft] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!worker?.created_at) return;
    const deadline = new Date(new Date(worker.created_at).getTime() + 48 * 60 * 60 * 1000);
    const update = () => {
      const now = new Date();
      const diff = deadline - now;
      if (diff <= 0) { setTimeLeft({ hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [worker]);

  const checkStatus = async () => {
    setChecking(true);
    const { data } = await supabase.from("workers").select("*").eq("user_id", user.id).single();
    if (data) {
      setWorker(data);
      if (data.status === "approved") navigate("home");
      else if (data.status === "rejected") navigate("rejected");
    }
    setChecking(false);
  };

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)", minHeight: "100vh" }}>

      {/* Top bar */}
      <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, var(--gold), var(--gold-mid))", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "var(--bg)" }}>N</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Need.co</div>
        </div>
        <button onClick={logout} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Sign out</button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>

        {/* Animated hourglass */}
        <div style={{ width: 100, height: 100, background: "var(--bg-2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, marginBottom: 24, border: "2px solid var(--border-gold)", boxShadow: "var(--shadow-gold)" }}>
          ⏳
        </div>

        <h2 style={{ marginBottom: 8, fontSize: 22 }}>Under Review</h2>
        <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 1, margin: "0 auto 16px" }} />
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 320 }}>
          Need.co is reviewing your application. Our team is verifying your ID and profile details.
        </p>

        {/* Countdown */}
        {timeLeft && (
          <div className="card-gold" style={{ width: "100%", marginBottom: 24, padding: "24px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Estimated review time
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              {[["Hours", timeLeft.hours], ["Minutes", timeLeft.minutes], ["Seconds", timeLeft.seconds]].map(([label, val]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 36, color: "var(--gold)", lineHeight: 1, marginBottom: 6, minWidth: 60 }}>
                    {pad(val)}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status steps */}
        <div className="card" style={{ width: "100%", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 14 }}>Application status</div>
          {[
            { label: "Application submitted", done: true, icon: "✅" },
            { label: "ID verification in progress", done: false, active: true, icon: "🔍" },
            { label: "Admin review", done: false, icon: "👤" },
            { label: "Approval notification", done: false, icon: "🔔" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  background: s.done ? "var(--gold)" : s.active ? "var(--bg-3)" : "var(--bg-2)",
                  border: s.active ? "1.5px solid var(--gold)" : "none",
                  boxShadow: s.active ? "var(--shadow-gold)" : "none",
                  color: s.done ? "var(--bg)" : "var(--text)"
                }}>
                  {s.done ? "✓" : s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: s.active ? 700 : 400, color: s.done || s.active ? "var(--text)" : "var(--text-muted)" }}>{s.label}</div>
                  {s.active && <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 2, fontWeight: 600 }}>In progress...</div>}
                </div>
              </div>
              {i < 3 && <div style={{ width: 2, height: 12, background: s.done ? "var(--gold)" : "var(--border)", marginLeft: 17, opacity: 0.5 }} />}
            </div>
          ))}
        </div>

        {/* What to expect */}
        <div className="card" style={{ width: "100%", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 12 }}>What happens next?</div>
          {[
            ["📱", "You'll receive a notification once approved"],
            ["✅", "You can start accepting jobs immediately after approval"],
            ["⭐", "Complete more jobs to build your rating and earn more"],
            ["💰", "Payments are released after each completed job"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-gold" style={{ width: "100%", marginBottom: 10 }} onClick={checkStatus} disabled={checking}>
          {checking ? "Checking status..." : "🔄 Check approval status"}
        </button>

        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Questions? Contact us at{" "}
          <a href="mailto:support@needco.ph" style={{ color: "var(--gold)", textDecoration: "none" }}>support@needco.ph</a>
        </p>

      </div>
    </div>
  );
}
