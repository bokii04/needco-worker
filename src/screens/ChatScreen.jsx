import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function ChatScreen() {
  const { navigate, user, activeJob } = useApp();
  const [messages, setMessages] = useState([
    { id: 1, sender: "customer", message: "Hi! Are you on your way?", time: "2:14 PM" },
    { id: 2, sender: "me", message: "Yes! I'll be there in about 5 minutes.", time: "2:15 PM" },
    { id: 3, sender: "customer", message: "Great, the gate is open. Just come right in.", time: "2:15 PM" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: "me", message: input.trim(), time: new Date().toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit" }) }]);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "var(--bg)" }}>
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate("activejob")}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Customer</div>
          <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>● Online</div>
        </div>
        <button onClick={() => navigate("activejob")} className="btn btn-outline btn-sm">Job details</button>
      </div>

      <div style={{ background: "var(--gold-light)", padding: "8px 16px", borderBottom: "1px solid var(--border-gold)" }}>
        <p style={{ fontSize: 11, color: "var(--gold)", margin: 0, textAlign: "center", fontWeight: 500 }}>
          🔒 Keep all payments inside Need.co for your protection
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map(msg => {
          const mine = msg.sender === "me";
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%", padding: "12px 16px",
                borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: mine ? "linear-gradient(135deg, var(--gold), var(--gold-mid))" : "var(--bg-3)",
                color: mine ? "var(--bg)" : "var(--text)",
                fontSize: 14, lineHeight: 1.5, fontWeight: mine ? 500 : 400
              }}>
                {msg.message}
              </div>
              <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{msg.time}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, background: "var(--bg-2)" }}>
        <input className="input-field" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ flex: 1, marginBottom: 0, background: "var(--bg-3)" }} />
        <button onClick={send} disabled={!input.trim()} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: input.trim() ? "linear-gradient(135deg, var(--gold), var(--gold-mid))" : "var(--bg-4)",
          border: "none", cursor: input.trim() ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: input.trim() ? "var(--bg)" : "var(--text-muted)",
          transition: "all 0.2s", flexShrink: 0
        }}>➤</button>
      </div>
    </div>
  );
}
