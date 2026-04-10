import { useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

const SKILLS = ["Plumbing","Electrical","Cleaning","Moving","Carpentry","Aircon","Mechanic","Delivery"];

export default function RegisterScreen() {
  const { navigate, user } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: user?.name||"", phone: "", address: "", city: "Iloilo City", skills: [], experience: "", bio: "", idType: "PhilSys ID", idFile: null });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSkill = (s) => setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x=>x!==s) : [...f.skills,s] }));
  const calcScore = () => (form.fullName?20:0) + (form.idFile?30:0) + (form.skills.length?20:0) + (form.experience?20:0) + (form.bio?10:0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const s = calcScore();
      await supabase.from("workers").upsert({
        user_id: user.id, full_name: form.fullName, phone: form.phone,
        city: form.city, skills: form.skills, experience: form.experience, bio: form.bio,
        lat: form.city==="Pavia"?10.7799:10.7202, lng: form.city==="Pavia"?122.5464:122.5621,
        is_available: false, rating: 0, total_jobs: 0,
        status: s>=70?"approved":"pending", approval_score: s
      }, { onConflict: "user_id" });
      setScore(s); setDone(true);
    } catch(e) {}
    setLoading(false);
  };

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", padding: 40, background: "var(--bg)" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{score>=70?"🎉":"⏳"}</div>
      <h2 style={{ textAlign: "center", marginBottom: 12 }}>{score>=70?"You're approved!":"Application submitted!"}</h2>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 48, color: "var(--gold)", marginBottom: 8 }}>{score}</div>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 24 }}>
        {score>=70?"Start accepting jobs now!":"Our team will review within 24 hours."}
      </p>
      <button className="btn btn-gold" style={{ width: "100%" }} onClick={() => navigate("home")}>
        {score>=70?"Start working! 🚀":"Got it!"}
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => step>1?setStep(s=>s-1):navigate("profile")}>←</button>
        <span className="topbar-title">Worker registration</span>
        <span className="badge badge-gold">Step {step}/3</span>
      </div>
      <div style={{ height: 3, background: "var(--bg-3)" }}>
        <div style={{ height: "100%", width: `${(step/3)*100}%`, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", transition: "width 0.3s" }} />
      </div>

      <div className="scroll-body">
        {step===1 && (
          <>
            <h3 className="fade-up" style={{ marginBottom: 4 }}>Personal info</h3>
            <div className="gold-line" />
            <div className="fade-up-1 input-wrap"><label className="input-label">Full name</label><input className="input-field" value={form.fullName} onChange={e=>update("fullName",e.target.value)} placeholder="Your full name" /></div>
            <div className="fade-up-2 input-wrap"><label className="input-label">Phone</label><input className="input-field" value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="9xx xxx xxxx" /></div>
            <div className="fade-up-3 input-wrap"><label className="input-label">Address</label><input className="input-field" value={form.address} onChange={e=>update("address",e.target.value)} placeholder="Street, Barangay" /></div>
            <div className="fade-up-4 input-wrap">
              <label className="input-label">City</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Iloilo City","Pavia"].map(c => (
                  <button key={c} onClick={()=>update("city",c)} style={{ flex:1, padding:"11px", border: form.city===c?"1.5px solid var(--gold)":"1px solid var(--border)", borderRadius:"var(--radius-sm)", background:form.city===c?"var(--gold-light)":"none", fontFamily:"var(--font-body)", fontSize:13, fontWeight:600, cursor:"pointer", color:form.city===c?"var(--gold)":"var(--text-muted)", transition:"all 0.15s" }}>{c}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-gold fade-up-5" disabled={!form.fullName||!form.phone} onClick={()=>setStep(2)}>Next →</button>
          </>
        )}

        {step===2 && (
          <>
            <h3 className="fade-up" style={{ marginBottom: 4 }}>Skills</h3>
            <div className="gold-line" />
            <div className="fade-up-1" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              {SKILLS.map(s => (
                <button key={s} onClick={()=>toggleSkill(s)} style={{ padding:"14px 12px", textAlign:"left", border:form.skills.includes(s)?"1.5px solid var(--gold)":"1px solid var(--border)", borderRadius:"var(--radius-md)", background:form.skills.includes(s)?"var(--gold-light)":"var(--bg-2)", cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ fontWeight:600, fontSize:13, color:form.skills.includes(s)?"var(--gold)":"var(--text)" }}>{s}</div>
                  {form.skills.includes(s) && <div style={{ fontSize:10, color:"var(--gold)", marginTop:4 }}>✓ Selected</div>}
                </button>
              ))}
            </div>
            <div className="fade-up-2 input-wrap">
              <label className="input-label">Experience</label>
              <div style={{ display:"flex", gap:8 }}>
                {["<1 yr","1-3 yrs","3-5 yrs","5+ yrs"].map(e => (
                  <button key={e} onClick={()=>update("experience",e)} style={{ flex:1, padding:"9px 4px", border:form.experience===e?"1.5px solid var(--gold)":"1px solid var(--border)", borderRadius:"var(--radius-sm)", background:form.experience===e?"var(--gold-light)":"none", fontFamily:"var(--font-body)", fontSize:11, fontWeight:600, cursor:"pointer", color:form.experience===e?"var(--gold)":"var(--text-muted)", transition:"all 0.15s" }}>{e}</button>
                ))}
              </div>
            </div>
            <div className="fade-up-3 input-wrap" style={{ marginBottom:24 }}><label className="input-label">Bio</label><textarea className="input-field" rows={3} value={form.bio} onChange={e=>update("bio",e.target.value)} placeholder="Tell customers about yourself..." /></div>
            <button className="btn btn-gold fade-up-4" disabled={form.skills.length===0||!form.experience} onClick={()=>setStep(3)}>Next →</button>
          </>
        )}

        {step===3 && (
          <>
            <h3 className="fade-up" style={{ marginBottom: 4 }}>ID Verification</h3>
            <div className="gold-line" />
            <div className="fade-up-1 card-gold" style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontWeight:600, fontSize:13 }}>Trust score</span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:calcScore()>=70?"var(--gold)":"var(--warning)" }}>{calcScore()}/100</span>
              </div>
              <div style={{ height:8, background:"var(--bg-4)", borderRadius:4, overflow:"hidden", marginBottom:6 }}>
                <div style={{ height:"100%", width:`${calcScore()}%`, background:"linear-gradient(90deg,var(--gold),var(--gold-mid))", borderRadius:4, transition:"width 0.3s" }} />
              </div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{calcScore()>=70?"✅ Auto-approval qualified!":"⚠️ Upload ID for auto-approval"}</div>
            </div>
            <div className="fade-up-2 input-wrap">
              <label className="input-label">ID Type</label>
              {["PhilSys ID","Driver's License","Passport","SSS ID","UMID"].map(id => (
                <button key={id} onClick={()=>update("idType",id)} style={{ width:"100%", padding:"12px 14px", textAlign:"left", border:form.idType===id?"1.5px solid var(--gold)":"1px solid var(--border)", borderRadius:"var(--radius-sm)", background:form.idType===id?"var(--gold-light)":"none", fontFamily:"var(--font-body)", fontSize:13, fontWeight:600, cursor:"pointer", color:form.idType===id?"var(--gold)":"var(--text-mid)", marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                  {id} {form.idType===id&&<span style={{ color:"var(--gold)" }}>✓</span>}
                </button>
              ))}
            </div>
            <div className="fade-up-3 input-wrap" style={{ marginBottom:24 }}>
              <label className="input-label">Upload ID photo (+30 pts)</label>
              <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, border:`2px dashed ${form.idFile?"var(--gold)":"var(--border)"}`, borderRadius:"var(--radius-md)", padding:"20px", cursor:"pointer", background:form.idFile?"var(--gold-light)":"var(--bg-2)" }}>
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>update("idFile",e.target.files[0])} />
                <span style={{ fontSize:24 }}>{form.idFile?"✅":"📷"}</span>
                <span style={{ fontSize:13, fontWeight:600, color:form.idFile?"var(--gold)":"var(--text-muted)" }}>{form.idFile?form.idFile.name:"Tap to upload ID"}</span>
              </label>
            </div>
            <button className="btn btn-gold fade-up-4" onClick={handleSubmit} disabled={loading}>
              {loading?"Submitting...":"Submit application 🚀"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
