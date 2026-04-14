import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function HomeScreen() {
  const { user, worker, isOnline, toggleOnline, navigate, setActiveJob } = useApp();
  const [pendingJobs, setPendingJobs] = useState([]);
  const [incomingJob, setIncomingJob] = useState(null);
  const [timer, setTimer] = useState(30);
  const [accepting, setAccepting] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayJobs, setTodayJobs] = useState(0);
  const channelRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOnline || !worker) return;
    fetchPendingJobs();
  }, [isOnline, worker]);

  const fetchPendingJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "pending")
      .is("worker_id", null)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setPendingJobs(data);
      if (data.length > 0 && !incomingJob) showIncomingJob(data[0]);
    }
  };

  useEffect(() => {
    if (!isOnline || !worker) {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
      return;
    }

    channelRef.current = supabase
      .channel("worker_jobs_" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "jobs" }, (payload) => {
        var newJob = payload.new;
        console.log("[Worker] New job detected:", newJob.service, newJob.id);
        if (newJob.status === "pending" && !newJob.worker_id) {
          setPendingJobs(function(prev) { return [newJob].concat(prev); });
          showIncomingJob(newJob);
          if (Notification.permission === "granted") {
            new Notification("New " + newJob.service + " job!", { body: "P" + newJob.price + " — " + (newJob.address || "Nearby") });
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs" }, (payload) => {
        var updated = payload.new;
        console.log("[Worker] Job updated:", updated.id, "->", updated.status);
        if (updated.status !== "pending" || updated.worker_id) {
          setPendingJobs(function(prev) { return prev.filter(function(j) { return j.id !== updated.id; }); });
        }
      })
      .subscribe(function(status) { console.log("[Worker] Realtime channel:", status); });

    return function() { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [isOnline, worker, user?.id]);

  useEffect(() => {
    if (isOnline && "Notification" in window) Notification.requestPermission();
  }, [isOnline]);

  const showIncomingJob = (job) => {
    setIncomingJob(job);
    setTimer(30);
    clearTimerFn();
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearTimerFn(); setIncomingJob(null); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimerFn = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const acceptJob = async (job) => {
    setAccepting(true);
    clearTimerFn();
    try {
      var { data, error } = await supabase
        .from("jobs")
        .update({
          worker_id: user.id,
          worker_name: worker?.full_name || user.name,
          worker_phone: worker?.phone || null,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "pending")
        .select();

      var accepted = (data && data.length > 0) ? data[0] : null;

      if (error || !accepted) {
        console.error("Accept failed:", error);
        setIncomingJob(null);
        setPendingJobs(prev => prev.filter(j => j.id !== job.id));
        setAccepting(false);
        return;
      }

      console.log("[Worker] Job accepted:", accepted.id);

      // Notify customer — fire and forget
      supabase.from("notifications").insert({
        user_id: accepted.customer_id,
        title: "Worker on the way!",
        body: (worker?.full_name || "Your worker") + " accepted your " + accepted.service + " job.",
        type: "job_accepted",
      }).then(function() { console.log("Customer notified"); });

      setActiveJob(accepted);
      setIncomingJob(null);
      setPendingJobs(prev => prev.filter(j => j.id !== job.id));
      setAccepting(false);
      navigate("activejob");

    } catch (e) {
      console.error("Accept error:", e);
      setAccepting(false);
    }
  };

  const declineJob = () => {
    clearTimerFn();
    var current = incomingJob;
    setIncomingJob(null);
    var remaining = pendingJobs.filter(j => j.id !== current?.id);
    if (remaining.length > 0) showIncomingJob(remaining[0]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
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
          <span className={"badge " + (isOnline ? "badge-success" : "badge-gray")} style={{ animation: isOnline ? "pulse 2s infinite" : "none" }}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 0 }}>
        <div className="fade-up-1 card-gold" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>
              {isOnline ? "You're visible to customers" : "Go online to receive jobs"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {isOnline ? pendingJobs.length + " job" + (pendingJobs.length !== 1 ? "s" : "") + " available nearby" : "Toggle to start accepting jobs"}
            </div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 54, height: 30, cursor: "pointer", flexShrink: 0 }}>
            <input type="checkbox" checked={isOnline} onChange={e => toggleOnline(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
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
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>from {incomingJob.customer_name || "Customer"}</div>
                </div>
              </div>
              <div style={{ position: "relative", width: 52, height: 52 }}>
                <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--bg-4)" strokeWidth="3" />
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--gold)" strokeWidth="3"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 * (1 - timer / 30)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: timer <= 10 ? "var(--danger)" : "var(--gold)" }}>{timer}</div>
              </div>
            </div>
            <div style={{ background: "var(--bg-3)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{incomingJob.service} — {incomingJob.description || "Service needed"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>📍 {incomingJob.address || "Iloilo City"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>🕐 {incomingJob.when_needed || "ASAP"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>👤 {incomingJob.customer_name || "Customer"}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Your earnings</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 28, color: "var(--gold)" }}>P{incomingJob.price || incomingJob.budget || 0}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-gold" style={{ flex: 2 }} onClick={() => acceptJob(incomingJob)} disabled={accepting}>
                {accepting ? "Accepting..." : "Accept job"}
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={declineJob}>X</button>
            </div>
          </div>
        )}

        {isOnline && !incomingJob && pendingJobs.length > 0 && (
          <>
            <p className="section-label fade-up-2">Available jobs ({pendingJobs.length})</p>
            {pendingJobs.map((job, i) => (
              <div key={job.id} className={"fade-up-" + Math.min(i + 2, 5) + " card"} style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => showIncomingJob(job)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{job.service}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{job.description || "Service needed"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>📍 {job.address || "Nearby"} | {job.customer_name || "Customer"}</div>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: "var(--gold)", flexShrink: 0 }}>P{job.price}</div>
                </div>
                <button className="btn btn-gold btn-sm" style={{ width: "100%" }} onClick={e => { e.stopPropagation(); showIncomingJob(job); }}>View and Accept</button>
              </div>
            ))}
          </>
        )}

        {isOnline && !incomingJob && pendingJobs.length === 0 && (
          <div className="fade-up-2" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>📡</div>
            <h3 style={{ marginBottom: 8, color: "var(--text)" }}>Listening for jobs...</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7 }}>
              You are online and visible to customers.<br />New jobs will appear here instantly.
            </p>
          </div>
        )}

        {!isOnline && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🔒</div>
            <h3 style={{ marginBottom: 8, color: "var(--text-muted)" }}>You are offline</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Toggle the switch above to start receiving jobs</p>
          </div>
        )}

        <p className="section-label fade-up-2" style={{ marginTop: 8 }}>Today's summary</p>
        <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ label: "Earned", value: "P" + todayEarnings }, { label: "Jobs", value: todayJobs }, { label: "Rating", value: (worker?.rating || 0) + "*" }].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "14px 8px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: "var(--gold)", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <p className="section-label fade-up-3">Your services</p>
        <div className="fade-up-3" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {(worker?.skills || ["General"]).map(s => (<span key={s} className="badge badge-gold">{s}</span>))}
        </div>
      </div>
    </div>
  );
}
