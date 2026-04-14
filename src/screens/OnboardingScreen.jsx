import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

const SKILLS = ["Plumbing","Electrical","Cleaning","Moving","Carpentry","Aircon","Mechanic","Delivery"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

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
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const videoRef = useRef(null);
  const idVideoRef = useRef(null);
  const [cameraMode, setCameraMode] = useState(null);
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
      if (mode === "selfie") { update("selfieFile", file); update("selfiePreview", canvas.toDataURL()); }
      else { update("idFile", file); update("idPreview", canvas.toDataURL()); }
      stopCamera();
    }, "image/jpeg", 0.85);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraMode(null);
  };

  const uploadFile = async (file, bucket, path) => {
    try {
      await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl || null;
    } catch { return null; }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    var safetyTimeout = setTimeout(function() { setLoading(false); clearTimeout(safetyTimeout); navigate("onboarding_result"); }, 5000);

    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();

      // Calculate score
      const score =
        (fullName ? 20 : 0) +
        (form.idFile ? 30 : 0) +
        (form.skills.length > 0 ? 20 : 0) +
        (form.experience ? 20 : 0) +
        (form.selfieFile ? 10 : 0);

      // Upload files
      const selfieUrl = form.selfieFile
        ? await uploadFile(form.selfieFile, "selfies", `${user.id}_worker_${Date.now()}.jpg`)
        : null;

      const idUrl = form.idFile
        ? await uploadFile(form.idFile, "worker-ids", `${user.id}_id_${Date.now()}.jpg`)
        : null;

      // Update user table
      const { error: userError } = await supabase.from("users").upsert({
        id: user.id,
        name: fullName,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone ? getPhone() : null,
        address: form.address || null,
        role: "worker",
        is_onboarded: true,
        onboarded_at: new Date().toISOString(),
      }, { onConflict: "id" });

      if (userError) {
        console.error("User update error:", userError);
        throw userError;
      }

      // Check if worker already exists
      const { data: existingWorker } = await supabase
        .from("workers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const workerPayload = {
        user_id: user.id,
        full_name: fullName,
        phone: form.phone ? getPhone() : null,
        city: form.city,
        address: form.address || null,
        lat: form.lat || (form.city === "Pavia" ? 10.7799 : 10.7202),
        lng: form.lng || (form.city === "Pavia" ? 122.5464 : 122.5621),
        skills: form.skills,
        experience: form.experience,
        service_radius: parseInt(form.serviceRadius) || 10,
        availability: form.availability,
        selfie_url: selfieUrl,
        id_photo_url: idUrl,
        id_type: form.idType,
        approval_score: score,
        status: "pending",
        is_available: false,
        rating: 0,
        total_jobs: 0,
        face_match: false,
        verification_score: 0,
      };

      let savedWorker = null;

      if (existingWorker?.id) {
        // Update existing
        const { data, error: updateError } = await supabase
          .from("workers")
          .update(workerPayload)
          .eq("id", existingWorker.id)
          .select()
          .single();
        if (updateError) throw updateError;
        savedWorker = data;
      } else {
        // Insert new
        const { data, error: insertError } = await supabase
          .from("workers")
          .insert(workerPayload)
          .select()
          .single();
        if (insertError) throw insertError;
        savedWorker = data;
      }

      console.log("Worker saved:", savedWorker);

      // Notify admin
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin");

      if (admins?.length > 0) {
        await supabase.from("notifications").insert(
          admins.map(a => ({
            user_id: a.id,
            title: "📝 New worker applicant",
            body: `${fullName} from ${form.city} has submitted a worker application for review.`,
            type: "system",
          }))
        );
      }

      setUser(prev => ({ ...prev, name: fullName, is_onboarded: true, role: "worker" }));
      setWorker(savedWorker);
      clearTimeout(safetyTimeout); navigate("onboarding_result");

    } catch (e) {
      console.error("Submit error:", e);
      setError(`Failed to save: ${e.message || "Please try again."}`);
    }

    setLoading(false);
  };

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

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
            {step === 4 && "Upload your ID"}
            {step === 5 && "Take a selfie"}
          </h3>
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 24 }}>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div className="fade-up card-gold" style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>
                👷 Welcome! Complete your profile to start earning with Need.co in Iloilo City & Pavia.
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
              <button onClick={detectLocation} disabled={locating} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid var(--border-gold)", borderRadius: "var(--radius-sm)", padding: "9px 14px", fontSize: 13, fontWeight: 600, color: "var(--gold)", cursor: "pointer", width: "100%", justifyContent: "center" }}>
                {locating ? "📡 Detecting..." : "📍 Use my current location"}
              </button>
            </div>
            <div className="fade-up-3 input-wrap">
              <label className="input-label">City *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Iloilo City","Pavia"].map(c => (
                  <button key={c} onClick={() => update("city", c)} style={{ flex: 1, padding: "11px", border: form.city === c ? "1.5px solid var(--gold)" : "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: form.city === c ? "var(--gold-light)" : "none", fontSize: 13, fontWeight: 600, cursor: "pointer", color: form.city === c ? "var(--gold)" : "var(--text-muted)", transition: "all 0.15s" }}>{c}</button>
                ))}
              </div>
            </div>
            <div className="fade-up-4 input-wrap" style={{ marginBottom: 28 }}>
              <label className="input-label">Service radius</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["5","10","15","20"].map(r => (
                  <button key={r} onClick={() => update("serviceRadius", r)} style={{ flex: 1, padding: "10px 4px", border: form.serviceRadius === r ? "1.5px solid var(--gold)" : "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: form.serviceRadius === r ? "var(--gold-light)" : "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: form.serviceRadius === r ? "var(--gold)" : "var(--text-muted)" }}>{r} km</button>
                ))}
              </div>
            </div>
            <button className="btn btn-gold fade-up-5" disabled={!form.firstName || !form.lastName || !form.address} onClick={() => setStep(2)}>
              Continue →
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div className="fade-up card-gold" style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>📱 Customers will contact you through this number.</p>
            </div>
            <div className="fade-up input-wrap">
              <label className="input-label">Phone number *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ padding: "13px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 14, background: "var(--bg-3)", whiteSpace: "nowrap", color: "var(--text)", fontWeight: 600 }}>🇵🇭 +63</div>
                <input className="input-field" placeholder="9xx xxx xxxx" value={form.phone} onChange={e => update("phone", e.target.value.replace(/\D/g, "").substring(0, 10))} style={{ flex: 1 }} disabled={otpVerified} />
              </div>
              {form.phone.length >= 10 && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Will send to: {getPhone()}</p>}
            </div>
            {!otpVerified && !otpSent && (
              <button className="btn btn-gold fade-up-1" disabled={form.phone.length < 10 || loading} onClick={handleSendOTP}>
                {loading ? "Sending..." : "Send verification code →"}
              </button>
            )}
            {otpSent && !otpVerified && (
              <>
                <div className="fade-up input-wrap">
                  <label className="input-label">Enter 6-digit OTP</label>
                  <input className="input-field" placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").substring(0, 6))} maxLength={6} style={{ letterSpacing: "0.3em", fontSize: 20, textAlign: "center" }} />
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                    Sent to {getPhone()} · <button onClick={() => { setOtpSent(false); setOtp(""); setError(""); }} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Change</button>
                  </p>
                </div>
                <button className="btn btn-gold" disabled={otp.length < 6 || loading} onClick={handleVerifyOTP}>
                  {loading ? "Verifying..." : "Verify OTP →"}
                </button>
              </>
            )}
            {otpVerified && (
              <>
                <div style={{ background: "var(--success-bg)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                  <span>✅</span><span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}>Phone verified!</span>
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

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <p className="section-label fade-up">Select your skills *</p>
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {SKILLS.map(s => (
                <button key={s} onClick={() => toggleSkill(s)} style={{ padding: "14px 12px", textAlign: "left", border: form.skills.includes(s) ? "1.5px solid var(--gold)" : "1px solid var(--border)", borderRadius: "var(--radius-md)", background: form.skills.includes(s) ? "var(--gold-light)" : "var(--bg-2)", cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: form.skills.includes(s) ? "var(--gold)" : "var(--text)" }}>{s}</div>
                  {form.skills.includes(s) && <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 4 }}>✓ Selected</div>}
                </button>
              ))}
            </div>
            <div className="fade-up-1 input-wrap">
              <label className="input-label">Years of experience *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Less than 1","1-3 years","3-5 years","5+ years"].map(e => (
                  <button key={e} onClick={() => update("experience", e)} style={{ flex: 1, padding: "9px 4px", border: form.experience === e ? "1.5px solid var(--gold)" : "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: form.experience === e ? "var(--gold-light)" : "none", fontSize: 10, fontWeight: 600, cursor: "pointer", color: form.experience === e ? "var(--gold)" : "var(--text-muted)" }}>{e}</button>
                ))}
              </div>
            </div>
            <div className="fade-up-2 input-wrap" style={{ marginBottom: 28 }}>
              <label className="input-label">Availability</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)} style={{ padding: "8px 12px", border: form.availability.includes(d) ? "1.5px solid var(--gold)" : "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: form.availability.includes(d) ? "var(--gold-light)" : "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: form.availability.includes(d) ? "var(--gold)" : "var(--text-muted)" }}>{d}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-gold fade-up-3" disabled={form.skills.length === 0 || !form.experience} onClick={() => setStep(4)}>
              Continue →
            </button>
          </>
        )}

        {/* STEP 4 — ID */}
        {step === 4 && (
          <>
            <div className="fade-up card-gold" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>🪪 Upload a clear photo of your government-issued ID. Required for verification.</p>
            </div>
            <div className="fade-up input-wrap">
              <label className="input-label">ID Type *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {["PhilSys ID","Driver's License","Passport","SSS ID","UMID","Voter's ID"].map(id => (
                  <button key={id} onClick={() => update("idType", id)} style={{ padding: "11px 14px", textAlign: "left", border: form.idType === id ? "1.5px solid var(--gold)" : "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: form.idType === id ? "var(--gold-light)" : "none", fontSize: 13, fontWeight: 600, cursor: "pointer", color: form.idType === id ? "var(--gold)" : "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                    {id} {form.idType === id && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>
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
                <button onClick={() => { update("idFile", null); update("idPreview", null); }} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 13, fontWeight: 600, marginTop: 8 }}>Remove & retake</button>
              </div>
            )}
            {!form.idPreview && cameraMode !== "id" && (
              <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <button onClick={() => openCamera("id")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "2px dashed var(--border-gold)", borderRadius: "var(--radius-lg)", padding: "24px 20px", cursor: "pointer", background: "var(--gold-light)" }}>
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--gold)" }}>Take photo of ID</span>
                </button>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px 20px", cursor: "pointer", background: "var(--bg-2)" }}>
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
            <button className="btn btn-gold fade-up-1" disabled={!form.idFile} onClick={() => setStep(5)}>
              Continue →
            </button>
          </>
        )}

        {/* STEP 5 — Selfie */}
        {step === 5 && (
          <>
            <div className="fade-up card-gold" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>🤳 Take a clear selfie. Admin will compare it with your ID to verify your identity.</p>
            </div>
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
                  <button onClick={() => { update("selfieFile", null); update("selfiePreview", null); }} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Retake selfie</button>
                </div>
              </div>
            )}
            {!form.selfiePreview && cameraMode !== "selfie" && (
              <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                <button onClick={() => openCamera("selfie")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "2px dashed var(--border-gold)", borderRadius: "var(--radius-lg)", padding: "28px 20px", cursor: "pointer", background: "var(--gold-light)" }}>
                  <span style={{ fontSize: 28 }}>📸</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--gold)" }}>Open camera</span>
                </button>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "14px 20px", cursor: "pointer", background: "var(--bg-2)" }}>
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
            {error && (
              <div style={{ background: "var(--danger-bg)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "var(--radius-md)", padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "var(--danger)" }}>
                {error}
              </div>
            )}
            <button className="btn btn-gold fade-up-1" disabled={loading} onClick={handleSubmit}>
              {loading ? "Submitting application..." : "Submit application 🚀"}
            </button>
            <button className="btn btn-outline fade-up-2" style={{ marginTop: 10 }} disabled={loading} onClick={handleSubmit}>
              Skip selfie & submit (testing)
            </button>
          </>
        )}

      </div>
    </div>
  );
}
