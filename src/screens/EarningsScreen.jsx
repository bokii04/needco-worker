import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function EarningsScreen() {
  const { user, worker } = useApp();
  const [period, setPeriod] = useState("week");
  const [jobs, setJobs] = useState([]);

  const mockData = {
    week: { total: 4250, jobs: 11, avg: 386 },
    month: { total: 17800, jobs: 46, avg: 387 },
    all: { total: 89500, jobs: 231, avg: 387 },
  };

  const current = mockData[period];

  const mockJobs = [
    { service: "Electrical", desc: "Panel inspection", price: 420, date: "Today, 2:30 PM", status: "done" },
    { service: "Plumbing", desc: "Pipe leak fix", price: 380, date: "Today, 10:00 AM", status: "done" },
    { service: "Aircon", desc: "Unit cleaning", price: 500, date: "Yesterday, 3:00 PM", status: "done" },
    { service: "Electrical", desc: "Outlet repair", price: 390, date: "Yesterday, 11:00 AM", status: "done" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      <div className="topbar">
        <span className="topbar-title">Earnings</span>
      </div>

      <div className="scroll-body">
        {/* Period selector */}
        <div className="fade-up" style={{ display: "flex", background: "var(--bg-3)", borderRadius: "var(--radius-sm)", padding: 4, marginBottom: 20, gap: 4 }}>
          {[["week","This week"],["month","This month"],["all","All time"]].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={{
              flex: 1, padding: "9px 4px", borderRadius: "var(--radius-sm)", border: "none",
              cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
              background: period === val ? "var(--gold)" : "none",
              color: period === val ? "var(--bg)" : "var(--text-muted)",
              transition: "all 0.15s"
            }}>{label}</button>
          ))}
        </div>

        {/* Main earnings */}
        <div className="fade-up-1 card" style={{ textAlign: "center", marginBottom: 20, padding: "28px 20px", border: "1px solid var(--border-gold)" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Total earned</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 44, color: "var(--gold)", marginBottom: 4 }}>₱{current.total.toLocaleString()}</div>
          <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", borderRadius: 1, margin: "0 auto 16px" }} />
          <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
            {[["Jobs", current.jobs], ["Avg/job", `₱${current.avg}`]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission notice */}
        <div className="fade-up-2 card-gold" style={{ marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 3 }}>Platform fee</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Need.co takes 10% commission per job. Amounts shown are after fees.
            </div>
          </div>
        </div>

        {/* Job history */}
        <p className="section-label fade-up-3">Recent jobs</p>
        {mockJobs.map((job, i) => (
          <div key={i} className={`fade-up-${Math.min(i+3,5)} card`} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{job.service}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{job.desc}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{job.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "var(--gold)" }}>₱{job.price}</div>
              <span className="badge badge-success" style={{ marginTop: 4 }}>Done</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
