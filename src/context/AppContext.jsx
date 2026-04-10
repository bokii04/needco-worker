import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [screen, setScreen] = useState("splash");
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, jobs: 0, week: 0 });

  const saveAndSetUser = async (u) => {
    try {
      // Check existing user
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", u.id)
        .single();

      if (!existingUser) {
        await supabase.from("users").upsert({
          id: u.id,
          name: u.user_metadata?.full_name || u.email,
          phone: null,
          role: "worker",
          is_onboarded: false,
        }, { onConflict: "id" });
      }

      // Check worker profile
      const { data: workerData } = await supabase
        .from("workers")
        .select("*")
        .eq("user_id", u.id)
        .single();

      setWorker(workerData || null);

      setUser({
        id: u.id,
        name: existingUser?.name || u.user_metadata?.full_name || u.email,
        email: u.email,
        avatar: u.user_metadata?.avatar_url || null,
        role: "worker",
        is_onboarded: existingUser?.is_onboarded || false,
        initials: (existingUser?.name || u.user_metadata?.full_name || u.email || "W")
          .split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
      });

      // Route based on worker profile
      if (!workerData) {
        setScreen("onboarding");
      } else {
        setScreen("home");
      }

    } catch(e) {
      console.error("Auth error:", e);
      setUser({
        id: u.id,
        name: u.user_metadata?.full_name || u.email,
        email: u.email,
        avatar: u.user_metadata?.avatar_url || null,
        role: "worker",
        is_onboarded: false,
        initials: (u.user_metadata?.full_name || u.email || "W")
          .split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
      });
      setScreen("onboarding");
    }

    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
      setScreen("login");
    }, 4000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        await saveAndSetUser(session.user);
      } else {
        setLoading(false);
        setScreen("login");
      }
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
      setScreen("login");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await saveAndSetUser(session.user);
      } else {
        setUser(null);
        setWorker(null);
        setScreen("login");
      }
    });

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const navigate = (s) => setScreen(s);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWorker(null);
    navigate("login");
  };

  const toggleOnline = async (val) => {
    setIsOnline(val);
    if (worker?.id) {
      await supabase.from("workers").update({ is_available: val }).eq("id", worker.id);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0A0A0A", gap: 16 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: "#C9A84C" }}>Need.co</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>For Workers</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      screen, navigate, user, setUser, worker, setWorker,
      logout, isOnline, toggleOnline,
      activeJob, setActiveJob, earnings, setEarnings
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
