"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  login as apiLogin,
  logout as apiLogout,
  refreshToken as apiGetRefreshToken,
} from "@/services/authService";
import { api } from "@/services/api";
import type { User } from "@/types/user";

type AuthSession = {
  user: User;
  accessToken: string;
  refreshToken?: string;
};

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;

  loginProbe: (email: string, password: string) => Promise<AuthSession>;
  commitSession: (session: AuthSession) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE = {
  access: "token",
  refresh: "refreshToken",
  user: "user",
  syncLogout: "__app:logout",
};

const clearAuthClient = () => {
  try {
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
    localStorage.removeItem(STORAGE.user);
  } catch {}

  Cookies.remove(STORAGE.access);
  Cookies.remove(STORAGE.refresh);

  delete api.defaults.headers.common.Authorization;

  localStorage.setItem(STORAGE.syncLogout, String(Date.now()));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedAccess = localStorage.getItem(STORAGE.access);
        // const storedRefresh = localStorage.getItem(STORAGE.refresh);
        const storedUser = localStorage.getItem(STORAGE.user  );

        if (storedAccess) {
          api.defaults.headers.common.Authorization = `Bearer ${storedAccess}`;
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              setUser(null);
            }
          }
          setLoading(false);
          return;
        }
        setUser(null);
        setLoading(false);
      } catch {
        // clearAuthClient();
        setUser(null);
        setLoading(false);
      }
    })();

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE.syncLogout) {
        setUser(null);
        delete api.defaults.headers.common.Authorization;
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const loginProbe = async (email: string, password: string): Promise<AuthSession> => {
    const loginRes = await apiLogin({ email, password } as any);

    const accessToken =
      (loginRes as any)?.accessToken ?? (loginRes as any)?.data?.accessToken;
    const loginUser: User =
      (loginRes as any)?.user ?? (loginRes as any)?.data?.user;

    if (!accessToken) throw new Error("No access token received");
    if (!loginUser) throw new Error("No user payload in login response");

    return { user: loginUser, accessToken };
  };

  const commitSession = async (session: AuthSession) => {
    const { accessToken, refreshToken, user: loginUser } = session;

    localStorage.setItem(STORAGE.access, accessToken);
    if (refreshToken) localStorage.setItem(STORAGE.refresh, refreshToken);
    Cookies.set(STORAGE.access, accessToken, {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    });

    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    if (loginUser) {
      localStorage.setItem(STORAGE.user, JSON.stringify(loginUser));
      setUser(loginUser);
    }

  };

  const login = async (email: string, password: string): Promise<User> => {
    const session = await loginProbe(email, password);
    await commitSession(session);
    return session.user;
  };

  const logout = async () => {
    try {
      await apiLogout();
      clearAuthClient();
    } catch (err) {
      console.warn("Logout API failed:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, loginProbe, commitSession, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
