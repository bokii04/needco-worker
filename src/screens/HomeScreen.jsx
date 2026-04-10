import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

const MOCK_JOB = {
  id: 1, service: "Electrical", desc: "Fix broken outlet in kitchen", address: "45 Iznart St, Iloilo City",
  distance: "0.8 km", price: 420, when: "ASAP", customer: "John M.", timer: 30
};

export default function HomeScreen() {
  const { user, worker, isOnline, toggleOnline, navigate, setActiveJob } = useApp();
  const [jobRequest, setJobRequest] = useState(null);
  const [timer, setTimer] = useState(30);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayJobs, setTodayJobs] = useState(0);
  const [rating, setRating] = useState(4.9);

  useEffect(() => {
    if (!isOnline) { setJobRequest(null); return; }
    const t = setTimeout(() => setJobRequest(MOCK_JOB), 3000);
    return () => clearTimeout(t);
  }, [isOnline]);

  useEffect(() => {
    if (!jobRequest) return;
    setTimer(30);
    const t = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(t); setJobRequest(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [jobRequest]);

  const acceptJob = () => {
    setActiveJob(MOCK_JOB);
    setJobRequest(null);
    navigate("activejob");
  };

  const declineJob = () => setJobRequest(null);

  const circumference = 2 * Math.PI * 45;
  const progress = jobRequest ? (timer / 30) * circumference : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", background: "var(--bg)" }}>
        <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--gold)", objectFit: "cover" }} />
            ) : (
              <div className="avatar" style={{ width: 44, height: 44, background: "var(--gold)", color: "var(--bg)", fontSize: 15, fontWeight: 700 }}>{user?.initials || "WK"}</div>
            )}
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Welcome back</p>
              <h3 style={{ fontSize: 16, marginTop: 1 }}>{user?.name?.split(" ")[0]}</h3>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Status</div>
            <span className={`badge ${isOnline ? "badge-success" : "badge-gray"}`} style={{ animation: isOnline ? "pulse 2s infinite" : "none" }}>
              {isOnline ? "● Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 0 }}>
        {/* Online toggle */}
        <div className="fade-up-1 card-gold" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>
              {isOnline ? "You're visible to customers" : "Go online to receive jobs"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {isOnline ? "Iloilo City & Pavia · 10km radius" : "Toggle to start accepting jobs"}
            </div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 54, height: 30, cursor: "pointer", flexShrink: 0 }}>
            <input type="checkbox" checked={isOnline} onChange={e => toggleOnline(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: 15, background: isOnline ? "linear-gradient(135deg, var(--gold), var(--gold-mid))" : "var(--bg-4)", transition: "background 0.2s", boxShadow: isOnline ? "var(--shadow-gold)" : "none" }} />
            <span style={{ position: "absolute", top: 3, left: isOnline ? 27 : 3, width: 24, height: 24, borderRadius: "50%", background: isOnline ? "var(--bg)" : "var(--text-muted)", transition: "left 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
          </label>
        </div>

        {/* Job request */}
        {jobRequest && (
          <div className="fade-up card" style={{ marginBottom: 20, border: "1px solid var(--gold)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", animation: "pulse 1s infinite" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🔔</span>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: "var(--gold)" }}>New job request!</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Respond quickly to secure the job</div>
                </div>
              </div>

              {/* Countdown timer */}
              <div style={{ position: "relative", width: 52, height: 52 }}>
                <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--bg-4)" strokeWidth="3" />
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--gold)" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - timer/30)}`}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: "var(--gold)" }}>{timer}</div>
              </div>
            </div>

            <div style={{ background: "var(--bg-3)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{jobRequest.service} — {jobRequest.desc}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>📍 {jobRequest.address} · {jobRequest.distance}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>🕐 {jobRequest.when}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>👤 {jobRequest.customer}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Your earnings</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 28, color: "var(--gold)" }}>₱{jobRequest.price}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Distance</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{jobRequest.distance}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-gold" style={{ flex: 2 }} onClick={acceptJob}>✓ Accept job</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={declineJob}>✗ Decline</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <p className="section-label fade-up-2">Today's summary</p>
        <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Earned", value: `₱${todayEarnings}` },
            { label: "Jobs done", value: todayJobs },
            { label: "Rating", value: `${rating}★` },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "14px 8px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: "var(--gold)", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <p className="section-label fade-up-3">Your services</p>
        <div className="fade-up-3" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {(worker?.skills || ["Electrical", "Plumbing"]).map(s => (
            <span key={s} className="badge badge-gold">{s}</span>
          ))}
        </div>

        {/* Quick tips */}
        <div className="fade-up-4 card-gold" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 4 }}>Pro tip</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Workers who respond within 10 seconds get 3x more jobs. Keep your phone nearby when online!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
