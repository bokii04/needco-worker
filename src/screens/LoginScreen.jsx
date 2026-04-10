import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [loading, setLoading] = useState(null);

  const handleGoogle = async () => {
    setLoading("google");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://needco-worker.vercel.app" }
    });
  };

  const handleFacebook = async () => {
    setLoading("facebook");
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: "https://needco-worker.vercel.app" }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />

        <div className="fade-up" style={{ textAlign: "center", position: "relative" }}>
          <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #C9A84C, #E2C070)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 32px rgba(201,168,76,0.3)" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 28, color: "#0A0A0A" }}>N</span>
          </div>
          <h1 style={{ fontSize: 40, marginBottom: 6 }}>Need.co</h1>
          <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, #C9A84C, #E2C070)", borderRadius: 1, margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gold)", fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>Worker Portal</p>
        </div>

        <div className="fade-up-2" style={{ display: "flex", gap: 32, marginTop: 48 }}>
          {[["500+","Jobs monthly"],["4.8★","Avg rating"],["₱850","Daily avg"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: "var(--gold)", marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--bg-2)", borderRadius: "28px 28px 0 0", padding: "32px 24px 40px", border: "1px solid var(--border)" }}>
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Start earning today</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Sign in to your worker account</p>
        </div>

        <div className="fade-up-1" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <button onClick={handleGoogle} disabled={loading === "google"} className="btn btn-gold">
            <div style={{ width: 20, height: 20, background: "rgba(0,0,0,0.2)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>G</div>
            {loading === "google" ? "Signing in..." : "Continue with Google"}
          </button>
          <button onClick={handleFacebook} disabled={loading === "facebook"} className="btn" style={{ background: "#1877F2", color: "#fff" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>f</div>
            {loading === "facebook" ? "Signing in..." : "Continue with Facebook"}
          </button>
        </div>

        <div className="divider fade-up-2"><span>Iloilo City & Pavia</span></div>
        <p className="fade-up-3" style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          By continuing you agree to Need.co's Terms of Service
        </p>
      </div>
    </div>
  );
}
