import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

const STEPS = [
  { key: "accepted", label: "Job accepted", icon: "✅", sub: "Navigate to customer" },
  { key: "enroute", label: "On the way", icon: "🚗", sub: null },
  { key: "arrived", label: "Arrived", icon: "📍", sub: "Let customer know you're here" },
  { key: "working", label: "Working", icon: "🔧", sub: "Job in progress" },
  { key: "complete", label: "Completed", icon: "🎉", sub: "Collect payment" },
];

export default function ActiveJobScreen() {
  const { navigate, activeJob, setActiveJob } = useApp();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const advance = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else setDone(true);
  };

  const buttonLabels = [
    "I'm on my way →",
    "I have arrived →",
    "Start job →",
    "Mark as complete ✓",
    "Collect payment ✓"
  ];

  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", padding: 40, background: "var(--bg)" }}>
        <div style={{ width: 80, height: 80, background: "linear-gradient(135deg, var(--gold), var(--gold-mid))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20, boxShadow: "var(--shadow-gold)" }}>🎉</div>
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>Job completed!</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 8 }}>Collect ₱{activeJob?.price} in cash from the customer</p>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 40, color: "var(--gold)", marginBottom: 24 }}>₱{activeJob?.price}</div>
        <button className="btn btn-gold" style={{ width: "100%" }} onClick={() => { setActiveJob(null); navigate("home"); }}>
          Back to dashboard →
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      <div className="topbar">
        <span className="topbar-title">Active job</span>
        <span className="badge badge-success" style={{ animation: "pulse 2s infinite" }}>● Active</span>
      </div>

      <div className="scroll-body">
        {/* Job details */}
        <div className="fade-up card-gold" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 4 }}>{activeJob?.service}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{activeJob?.desc}</div>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 28, color: "var(--gold)" }}>₱{activeJob?.price}</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>📍 {activeJob?.address}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>👤 {activeJob?.customer}</div>
        </div>

        {/* Progress */}
        <p className="section-label fade-up-1">Progress</p>
        <div className="fade-up-1" style={{ marginBottom: 24 }}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <div key={s.key}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "10px 0" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                    background: done ? "var(--gold)" : current ? "var(--bg-3)" : "var(--bg-2)",
                    border: current ? "1.5px solid var(--gold)" : done ? "none" : "1px solid var(--border)",
                    boxShadow: current ? "var(--shadow-gold)" : "none",
                    color: done ? "var(--bg)" : "var(--text)"
                  }}>
                    {done ? "✓" : s.icon}
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: current ? 700 : 400, color: done || current ? "var(--text)" : "var(--text-muted)" }}>{s.label}</div>
                    {current && s.sub && <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 2, fontWeight: 600 }}>{s.sub}</div>}
                  </div>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 2, height: 16, background: done ? "var(--gold)" : "var(--border)", marginLeft: 19, opacity: 0.5 }} />}
              </div>
            );
          })}
        </div>

        <button className="btn btn-gold fade-up-2" onClick={advance}>
          {buttonLabels[step]}
        </button>
        <button className="btn btn-outline fade-up-3" style={{ marginTop: 10 }} onClick={() => navigate("chat")}>
          💬 Chat with customer
        </button>
      </div>
    </div>
  );
}
