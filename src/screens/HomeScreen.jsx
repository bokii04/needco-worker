import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";

var MOCK_JOBS = [
  { id: "mj1", service: "Aircon", description: "AC split type cleaning and checkup", address: "Pavia Street, Iloilo City", price: 500, when_needed: "ASAP", customer_name: "Ambok Lamigo", status: "pending" },
  { id: "mj2", service: "Electrical", description: "Fix broken outlet in kitchen", address: "Jaro, Iloilo City", price: 420, when_needed: "Today PM", customer_name: "Maria Cruz", status: "pending" },
  { id: "mj3", service: "Plumbing", description: "Leaking faucet in bathroom", address: "Mandurriao, Iloilo City", price: 380, when_needed: "ASAP", customer_name: "Juan Santos", status: "pending" },
];

export default function HomeScreen() {
  const { user, worker, isOnline, toggleOnline, navigate, setActiveJob } = useApp();
  const [pendingJobs, setPendingJobs] = useState([]);
  const [incomingJob, setIncomingJob] = useState(null);
  const [timer, setTimer] = useState(30);
  const [accepting, setAccepting] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayJobs, setTodayJobs] = useState(0);
  const timerRef = useRef(null);

  useEffect(function() {
    if (!isOnline) { setPendingJobs([]); setIncomingJob(null); clearTimerFn(); return; }
    var t1 = setTimeout(function() {
      setPendingJobs(MOCK_JOBS);
      showIncomingJob(MOCK_JOBS[0]);
    }, 3000);
    return function() { clearTimeout(t1); };
  }, [isOnline]);

  var showIncomingJob = function(job) {
    setIncomingJob(job); setTimer(30); clearTimerFn();
    timerRef.current = setInterval(function() {
      setTimer(function(prev) {
        if (prev <= 1) { clearTimerFn(); setIncomingJob(null); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  var clearTimerFn = function() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  var acceptJob = function(job) {
    setAccepting(true); clearTimerFn();
    setTimeout(function() {
      setActiveJob({ ...job, status: "accepted", worker_name: worker?.full_name || user?.name });
      setIncomingJob(null);
      setPendingJobs(function(prev) { return prev.filter(function(j) { return j.id !== job.id; }); });
      setAccepting(false);
      navigate("activejob");
    }, 1000);
  };

  var declineJob = function() {
    clearTimerFn(); var current = incomingJob; setIncomingJob(null);
    var remaining = pendingJobs.filter(function(j) { return j.id !== current?.id; });
    setPendingJobs(remaining);
    if (remaining.length > 0) setTimeout(function() { showIncomingJob(remaining[0]); }, 500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user?.avatar ? <img src={user.avatar} alt="" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--gold)", objectFit: "cover" }} /> : <div className="avatar" style={{ width: 44, height: 44, background: "var(--gold)", color: "var(--bg)", fontSize: 15, fontWeight: 700 }}>{user?.initials || "WK"}</div>}
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Welcome back</p>
              <h3 style={{ fontSize: 16, marginTop: 1 }}>{user?.name?.split(" ")[0] || "Worker"}</h3>
            </div>
          </div>
          <span className={"badge " + (isOnline ? "badge-success" : "badge-gray")} style={{ animation: isOnline ? "pulse 2s infinite" : "none" }}>{isOnline ? "● Online" : "Offline"}</span>
        </div>
      </div>
      <div className="scroll-body" style={{ paddingTop: 0 }}>
        <div className="fade-up-1 card-gold" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>{isOnline ? "You're visible to customers" : "Go online to receive jobs"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{isOnline ? pendingJobs.length + " job" + (pendingJobs.length !== 1 ? "s" : "") + " available nearby" : "Toggle to start accepting jobs"}</div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 54, height: 30, cursor: "pointer", flexShrink: 0 }}>
            <input type="checkbox" checked={isOnline} onChange={function(e) { toggleOnline(e.target.checked); }} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: 15, background: isOnline ? "linear-gradient(135deg, var(--gold), var(--gold-mid))" : "var(--bg-4)", transition: "background 0.2s", boxShadow: isOnline ? "var(--shadow-gold)" : "none" }} />
            <span style={{ position: "absolute", top: 3, left: isOnline ? 27 : 3, width: 24, height: 24, borderRadius: "50%", background: isOnline ? "var(--bg)" : "var(--text-muted)", transition: "left 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
          </label>
        </div>

        {incomingJob && isOnline && (
          <div className="fade-up card" style={{ marginBottom: 20, border: "1.5px solid var(--gold)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", animation: "pulse 1s infinite" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🔔</span>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: "var(--gold)" }}>New job request!</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>from {incomingJob.customer_name}</div>
                </div>
              </div>
              <div style={{ position: "relative", width: 52, height: 52 }}>
                <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--bg-4)" strokeWidth="3" />
                  <circle cx="26" cy="26" r="22" fill="none" stroke={timer <= 10 ? "var(--danger)" : "var(--gold)"} strokeWidth="3" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - timer / 30)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: timer <= 10 ? "var(--danger)" : "var(--gold)" }}>{timer}</div>
              </div>
            </div>
            <div style={{ background: "var(--bg-3)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{incomingJob.service} — {incomingJob.description}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>📍 {incomingJob.address}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>🕐 {incomingJob.when_needed}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>👤 {incomingJob.customer_name}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Your earnings</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 28, color: "var(--gold)" }}>₱{incomingJob.price}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-gold" style={{ flex: 2 }} onClick={function() { acceptJob(incomingJob); }} disabled={accepting}>{accepting ? "Accepting..." : "✓ Accept job"}</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={declineJob}>✗</button>
            </div>
          </div>
        )}

        {isOnline && !incomingJob && pendingJobs.length > 0 && (
          <>
            <p className="section-label fade-up-2">Available jobs ({pendingJobs.length})</p>
            {pendingJobs.map(function(job, i) { return (
              <div key={job.id} className={"fade-up-" + Math.min(i+2,5) + " card"} style={{ marginBottom: 12, cursor: "pointer" }} onClick={function() { showIncomingJob(job); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{job.service}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{job.description}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>📍 {job.address} · 👤 {job.customer_name}</div>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: "var(--gold)", flexShrink: 0 }}>₱{job.price}</div>
                </div>
              </div>
            ); })}
          </>
        )}

        {isOnline && !incomingJob && pendingJobs.length === 0 && (
          <div className="fade-up-2" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>📡</div>
            <h3 style={{ marginBottom: 8, color: "var(--text)" }}>Listening for jobs...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>You're online. New jobs will appear here instantly.</p>
          </div>
        )}

        {!isOnline && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🔒</div>
            <h3 style={{ marginBottom: 8, color: "var(--text-muted)" }}>You're offline</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Toggle the switch above to start receiving jobs</p>
          </div>
        )}

        <p className="section-label fade-up-2" style={{ marginTop: 8 }}>Today's summary</p>
        <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ label: "Earned", value: "₱" + todayEarnings }, { label: "Jobs", value: todayJobs }, { label: "Rating", value: (worker?.rating || 0) + "★" }].map(function(s) { return (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "14px 8px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: "var(--gold)", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ); })}
        </div>

        <p className="section-label fade-up-3">Your services</p>
        <div className="fade-up-3" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {(worker?.skills || ["Electrical","Plumbing","Aircon"]).map(function(s) { return <span key={s} className="badge badge-gold">{s}</span>; })}
        </div>
      </div>
    </div>
  );
}
