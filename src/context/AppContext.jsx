import { createContext, useContext, useState, useEffect, useRef } from "react";
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
  const screenRef = useRef("splash");

  const setScreenSafe = (s) => {
    screenRef.current = s;
    setScreen(s);
  };

  const routeWorker = (workerData) => {
    if (!workerData) return "onboarding";
    if (workerData.status === "approved") return "home";
    if (workerData.status === "rejected") return "rejected";
    if (workerData.status === "pending" || workerData.status === "suspended") return "pending";
    return "onboarding";
  };

  const saveAndSetUser = async (u) => {
    try {
      // Get or create user
      let existingUser = null;
      try {
        const { data } = await supabase
          .from("users").select("*").eq("id", u.id).single();
        existingUser = data;
      } catch(e) {
        // User doesn't exist yet, create them
        await supabase.from("users").insert({
          id: u.id,
          name: u.user_metadata?.full_name || u.email,
          phone: null,
          role: "worker",
          is_onboarded: false,
        });
      }

      // Get worker profile
      let workerData = null;
      try {
        const { data } = await supabase
          .from("workers").select("*").eq("user_id", u.id).single();
        workerData = data;
      } catch(e) {
        // No worker profile yet - that's fine
        workerData = null;
      }

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

      // Only route if NOT already mid-onboarding
      if (screenRef.current !== "onboarding") {
        const destination = routeWorker(workerData);
        console.log("Routing to:", destination, "worker status:", workerData?.status);
        setScreenSafe(destination);
      }

    } catch(e) {
      console.error("saveAndSetUser error:", e);
      // Fallback — set basic user and go to onboarding only if no screen set
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
      if (screenRef.current !== "onboarding") {
        setScreenSafe("onboarding");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
      setScreenSafe("login");
    }, 4000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) await saveAndSetUser(session.user);
      else { setLoading(false); setScreenSafe("login"); }
    }).catch(() => {
      clearTimeout(timeout);
      setLoading(false);
      setScreenSafe("login");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, "screen:", screenRef.current);
      if (session?.user) {
        await saveAndSetUser(session.user);
      } else {
        setUser(null);
        setWorker(null);
        setScreenSafe("login");
      }
    });

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const navigate = (s) => setScreenSafe(s);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWorker(null);
    setScreenSafe("login");
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
