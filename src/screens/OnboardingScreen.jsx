import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

const SKILLS = ["Plumbing","Electrical","Cleaning","Moving","Carpentry","Aircon","Mechanic","Delivery"];

export default function OnboardingScreen() {
  const { user, navigate, setUser, setWorker } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ")[1] || "",
    phone: "",
    address: "",
    city: "Iloilo City",
    lat: null,
    lng: null,
    skills: [],
    experience: "",
    serviceRadius: "10",
    availability: [],
    idType: "PhilSys ID",
    idFile: null,
    idPreview: null,
    selfieFile: null,
    selfiePreview: null,
    certFile: null,
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const videoRef = useRef(null);
  const idVideoRef = useRef(null);
  const [cameraMode, setCameraMode] = useState(null); // 'selfie' or 'id'
  const streamRef = useRef(null);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const getPhone = () => "+63" + form.phone.replace(/\D/g, "").replace(/^0/, "");
  const toggleSkill = (s) => setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s] }));
  const toggleDay = (d) => setForm(f => ({ ...f, availability: f.availability.includes(d) ? f.availability.filter(x => x !== d) : [...f.availability, d] }));

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        update("lat", latitude);
        update("lng", longitude);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          update("address", (data.display_name || "").split(",").slice(0, 3).join(", "));
        } catch {
          update("address", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError("");
    try {
      const { error: e } = await supabase.auth.signInWithOtp({ phone: getPhone() });
      if (e) throw e;
      setOtpSent(true);
    } catch (e) {
      setError(e.message || "Failed to send OTP.");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError("");
    try {
      const { error: e } = await supabase.auth.verifyOtp({ phone: getPhone(), token: otp.trim(), type: "sms" });
      if (e) throw e;
      setOtpVerified(true);
    } catch (e) {
      setError("Invalid OTP. Please try again.");
    }
    setLoading(false);
  };

  const openCamera = async (mode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode === "selfie" ? "user" : "environment" } });
      streamRef.current = stream;
      setCameraMode(mode);
      setTimeout(() => {
        const ref = mode === "selfie" ? videoRef.current : idVideoRef.current;
        if (ref) ref.srcObject = stream;
      }, 100);
    } catch {
      setError("Camera access denied. Please upload a photo instead.");
    }
  };

  const capturePhoto = (mode) => {
    const ref = mode === "selfie" ? videoRef.current : idVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = ref.videoWidth;
    canvas.height = ref.videoHeight;
    canvas.getContext("2d").drawImage(ref, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], `${mode}.jpg`, { type: "image/jpeg" });
      if (mode === "selfie") {
        update("selfieFile", file);
        update("selfiePreview", canvas.toDataURL("image/jpeg"));
      } else {
        update("idFile", file);
        update("idPreview", canvas.toDataURL("image/jpeg"));
      }
      stopCamera();
    }, "image/jpeg", 0.85);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraMode(null);
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const runAIVerification = async (selfieFile, idFile) => {
    setVerifying(true);
    try {
      const [selfieB64, idB64] = await Promise.all([
        fileToBase64(selfieFile),
        fileToBase64(idFile)
      ]);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an identity verification system for Need.co, a service marketplace in the Philippines.

Analyze these two images:
1. SELFIE - A live photo taken by the applicant
2. ID PHOTO - A government-issued ID (PhilSys, Driver's License, Passport, etc.)

Your task:
- Compare the face in the selfie vs the face on the ID
- Check if the ID appears to be a real, unaltered Philippine government ID
- Assess overall verification confidence

Respond ONLY in this exact JSON format (no other text):
{
  "face_match": true or false,
  "match_confidence": 0-100,
  "id_looks_real": true or false,
  "id_type_detected": "detected ID type or unknown",
  "auto_approve": true or false,
  "flags": ["list of concerns if any"],
  "summary": "one sentence summary"
}`
              },
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: selfieB64 }
              },
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: idB64 }
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      setVerificationResult(result);
      setVerifying(false);
      return result;
    } catch (e) {
      console.error("AI verification error:", e);
      setVerifying(false);
      return { face_match: false, match_confidence: 0, auto_approve: false, summary: "Verification failed - pending manual review" };
    }
  };

  const uploadFile = async (file, bucket, path) => {
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) return null;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl || null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Upload selfie
      let selfieUrl = null;
      if (form.selfieFile) {
        selfieUrl = await uploadFile(form.selfieFile, "selfies", `${user.id}_worker_${Date.now()}.jpg`);
      }

      // Upload ID
      let idUrl = null;
      if (form.idFile) {
        idUrl = await uploadFile(form.idFile, "worker-ids", `${user.id}_id_${Date.now()}.jpg`);
      }

      // Run AI verification if both files exist
      let verification = null;
      if (form.selfieFile && form.idFile) {
        verification = await runAIVerification(form.selfieFile, form.idFile);
      }

      // Calculate trust score
      let score = 0;
      if (form.firstName && form.lastName) score += 20;
      if (form.idFile) score += 30;
      if (form.skills.length > 0) score += 20;
      if (form.experience) score += 20;
      if (form.selfieFile) score += 10;

      // Determine approval status
      const autoApprove = verification?.auto_approve && score >= 70;
      const status = autoApprove ? "approved" : "pending";

      // Update user
      await supabase.from("users").upsert({
        id: user.id,
        name: `${form.firstName} ${form.lastName}`.trim(),
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone ? getPhone() : null,
        address: form.address || null,
        role: "worker",
        is_onboarded: true,
        onboarded_at: new Date().toISOString(),
      }, { onConflict: "id" });

      // Save worker profile
      const { data: workerData } = await supabase.from("workers").upsert({
        user_id: user.id,
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone ? getPhone() : null,
        city: form.city,
        address: form.address || null,
        lat: form.lat || (form.city === "Pavia" ? 10.7799 : 10.7202),
        lng: form.lng || (form.city === "Pavia" ? 122.5464 : 122.5621),
        skills: form.skills,
        experience: form.experience,
        service_radius: parseInt(form.serviceRadius),
        availability: form.availability,
        selfie_url: selfieUrl,
        id_photo_url: idUrl,
        id_type: form.idType,
        verification_score: verification?.match_confidence || 0,
        verification_result: verification ? JSON.stringify(verification) : null,
        verification_notes: verification?.summary || null,
        face_match: verification?.face_match || false,
        approval_score: score,
        status,
        is_available: false,
        rating: 0,
        total_jobs: 0,
      }, { onConflict: "user_id" }).select().single();

      setUser(prev => ({ ...prev, name: `${form.firstName} ${form.lastName}`.trim(), is_onboarded: true, role: "worker" }));
      if (workerData) setWorker(workerData);

      navigate("onboarding_result");
    } catch (e) {
      console.error(e);
      setError("Failed to save profile. Please try again.");
    }

    setLoading(false);
  };

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", background: "var(--bg)" }}>

      <div style={{ height: 3, background: "var(--bg-3)" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--gold), var(--gold-mid))", transition: "width 0.4s ease" }} />
      </div>

      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        {step > 1 && <button className="back-btn" onClick={() => setStep(s => s - 1)}>←</button>}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Step {step} of {totalSteps}</p>
          <h3 style={{ marginTop: 2, color: "var(--text)" }}>
            {step === 1 && "Personal info"}
            {step === 2 && "Phone verification"}
            {step === 3 && "Skills & availability"}
            {step === 4 && "ID verification"}
            {step === 5 && "Your selfie"}
          </h3>
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 24 }}>

        {/* STEP 1 — Personal Info */}
        {step === 1 && (
          <>
            <div className="fade-up card-gold" style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>
                👷 Welcome to Need.co! Complete your profile to start accepting jobs in Iloilo City & Pavia.
              </p>
            </div>

            <div className="fade-up input-wrap">
              <label className="input-label">First name *</label>
              <input className="input-field" placeholder="e.g. Miguel" value={form.firstName} onChange={e => update("firstName", e.target.value)} />
            </div>
            <div className="fade-up-1 input-wrap">
              <label className="input-label">Last name *</label>
              <input className="input-field" placeholder="e.g. Santos" value={form.lastName} onChange={e => update("lastName", e.target.value)} />
            </div>
            <div className="fade-up-2 input-wrap">
              <label className="input-label">Home address *</label>
              <input className="input-field" placeholder="Street, Barangay" value={form.address} onChange={e => update("address", e.target.value)} style={{ marginBottom: 8 }} />
              <button onClick={detectLocation} disabled={locating} style={{
                display: "flex", alignItems: "center", gap: 8, background: "none",
                border: "1px solid var(--border-gold)", borderRadius: "var(--radius-sm)",
                padding: "9px 14px", fontSize: 13, fontWeight: 600, color: "var(--gold)",
                cursor: "pointer", width: "100%", justifyContent: "center"
              }}>
                {locating ? "📡 Detecting..." : "📍 Use my current location"}
              </button>
            </div>
            <div className="fade-up-3 input-wrap">
              <label className="input-label">City *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Iloilo City", "Pavia"].map(c => (
                  <button key={c} onClick={() => update("city", c)} style={{
                    flex: 1, padding: "11px",
                    border: form.city === c ? "1.5px solid var(--gold)" : "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: form.city === c ? "var(--gold-light)" : "none",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    color: form.city === c ? "var(--gold)" : "var(--text-muted)",
                    transition: "all 0.15s"
                  }}>{c}</button>
                ))}
              </div>
            </div>
            <div className="fade-up-4 input-wrap" style={{ marginBottom: 28 }}>
              <label className="input-label">Service radius</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["5","10","15","20"].map(r => (
                  <button key={r} onClick={() => update("serviceRadius", r)} style={{
                    flex: 1, padding: "10px 4px",
                    border: form.serviceRadius === r ? "1.5px solid var(--gold)" : "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: form.serviceRadius === r ? "var(--gold-light)" : "none",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    color: form.serviceRadius === r ? "var(--gold)" : "var(--text-muted)"
                  }}>{r} km</button>
                ))}
              </div>
            </div>

            <button className="btn btn-gold fade-up-5" disabled={!form.firstName || !form.lastName || !form.address} onClick={() => setStep(2)}>
              Continue →
            </button>
          </>
        )}

        {/* STEP 2 — Phone */}
        {step === 2 && (
          <>
            <div className="fade-up card-gold" style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>
                📱 Customers will contact you through this number. Please use your active Philippine number.
              </p>
            </div>

            <div className="fade-up input-wrap">
              <label className="input-label">Phone number *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ padding: "13px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 14, background: "var(--bg-3)", whiteSpace: "nowrap", color: "var(--text)", fontWeight: 600 }}>
                  🇵🇭 +63
                </div>
                <input className="input-field" placeholder="9xx xxx xxxx" value={form.phone} onChange={e => update("phone", e.target.value.replace(/\D/g, "").substring(0, 10))} style={{ flex: 1 }} disabled={otpVerified} />
              </div>
              {form.phone.length >= 10 && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Will send to: {getPhone()}</p>}
            </div>

            {!otpVerified && !otpSent && (
              <button className="btn btn-gold fade-up-1" disabled={form.phone.length < 10 || loading} onClick={handleSendOTP}>
                {loading ? "Sending OTP..." : "Send verification code →"}
              </button>
            )}

            {otpSent && !otpVerified && (
              <>
                <div className="fade-up input-wrap">
                  <label className="input-label">Enter 6-digit OTP</label>
                  <input className="input-field" placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").substring(0, 6))} maxLength={6} style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }} />
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                    Sent to {getPhone()} ·{" "}
                    <button onClick={() => { setOtpSent(false); setOtp(""); setError(""); }} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Change number</button>
                  </p>
                </div>
                <button className="btn btn-gold fade-up-1" disabled={otp.length < 6 || loading} onClick={handleVerifyOTP}>
                  {loading ? "Verifying..." : "Verify OTP →"}
                </button>
              </>
            )}

            {otpVerified && (
              <>
                <div className="fade-up" style={{ background: "var(--success-bg)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}>Phone verified!</span>
                </div>
                <button className="btn btn-gold" onClick={() => setStep(3)}>Continue →</button>
              </>
            )}

            {!otpVerified && (
              <button className="btn btn-outline fade-up-2" style={{ marginTop: 10 }} onClick={() => setStep(3)}>
                Skip for now (testing only)
              </button>
            )}

            {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 12, textAlign: "center" }}>{error}</p>}
          </>
        )}

        {/* STEP 3 — Skills & Availability */}
        {step === 3 && (
          <>
            <p className="section-label fade-up">Select your skills *</p>
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {SKILLS.map(s => (
                <button key={s} onClick={() => toggleSkill(s)} style={{
                  padding: "14px 12px", textAlign: "left",
                  border: form.skills.includes(s) ? "1.5px solid var(--gold)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  background: form.skills.includes(s) ? "var(--gold-light)" : "var(--bg-2)",
                  cursor: "pointer", transition: "all 0.15s"
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: form.skills.includes(s) ? "var(--gold)" : "var(--text)" }}>{s}</div>
                  {form.skills.includes(s) && <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 4 }}>✓ Selected</div>}
                </button>
              ))}
            </div>

            <div className="fade-up-1 input-wrap">
              <label className="input-label">Years of experience *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Less than 1","1-3 years","3-5 years","5+ years"].map(e => (
                  <button key={e} onClick={() => update("experience", e)} style={{
                    flex: 1, padding: "9px 4px",
                    border: form.experience === e ? "1.5px solid var(--gold)" : "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: form.experience === e ? "var(--gold-light)" : "none",
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                    color: form.experience === e ? "var(--gold)" : "var(--text-muted)"
                  }}>{e}</button>
                ))}
              </div>
            </div>

            <div className="fade-up-2 input-wrap" style={{ marginBottom: 28 }}>
              <label className="input-label">Availability</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)} style={{
                    padding: "8px 12px",
                    border: form.availability.includes(d) ? "1.5px solid var(--gold)" : "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: form.availability.includes(d) ? "var(--gold-light)" : "none",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    color: form.availability.includes(d) ? "var(--gold)" : "var(--text-muted)"
                  }}>{d}</button>
                ))}
              </div>
            </div>

            <button className="btn btn-gold fade-up-3" disabled={form.skills.length === 0 || !form.experience} onClick={() => setStep(4)}>
              Continue →
            </button>
          </>
        )}

        {/* STEP 4 — ID Verification */}
        {step === 4 && (
          <>
            <div className="fade-up card-gold" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>
                🪪 Upload a clear photo of your government-issued ID. This is required for verification and builds trust with customers.
              </p>
            </div>

            <div className="fade-up input-wrap">
              <label className="input-label">ID Type *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {["PhilSys ID","Driver's License","Passport","SSS ID","UMID","Voter's ID"].map(id => (
                  <button key={id} onClick={() => update("idType", id)} style={{
                    padding: "11px 14px", textAlign: "left",
                    border: form.idType === id ? "1.5px solid var(--gold)" : "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: form.idType === id ? "var(--gold-light)" : "none",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    color: form.idType === id ? "var(--gold)" : "var(--text-muted)",
                    display: "flex", justifyContent: "space-between"
                  }}>
                    {id} {form.idType === id && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* ID Camera */}
            {cameraMode === "id" && (
              <div className="fade-up" style={{ marginBottom: 20 }}>
                <video ref={idVideoRef} autoPlay playsInline style={{ width: "100%", borderRadius: "var(--radius-lg)", background: "#000" }} />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button className="btn btn-gold" style={{ flex: 2 }} onClick={() => capturePhoto("id")}>📸 Capture ID</button>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={stopCamera}>Cancel</button>
                </div>
              </div>
            )}

            {form.idPreview && cameraMode !== "id" && (
              <div className="fade-up" style={{ marginBottom: 20, textAlign: "center" }}>
                <img src={form.idPreview} alt="ID" style={{ width: "100%", borderRadius: "var(--radius-lg)", border: "2px solid var(--gold)", maxHeight: 200, objectFit: "cover" }} />
                <button onClick={() => openCamera("id")} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 13, fontWeight: 600, marginTop: 8 }}>Retake photo</button>
              </div>
            )}

            {!form.idPreview && cameraMode !== "id" && (
              <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <button onClick={() => openCamera("id")} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  border: "2px dashed var(--border-gold)", borderRadius: "var(--radius-lg)",
                  padding: "24px 20px", cursor: "pointer", background: "var(--gold-light)"
                }}>
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--gold)" }}>Take photo of ID</span>
                </button>
                <label style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
                  padding: "14px 20px", cursor: "pointer", background: "var(--bg-2)"
                }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    update("idFile", file);
                    const reader = new FileReader();
                    reader.onload = ev => update("idPreview", ev.target.result);
                    reader.readAsDataURL(file);
                  }} />
                  <span style={{ fontSize: 18 }}>🖼</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-muted)" }}>Upload from gallery</span>
                </label>
              </div>
            )}

            {/* Optional cert */}
            <div className="fade-up-1 input-wrap" style={{ marginBottom: 24 }}>
              <label className="input-label">Certifications (optional)</label>
              <label style={{
                display: "flex", alignItems: "center", gap: 10,
                border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                padding: "12px 14px", cursor: "pointer", background: "var(--bg-2)"
              }}>
                <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => update("certFile", e.target.files[0])} />
                <span style={{ fontSize: 18 }}>📄</span>
                <span style={{ fontSize: 13, color: form.certFile ? "var(--gold)" : "var(--text-muted)", fontWeight: form.certFile ? 600 : 400 }}>
                  {form.certFile ? `✅ ${form.certFile.name}` : "Upload certification (optional)"}
                </span>
              </label>
            </div>

            <button className="btn btn-gold fade-up-2" disabled={!form.idFile} onClick={() => setStep(5)}>
              Continue →
            </button>
          </>
        )}

        {/* STEP 5 — Selfie + AI Verification */}
        {step === 5 && (
          <>
            <div className="fade-up card-gold" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>
                🤳 Take a clear selfie facing the camera. Our AI will compare it with your ID to verify your identity automatically.
              </p>
            </div>

            {/* AI verification result */}
            {verificationResult && (
              <div className="fade-up" style={{
                background: verificationResult.auto_approve ? "var(--success-bg)" : "var(--warning-bg)",
                border: `1px solid ${verificationResult.auto_approve ? "rgba(46,204,113,0.3)" : "rgba(243,156,18,0.3)"}`,
                borderRadius: "var(--radius-lg)", padding: "16px", marginBottom: 20
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: verificationResult.auto_approve ? "var(--success)" : "var(--warning)", marginBottom: 8 }}>
                  {verificationResult.auto_approve ? "✅ Identity verified!" : "⚠️ Pending manual review"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{verificationResult.summary}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className={`badge ${verificationResult.face_match ? "badge-success" : "badge-warning"}`}>
                    Face match: {verificationResult.match_confidence}%
                  </span>
                  <span className={`badge ${verificationResult.id_looks_real ? "badge-success" : "badge-warning"}`}>
                    ID: {verificationResult.id_looks_real ? "Looks real" : "Needs review"}
                  </span>
                </div>
              </div>
            )}

            {/* Selfie camera */}
            {cameraMode === "selfie" && (
              <div className="fade-up" style={{ marginBottom: 20 }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: "var(--radius-lg)", background: "#000" }} />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button className="btn btn-gold" style={{ flex: 2 }} onClick={() => capturePhoto("selfie")}>📸 Take selfie</button>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={stopCamera}>Cancel</button>
                </div>
              </div>
            )}

            {form.selfiePreview && cameraMode !== "selfie" && (
              <div className="fade-up" style={{ marginBottom: 20, textAlign: "center" }}>
                <img src={form.selfiePreview} alt="Selfie" style={{ width: 140, height: 140, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--gold)", boxShadow: "var(--shadow-gold)" }} />
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => { openCamera("selfie"); setVerificationResult(null); }} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Retake selfie</button>
                </div>
              </div>
            )}

            {!form.selfiePreview && cameraMode !== "selfie" && (
              <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <button onClick={() => openCamera("selfie")} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  border: "2px dashed var(--border-gold)", borderRadius: "var(--radius-lg)",
                  padding: "28px 20px", cursor: "pointer", background: "var(--gold-light)"
                }}>
                  <span style={{ fontSize: 28 }}>📸</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--gold)" }}>Take selfie</span>
                </button>
                <label style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
                  padding: "14px 20px", cursor: "pointer", background: "var(--bg-2)"
                }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    update("selfieFile", file);
                    const reader = new FileReader();
                    reader.onload = ev => update("selfiePreview", ev.target.result);
                    reader.readAsDataURL(file);
                  }} />
                  <span style={{ fontSize: 18 }}>🖼</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-muted)" }}>Upload from gallery</span>
                </label>
              </div>
            )}

            {verifying && (
              <div style={{ textAlign: "center", padding: "20px", marginBottom: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--gold)", marginBottom: 4 }}>AI is verifying your identity...</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Comparing selfie with ID photo</div>
              </div>
            )}

            {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</p>}

            <button className="btn btn-gold fade-up-1" disabled={loading || verifying || !form.selfieFile} onClick={handleSubmit}>
              {loading ? "Saving profile..." : verifying ? "Verifying..." : "Submit application 🚀"}
            </button>
            <button className="btn btn-outline fade-up-2" style={{ marginTop: 10 }} disabled={loading} onClick={handleSubmit}>
              Skip verification (testing only)
            </button>
          </>
        )}

      </div>
    </div>
  );
}
