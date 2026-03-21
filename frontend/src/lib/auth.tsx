"use client";

import { createContext, useContext, useCallback, useEffect, useState, useRef, type ReactNode } from "react";

interface AuthState {
  user: { email: string } | null;
  token: string | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? "";
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "";
const REDIRECT_URI = typeof window !== "undefined"
  ? `${window.location.origin}/callback`
  : "";

const Ctx = createContext<AuthState>({
  user: null, token: null, loading: true,
  login: () => {}, logout: () => {},
});

/** Generate PKCE code verifier + challenge */
async function pkce() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  const verifier = btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge };
}

/** Decode JWT payload (no verification — Cognito already validated) */
function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const refreshTokenRef = useRef<string | null>(null);

  const setSession = useCallback((accessToken: string, refreshToken?: string) => {
    setToken(accessToken);
    if (refreshToken) refreshTokenRef.current = refreshToken;
    try {
      const claims = decodeJwt(accessToken);
      setUser({ email: (claims.email as string) ?? (claims.username as string) ?? "owner" });
      // Schedule refresh 60s before expiry
      const exp = (claims.exp as number) * 1000;
      const ms = exp - Date.now() - 60_000;
      if (ms > 0 && refreshTokenRef.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => refresh(), ms);
      }
    } catch { /* invalid token — ignore */ }
  }, []);

  const refresh = useCallback(async () => {
    if (!refreshTokenRef.current || !CLIENT_ID || !COGNITO_DOMAIN) return;
    try {
      const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: CLIENT_ID,
          refresh_token: refreshTokenRef.current,
        }),
      });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      setSession(data.access_token);
    } catch {
      setUser(null);
      setToken(null);
      refreshTokenRef.current = null;
    }
  }, [setSession]);

  // Exchange auth code on mount (callback page sets it in sessionStorage)
  useEffect(() => {
    const code = sessionStorage.getItem("ssb-auth-code");
    const verifier = sessionStorage.getItem("ssb-pkce-verifier");
    if (code && verifier && CLIENT_ID && COGNITO_DOMAIN) {
      sessionStorage.removeItem("ssb-auth-code");
      sessionStorage.removeItem("ssb-pkce-verifier");
      fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: CLIENT_ID,
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.access_token) setSession(data.access_token, data.refresh_token);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => clearTimeout(refreshTimer.current);
  }, [setSession]);

  const login = useCallback(async () => {
    if (!CLIENT_ID || !COGNITO_DOMAIN) return;
    const { verifier, challenge } = await pkce();
    sessionStorage.setItem("ssb-pkce-verifier", verifier);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: "openid email profile ssb-api/read ssb-api/write",
      code_challenge_method: "S256",
      code_challenge: challenge,
    });
    window.location.href = `${COGNITO_DOMAIN}/login?${params}`;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    refreshTokenRef.current = null;
    clearTimeout(refreshTimer.current);
    if (COGNITO_DOMAIN && CLIENT_ID) {
      window.location.href = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(window.location.origin)}`;
    }
  }, []);

  return (
    <Ctx.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
