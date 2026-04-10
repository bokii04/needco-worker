import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function PendingScreen() {
  const { user, worker, logout, setWorker, navigate } = useApp();
  const [timeLeft, setTimeLeft] = useState(null);
  const [checking, setChecking] = useState(false);
  const [justApproved, setJustApproved] = useState(false);
  const channelRef = useRef(null);

  // Realtime listener — instant redirect when admin approves
  useEffect(() => {
    if (!worker?.id) return;

    channelRef.current = supabase
      .channel(`worker_status_${worker.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "workers",
          filter: `id=eq.${worker.id}`,
        },
        (payload) => {
          const updated = payload.new;
          console.log("Worker status updated:", updated.status);
          setWorker(updated);

          if (updated.status === "approved") {
            setJustApproved(true);
            setTimeout(() => navigate("home"), 2500);
          } else if (updated.status === "rejected") {
            navigate("rejected");
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [worker?.id]);

  // Countdown timer
  useEffect(() => {
    if (!worker?.created_at) return;
    const deadline = new Date(new Date(worker.created_at).getTime() + 48 * 60 * 60 * 1000);
    const update = () => {
      const diff = deadline - new Date();
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

  // Manual check
  const checkStatus = async () => {
    setChecking(true);
    const { data } = await supabase
      .from("workers").select("*").eq("user_id", user.id).single();
    if (data) {
      setWorker(data);
      if (data.status === "approved") {
        setJustApproved(true);
        setTimeout(() => navigate("home"), 2500);
      } else if (data.status === "rejected") {
        navigate("rejected");
      }
    }
    setChecking(false);
  };

  const pad = (n) => String(n).padStart(2, "0");

  // Approved animation screen
  if (justApproved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 32, textAlign: "center" }}>
        <div style={{ width: 100, height: 100, background: "linear-gradient(135deg, var(--gold), var(--gold-mid))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, marginBottom: 24, boxShadow: "var(--shadow-gold)", animation: "pulse 1s infinite" }}>
          🎉
        </div>
        <h2 style={{ marginBottom: 8, color: "var(--gold)" }}>You're approved!</h2>
        <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 1, margin: "0 auto 16px" }} />
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>
          Welcome to Need.co! Redirecting you to your dashboard...
        </p>
        <div style={{ marginTop: 20, display: "flex", gap: 6, justifyContent: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", animation: `pulse 1s ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)", minHeight: "100vh" }}>

      {/* Top bar */}
      <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, var(--gold), var(--gold-mid))", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "var(--bg)" }}>N</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Need.co</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="badge badge-warning" style={{ animation: "pulse 2s infinite" }}>⏳ Pending</span>
          <button onClick={logout} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Sign out</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>

        {/* Icon */}
        <div style={{ width: 100, height: 100, background: "var(--bg-2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, marginBottom: 24, border: "2px solid var(--border-gold)", boxShadow: "var(--shadow-gold)" }}>
          ⏳
        </div>

        <h2 style={{ marginBottom: 8, fontSize: 22 }}>Under Review</h2>
        <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 1, margin: "0 auto 16px" }} />
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 28, maxWidth: 320 }}>
          Need.co is reviewing your application. Our team is verifying your ID and profile details.
        </p>

        {/* Realtime indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "8px 16px", background: "var(--bg-2)", borderRadius: 20, border: "1px solid var(--border)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Live updates enabled — you'll be redirected automatically</span>
        </div>

        {/* Countdown */}
        {timeLeft && (
          <div className="card-gold" style={{ width: "100%", marginBottom: 24, padding: "24px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Estimated review time
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              {[["Hours", timeLeft.hours], ["Minutes", timeLeft.minutes], ["Seconds", timeLeft.seconds]].map(([label, val]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 40, color: "var(--gold)", lineHeight: 1, marginBottom: 6, minWidth: 64 }}>
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
            { label: "Application submitted", done: true, icon: "✅", sub: null },
            { label: "ID verification in progress", done: false, active: true, icon: "🔍", sub: "In progress..." },
            { label: "Admin review", done: false, icon: "👤", sub: null },
            { label: "Approval notification", done: false, icon: "🔔", sub: null },
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
                  {s.active && <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 2, fontWeight: 600 }}>{s.sub}</div>}
                </div>
              </div>
              {i < 3 && <div style={{ width: 2, height: 12, background: s.done ? "var(--gold)" : "var(--border)", marginLeft: 17, opacity: 0.5 }} />}
            </div>
          ))}
        </div>

        {/* What happens next */}
        <div className="card" style={{ width: "100%", marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 12 }}>What happens next?</div>
          {[
            ["📱", "You'll be notified and redirected automatically once approved"],
            ["✅", "Start accepting jobs immediately after approval"],
            ["⭐", "Build your rating to earn more jobs"],
            ["💰", "Get paid after every completed job"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-gold" style={{ width: "100%", marginBottom: 10 }} onClick={checkStatus} disabled={checking}>
          {checking ? "Checking..." : "🔄 Check approval status"}
        </button>

        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Questions? Contact us at{" "}
          <a href="mailto:support@needco.ph" style={{ color: "var(--gold)", textDecoration: "none" }}>support@needco.ph</a>
        </p>

      </div>
    </div>
  );
}
