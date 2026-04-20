import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/services/api";

const AuthContext = createContext(undefined);

const STORAGE_KEY = "fc_auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user);
        setToken(parsed.token);
      }
    } catch {
      // ignore errors
    }
    setLoading(false);
  }, []);

  const persist = (u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
  };

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    persist(response.user, response.token);
    return response.user;
  };

  const signup = async (payload) => {
    return authApi.signup(payload);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (patch, newToken) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      const t = newToken || token;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: next, token: t }));
      if (newToken) setToken(newToken);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
