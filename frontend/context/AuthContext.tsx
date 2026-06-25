"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { getMe } from "@/lib/api";
import { Role } from "@/types/user";

/* -----------------------------
   TYPES
------------------------------ */
type User = {
  id: string;
  username: string;
  role: Role;
  disabled?: boolean;
  zones?: string[];
  controls?: string[];
};

type AuthContextType = {
  user: User | null | undefined; // undefined = loading, null = unauthenticated, User = logged in
  token: string | null;
  loginUser: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

/* -----------------------------
   CONTEXT
------------------------------ */
const AuthContext = createContext<AuthContextType | null>(null);

/* -----------------------------
   PROVIDER
------------------------------ */
export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start as undefined to mark the initial boot-up/loading phase
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);

  /* -----------------------------
     LOGIN
  ------------------------------ */
  const loginUser = async (authToken: string) => {
    setToken(authToken);
    localStorage.setItem("smart-site-token", authToken);

    try {
      const me = await getMe();
      setUser(me);
    } catch (err) {
      console.error("Login verification failed:", err);
      logout();
    }
  };

  /* -----------------------------
     LOGOUT
  ------------------------------ */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("smart-site-token");

    // Clear session state cleanly before jumping pages
    window.location.href = "/login";
  };

  /* -----------------------------
     REFRESH USER
  ------------------------------ */
  const refreshUser = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (err) {
      console.error("GETME FAILED:", err);
      logout();
    }
  };

 /* -----------------------------
     INIT SESSION (RUN ONCE WITH MOBILE DIAGNOSTICS)
  ------------------------------ */
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("smart-site-token");

      if (!storedToken) {
        setUser(null); 
        return;
      }

      setToken(storedToken);

      try {
        const me = await getMe();
        
        if (me) {
          setUser(me);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        setUser(null);
        setToken(null);
        localStorage.removeItem("smart-site-token");
      }
    };

    init();
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loginUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* -----------------------------
   HOOK
------------------------------ */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}